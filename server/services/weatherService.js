const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const AppError = require('../utils/AppError');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_KEY = '3f8a4d2a8875fb203575175662bb64d7';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const cities = [
  'Toronto',
  'San Francisco',
  'New York',
  'Dallas', 
  'Boston',
  'Miami',
  'Houston',
  'Calgary',
  'Edmonton'
];

const getAirQualityLabel = (aqi) => {
  const labels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  return labels[aqi - 1] || 'Unknown';
};

const fetchCityData = async (city) => {
  try {
    // Get coordinates
    const geoResponse = await axios.get(
      `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    const [geoData] = geoResponse.data;

    if (!geoData) {
      throw new Error(`No location data found for ${city}`);
    }

    // Fetch both air quality and weather data
    const [airData, weatherData] = await Promise.all([
      axios.get(`${BASE_URL}/air_pollution?lat=${geoData.lat}&lon=${geoData.lon}&appid=${API_KEY}`),
      axios.get(`${BASE_URL}/weather?lat=${geoData.lat}&lon=${geoData.lon}&units=metric&appid=${API_KEY}`)
    ]);

    return {
      city: city,
      temp: weatherData.data.main.temp,
      pm25: airData.data.list[0].components.pm2_5,
      pm10: airData.data.list[0].components.pm10,
      air_quality: getAirQualityLabel(airData.data.list[0].main.aqi)
    };
  } catch (error) {
    console.error(`Error fetching data for ${city}:`, error);
    return null;
  }
};

exports.fetchAndStoreWeatherData = async () => {
  try {
    const results = await Promise.all(
      cities.map(city => fetchCityData(city))
    );
    
    const validResults = results.filter(result => result !== null);
    
    // Store in Supabase
    const { data, error } = await supabase
      .from('weather_data')
      .insert(validResults);

    if (error) throw error;
    
    return validResults;
  } catch (error) {
    console.error('Error in fetchAndStoreWeatherData:', error);
    throw error;
  }
};

const fetchHistoricalData = async (city, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('weather_data')
      .select('pm25, created_at')
      .eq('city', city)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

const calculateAverages = async (city) => {
  const now = new Date();
  
  // Calculate date ranges
  const ranges = {
    week: {
      current: [new Date(now - 7 * 24 * 60 * 60 * 1000), now],
      previous: [new Date(now - 14 * 24 * 60 * 60 * 1000), new Date(now - 7 * 24 * 60 * 60 * 1000)]
    },
    month: {
      current: [new Date(now - 30 * 24 * 60 * 60 * 1000), now],
      previous: [new Date(now - 60 * 24 * 60 * 60 * 1000), new Date(now - 30 * 24 * 60 * 60 * 1000)]
    },
    sixMonth: {
      current: [new Date(now - 180 * 24 * 60 * 60 * 1000), now],
      previous: [new Date(now - 360 * 24 * 60 * 60 * 1000), new Date(now - 180 * 24 * 60 * 60 * 1000)]
    },
    year: {
      current: [new Date(now - 365 * 24 * 60 * 60 * 1000), now],
      previous: [new Date(now - 730 * 24 * 60 * 60 * 1000), new Date(now - 365 * 24 * 60 * 60 * 1000)]
    },
    fourYear: {
      current: [new Date(now - 4 * 365 * 24 * 60 * 60 * 1000), now],
      previous: [new Date(now - 8 * 365 * 24 * 60 * 60 * 1000), new Date(now - 4 * 365 * 24 * 60 * 60 * 1000)]
    }
  };

  const averages = {};
  
  for (const [period, dateRange] of Object.entries(ranges)) {
    const currentData = await fetchHistoricalData(city, dateRange.current[0], dateRange.current[1]);
    const previousData = await fetchHistoricalData(city, dateRange.previous[0], dateRange.previous[1]);

    averages[period] = {
      current: currentData.reduce((acc, val) => acc + val.pm25, 0) / currentData.length,
      previous: previousData.reduce((acc, val) => acc + val.pm25, 0) / previousData.length
    };
  }

  return averages;
};

exports.calculateAverages = calculateAverages;

exports.getWeatherDataService = async ({ city, days, metrics }) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = supabase
      .from('weather_data')
      .select(metrics.join(','))
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true });

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(item => ({
      ...metrics.reduce((acc, metric) => ({
        ...acc,
        [metric]: item[metric]
      }), {}),
      timestamp: new Date(item.created_at)
    }));
  } catch (error) {
    console.error('Error in getWeatherDataService:', error);
    throw error;
  }
};

exports.getCitiesService = async () => {
    const { data, error } = await supabase
        .from('weather_data')
        .select('city')
        .distinct();

    if (error) {
        throw new AppError('Failed to fetch cities', 500);
    }

    return data.map(item => item.city);
};