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

// Function to log to file
const logToFile = (message) => {
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `cron-${date}.log`);
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  
  fs.appendFileSync(logFile, logMessage);
  console.log(message); // Also log to console
};

// Track last fetch time to prevent duplicate calls
let lastFetchTime = 0;
const MINIMUM_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to fetch and store weather data with logging
const fetchAndLogWeatherData = async (trigger = 'cron') => {
  const now = Date.now();
  
  // Prevent fetching if it's been less than 5 minutes since last fetch
  if (now - lastFetchTime < MINIMUM_FETCH_INTERVAL) {
    logToFile(`Skipping fetch - last fetch was ${Math.round((now - lastFetchTime) / 1000)} seconds ago`);
    return;
  }
  
  try {
    logToFile(`=== Starting weather data fetch (triggered by: ${trigger}) ===`);
    lastFetchTime = now;
    
    const result = await manualFetch();
    
    if (result.success) {
      logToFile('Fetch successful!');
      logToFile('Cities updated: ' + result.cities.join(', '));
      logToFile('=== Weather data fetch complete ===\n');
      return result;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    logToFile(`!!! ${trigger} fetch failed !!!`);
    logToFile('Error: ' + error.message);
    logToFile('!!! End of error report !!!\n');
    throw error;
  }
};

const app = express();

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',  // Development
    'http://localhost:3001',  // Development alternative port
    process.env.FRONTEND_URL, // Production frontend URL (set this in Render env vars once you have it)
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));

app.use(express.json());

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

// Schedule data fetching twice per day at 6 AM and 6 PM UTC
const cronSchedules = ['0 6 * * *', '0 18 * * *'];

cronSchedules.forEach(schedule => {
  cron.schedule(schedule, async () => {
    try {
      logToFile(`Cron job started (Schedule: ${schedule})`);
      await fetchAndLogWeatherData('cron');
    } catch (error) {
      // Error is already logged in fetchAndLogWeatherData
    }
  }, {
    timezone: 'UTC' // Explicitly set timezone to UTC
  });
});

// Wait 30 seconds before initial fetch to ensure everything is properly initialized
setTimeout(async () => {
  try {
    await fetchAndLogWeatherData('server-start');
  } catch (error) {
    // Error is already logged in fetchAndLogWeatherData
  }
}, 30000); // 30 second delay

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logToFile(`Server running on port ${PORT}`);
  logToFile('Cron schedules (UTC):');
  cronSchedules.forEach(schedule => {
    logToFile(`- ${schedule}`);
  });
}); 