const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { setupCronJobs } = require('./services/cronService');
const { initializeSupabase } = require('./services/supabaseService');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize services
initializeSupabase();

// Log loaded environment variables
console.log('Environment variables loaded:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
  HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
  HAS_BETA_CODE: !!process.env.BETA_CODE
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Setup cron jobs
setupCronJobs();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error',
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Cron schedules (UTC):');
  console.log('- Morning: 0 6 * * *');
  console.log('- Evening: 0 18 * * *');
}); 