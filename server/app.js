const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./routes/weatherRoutes');
const errorHandler = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');

const app = express();

// Apply rate limiting to all requests
app.use(limiter);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/weather', weatherRoutes);

// Error handling
app.use(errorHandler);

module.exports = app; 