const path = require('path');
const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env file from:', envPath);
require('dotenv').config({ path: envPath });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const cron = require('node-cron');
const { fetchAndStoreWeatherData, getWeatherDataService } = require('./services/weatherService');
const { supabase } = require('./db/database');
const { manualFetch } = require('./services/dataFetcher');

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

// Handle React routing, return all requests to React app
app.get('*', function(req, res) {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return;
    }
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Define the getWeatherData handler
const getWeatherData = async (req, res) => {
  try {
    const { city, days = 7, metrics = ['pm25', 'pm10', 'temp', 'created_at'] } = req.query;
    const data = await getWeatherDataService({ city, days: parseInt(days), metrics });
    res.json(data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: error.message });
  }
};

// API Routes
app.get('/api/data', getWeatherData);
app.get('/dashboard', (req, res) => {
    res.send('Dashboard API is working');
});

// Test endpoint to manually trigger weather data fetch
app.get('/api/test-fetch', async (req, res) => {
  try {
    console.log('Manual fetch triggered at:', new Date().toISOString());
    const data = await fetchAndStoreWeatherData();
    console.log('Fetch successful, cities:', data.map(d => d.city).join(', '));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Manual fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Schedule data fetching daily at 6 AM
cron.schedule('0 6 * * *', async () => {
  try {
    const now = new Date();
    console.log('=== Starting daily weather data fetch ===');
    console.log('Time:', now.toISOString());
    
    const data = await fetchAndStoreWeatherData();
    
    console.log('Fetch successful!');
    console.log('Cities updated:', data.map(d => d.city).join(', '));
    console.log('Total records:', data.length);
    console.log('=== Weather data fetch complete ===\n');
  } catch (error) {
    console.error('!!! Daily cron job failed !!!');
    console.error('Time:', new Date().toISOString());
    console.error('Error:', error);
    console.error('!!! End of error report !!!\n');
  }
});

// Add backfill endpoint
app.get('/api/backfill', async (req, res) => {
  try {
    console.log('Starting data backfill...');
    const startDate = new Date('2024-02-28'); // Last data point
    const endDate = new Date();
    const dates = [];
    
    // Generate array of missing dates
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setHours(currentDate.getHours() + 8); // 3 times per day
    }

    console.log(`Attempting to backfill ${dates.length} data points`);
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(dates.length/batchSize)}`);
      
      const batchData = await fetchAndStoreWeatherData();
      results.push(...batchData);
      
      // Wait 2 seconds between batches to respect API rate limits
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('Backfill complete!');
    res.json({ 
      success: true, 
      totalPoints: results.length,
      dateRange: {
        from: startDate,
        to: endDate
      }
    });
  } catch (error) {
    console.error('Backfill failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Cron schedule: Daily at 6:00 AM');
}); 