const path = require('path');
const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env file from:', envPath);
require('dotenv').config({ path: envPath });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const cron = require('node-cron');
const { supabase } = require('./db/database');
const { manualFetch } = require('./services/dataFetcher');
const { requireBetaAccess, registerBetaUser } = require('./utils/auth');

// Debug environment variables
console.log('Environment variables loaded:', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  HAS_WAQI_KEY: !!process.env.WAQI_API_TOKEN,
  HAS_BETA_CODE: !!process.env.BETA_INVITE_CODE
});

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Track last fetch time to prevent duplicate calls
let lastFetchTime = 0;
const MINIMUM_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Function to fetch and store weather data with retries
const fetchAndLogWeatherData = async (trigger = 'cron') => {
  const now = Date.now();
  
  // Prevent fetching if it's been less than 5 minutes
  if (now - lastFetchTime < MINIMUM_FETCH_INTERVAL) {
    console.log(`Skipping fetch - last fetch was ${Math.round((now - lastFetchTime) / 1000)} seconds ago`);
    return;
  }
  
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`=== Starting weather data fetch (triggered by: ${trigger}) [Attempt ${retryCount + 1}/${MAX_RETRIES}] ===`);
      lastFetchTime = now;
      
      const result = await manualFetch();
      
      if (result.success) {
        console.log('Fetch successful!');
        console.log(`Cities updated: ${result.citiesProcessed.join(', ')}`);
        console.log(`Total records: ${result.storedDataCount}`);
        console.log('=== Weather data fetch complete ===\n');
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      retryCount++;
      console.error(`!!! Attempt ${retryCount}/${MAX_RETRIES} failed !!!`);
      console.error('Error: ' + error.message);
      
      if (retryCount < MAX_RETRIES) {
        const delay = retryCount * 30000; // Exponential backoff: 30s, 60s, 90s
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('!!! All retry attempts failed !!!\n');
        throw error;
      }
    }
  }
};

const app = express();

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',  // Development
    'http://localhost:3001',  // Development alternative port
    'https://airqualiti3.onrender.com', // Your Render domain
    process.env.FRONTEND_URL, // Production frontend URL (if different)
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('Blocked origin:', origin); // Debug logging
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));

app.use(express.json());

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, '../build')));

// Health check endpoint for Render
app.get('/app-health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Beta registration endpoint
app.post('/api/beta/register', async (req, res) => {
  try {
    const { email, inviteCode } = req.body;
    
    if (!email || !inviteCode) {
      return res.status(400).json({
        error: 'Email and invite code are required'
      });
    }

    const result = await registerBetaUser(email, inviteCode);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      error: error.message
    });
  }
});

// Protected API Routes - require beta access
app.use('/api/data', requireBetaAccess);
app.use('/api/test-fetch', requireBetaAccess);

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    const { city, days = 7, metrics = ['pm25', 'pm10', 'temp', 'created_at'] } = req.query;
    const { data, error } = await supabase
      .from('weather_data')
      .select(metrics.join(','))
      .eq('city', city)
      .order('created_at', { ascending: false })
      .limit(parseInt(days));

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to manually trigger weather data fetch
app.get('/api/test-fetch', async (req, res) => {
  try {
    const data = await fetchAndLogWeatherData('manual');
    res.json(data);
  } catch (error) {
    console.error('Manual fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this route to handle cron job triggers
app.post('/api/fetch-data', async (req, res) => {
  try {
    console.log('Manual data fetch triggered by cron job');
    await fetchAndLogWeatherData('cron');
    res.json({ success: true, message: 'Data fetch completed' });
  } catch (error) {
    console.error(`Error in manual data fetch: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle React routing, return all requests to React app
app.get('*', function(req, res) {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return;
    }
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Schedule data fetching twice per day
const schedules = [
  { time: '0 6 * * *', label: 'Morning' },  // 6:00 UTC
  { time: '0 18 * * *', label: 'Evening' }  // 18:00 UTC
];

// Initialize cron jobs with error handling
schedules.forEach(({ time, label }) => {
  cron.schedule(time, async () => {
    try {
      console.log(`${label} cron job started (Schedule: ${time})`);
      await fetchAndLogWeatherData('cron');
    } catch (error) {
      console.error(`${label} cron job failed: ${error.message}`);
    }
  }, {
    timezone: 'UTC',
    scheduled: true,
    runOnInit: false // Don't run immediately on server start
  });
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Cron schedules (UTC):');
  schedules.forEach(({ time, label }) => {
    console.log(`- ${label}: ${time}`);
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 