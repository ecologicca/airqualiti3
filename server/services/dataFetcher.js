const fetch = require('node-fetch');
const axios = require('axios');
const cron = require('node-cron');
const { supabase } = require('../db/database');
const AppError = require('../utils/AppError');
const SUPPORTED_CITIES = [
  'Boston',
  'Calgary',
  'Dallas',
  'Edmonton',
  'Houston',
  'Miami',
  'New York',
  'San Francisco',
  'Toronto'
];

// Add OpenWeather API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

async function getCities() {
  return SUPPORTED_CITIES;
}

// Add function to get coordinates for a city
async function getLocationCoords(city) {
    const response = await axios.get(
        `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );
    return response.data[0];
}

// Add function to fetch OpenWeather air quality data
async function fetchOpenWeatherAirQuality(city) {
    try {
        const coords = await getLocationCoords(city);
        if (!coords) {
            console.log(`No coordinates found for ${city}`);
            return null;
        }

        const response = await axios.get(
            `${OPENWEATHER_BASE_URL}/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}`
        );

        return {
            pm25: response.data.list[0].components.pm2_5,
            pm10: response.data.list[0].components.pm10,
            no2: response.data.list[0].components.no2,
            so2: response.data.list[0].components.so2,
            co: response.data.list[0].components.co
        };
    } catch (error) {
        console.error(`Error fetching OpenWeather data for ${city}:`, error);
        return null;
    }
}

// Helper function to remove outliers using IQR method
function removeOutliers(readings) {
    if (readings.length < 4) return readings;

    // Sort the readings
    readings.sort((a, b) => a - b);

    // Calculate Q1 and Q3
    const q1 = readings[Math.floor(readings.length / 4)];
    const q3 = readings[Math.floor(readings.length * 3 / 4)];

    // Calculate IQR and bounds
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Filter out outliers
    return readings.filter(x => x >= lowerBound && x <= upperBound);
}

async function fetchAirQualityData(city) {
    try {
        // Get multiple readings over a short period
        const readings = [];
        const numReadings = 3; // Number of readings to average
        const delayBetweenReadings = 2000; // 2 seconds between readings

        for (let i = 0; i < numReadings; i++) {
            const response = await fetch(
                `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_TOKEN}`
            );
            const data = await response.json();
            
            // Store both raw and processed readings
            if (data.data?.iaqi?.pm25?.v) {
                readings.push({
                    pm25: parseFloat(data.data.iaqi.pm25.v),
                    pm10: data.data?.iaqi?.pm10?.v ? parseFloat(data.data.iaqi.pm10.v) : null,
                    no2: data.data?.iaqi?.no2?.v ? parseFloat(data.data.iaqi.no2.v) : null,
                    so2: data.data?.iaqi?.so2?.v ? parseFloat(data.data.iaqi.so2.v) : null,
                    co: data.data?.iaqi?.co?.v ? parseFloat(data.data.iaqi.co.v) : null,
                });
            }
            
            // Wait before next reading
            if (i < numReadings - 1) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenReadings));
            }
        }

        if (readings.length === 0) {
            console.log(`No valid readings obtained for ${city}`);
            return null;
        }

        // Process each metric separately
        const processMetric = (metricName) => {
            const metricReadings = readings
                .map(r => r[metricName])
                .filter(v => v !== null);
            
            if (metricReadings.length === 0) return null;

            const validReadings = removeOutliers(metricReadings);
            return validReadings.length > 0 
                ? validReadings.reduce((a, b) => a + b, 0) / validReadings.length 
                : null;
        };

        // Calculate smoothed values for each metric
        const smoothedData = {
            pm25: processMetric('pm25'),
            pm10: processMetric('pm10'),
            no2: processMetric('no2'),
            so2: processMetric('so2'),
            co: processMetric('co'),
        };

        return {
            city: city,
            created_at: new Date().toISOString(),
            ...smoothedData,
            raw_pm25: readings[0]?.pm25 || null, // Store the first raw reading
            air_quality: data.data?.aqi?.toString() || null,
        };
    } catch (error) {
        console.error(`Error fetching data for ${city}:`, error);
        return null;
    }
}

async function storeDataInSupabase(data) {
    try {
        console.log('Attempting to store data:', JSON.stringify(data, null, 2));
        
        // Validate data before insertion
        const validData = data.filter(item => {
            const isValid = item && 
                          item.city && 
                          (item.pm25 !== null || 
                           item.air_quality !== null);
            
            if (!isValid) {
                console.warn('Invalid data item:', item);
            }
            return isValid;
        });

        if (validData.length === 0) {
            throw new Error('No valid data to insert');
        }

        // Round timestamps to the nearest hour and ensure UTC timezone
        const processedData = validData.map(item => {
            const date = new Date(item.created_at);
            date.setUTCMinutes(0, 0, 0); // Set minutes, seconds, milliseconds to 0 in UTC
            return {
                ...item,
                created_at: date.toISOString()
            };
        });

        // Log the exact data being sent to Supabase
        console.log('Processed data for insertion:', JSON.stringify(processedData, null, 2));

        // First check for existing records
        for (const record of processedData) {
            const { data: existingData } = await supabase
                .from('weather_data')
                .select('id')
                .eq('created_at', record.created_at)
                .eq('city', record.city)
                .single();

            if (existingData) {
                // Update existing record
                const { error: updateError } = await supabase
                    .from('weather_data')
                    .update({
                        pm25: record.pm25,
                        pm10: record.pm10,
                        air_quality: record.air_quality,
                        temp: record.temp,
                        co: record.co,
                        no2: record.no2,
                        so2: record.so2
                    })
                    .eq('id', existingData.id);

                if (updateError) {
                    console.warn(`Error updating record for ${record.city}:`, updateError);
                }
            } else {
                // Insert new record
                const { error: insertError } = await supabase
                    .from('weather_data')
                    .insert([record]);

                if (insertError) {
                    console.warn(`Error inserting record for ${record.city}:`, insertError);
                }
            }
        }

        console.log('Successfully processed all records');
        return processedData;
    } catch (error) {
        console.error('Full error in storeDataInSupabase:', {
            message: error.message,
            stack: error.stack,
            details: error.details,
            code: error.code
        });
        throw error;
    }
}

// Function to manually trigger data fetch (for testing)
async function manualFetch() {
    try {
        console.log('Starting manual data fetch...');
        
        const cities = await getCities();
        console.log('Fetching data for cities:', cities);
        
        const results = [];
        // Fetch cities sequentially to avoid rate limits
        for (const city of cities) {
            try {
                console.log(`Fetching data for ${city}...`);
                const cityData = await fetchAirQualityData(city);
                console.log(`Successfully fetched data for ${city}:`, cityData);
                results.push(cityData);
            } catch (error) {
                console.error(`Error fetching data for ${city}:`, error);
                // Continue with other cities even if one fails
            }
        }

        if (results.length === 0) {
            throw new Error('Failed to fetch data for any cities');
        }

        console.log('Attempting to store data for cities:', results.map(r => r.city));
        const storedData = await storeDataInSupabase(results);
        
        return { 
            success: true, 
            message: 'Data fetch and storage completed',
            citiesProcessed: results.map(r => r.city),
            storedDataCount: storedData.length
        };
    } catch (error) {
        console.error('Error in manualFetch:', error);
        return { 
            success: false, 
            error: error.message,
            details: error.stack
        };
    }
}

async function verifyDataStorage(cities) {
    try {
        const now = new Date();
        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
        
        const { data, error } = await supabase
            .from('weather_data')
            .select('*')
            .gte('created_at', fiveMinutesAgo.toISOString())
            .in('city', cities);

        if (error) {
            console.error('Error verifying data storage:', error);
            return false;
        }

        console.log('Recently stored data:', data);
        return data.length > 0;
    } catch (error) {
        console.error('Error in verifyDataStorage:', error);
        return false;
    }
}

// Add this to make the script runnable directly
if (require.main === module) {
    console.log('Running data fetcher directly...');
    manualFetch()
        .then(result => {
            console.log('Fetch result:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = {
    manualFetch,
    verifyDataStorage
}; 