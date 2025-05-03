require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');

// Debug environment variables
console.log('Environment variables loaded:', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

const cron = require('node-cron');
const { fetchAndStoreWeatherData, getWeatherDataService } = require('./services/weatherService');

// Retry function with exponential backoff
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

// Function to fetch and store weather data with logging
const fetchAndLogWeatherData = async (trigger = 'cron') => {
  try {
    console.log(`=== Starting weather data fetch (triggered by: ${trigger}) ===`);
    console.log('Time:', new Date().toISOString());
    
    const data = await retryWithBackoff(() => fetchAndStoreWeatherData());
    
    console.log('Fetch successful!');
    console.log('Cities updated:', data.map(d => d.city).join(', '));
    console.log('Total records:', data.length);
    console.log('=== Weather data fetch complete ===\n');
    return data;
  } catch (error) {
    console.error(`!!! ${trigger} fetch failed !!!`);
    console.error('Time:', new Date().toISOString());
    console.error('Error:', error);
    console.error('!!! End of error report !!!\n');
    throw error;
  }
};

const app = express();
app.use(cors());
app.use(express.json());

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
    const data = await fetchAndLogWeatherData('manual');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Manual fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Schedule data fetching twice per day
// At 6 AM and 6 PM
const cronSchedules = ['0 6 * * *', '0 18 * * *'];

cronSchedules.forEach(schedule => {
  cron.schedule(schedule, async () => {
    try {
      await fetchAndLogWeatherData('cron');
    } catch (error) {
      // Error is already logged in fetchAndLogWeatherData
    }
  });
});

// Fetch data immediately when server starts
setTimeout(async () => {
  try {
    await fetchAndLogWeatherData('server-start');
  } catch (error) {
    // Error is already logged in fetchAndLogWeatherData
  }
}, 5000); // Wait 5 seconds after server start

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