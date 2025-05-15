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

async function fetchWAQIData(city) {
    try {
        console.log(`WAQI API request for ${city} starting...`);
        const response = await fetch(
            `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_TOKEN}`
        );
        
        if (!response.ok) {
            throw new Error(`WAQI API responded with status: ${response.status}`);
        }

        const waqiData = await response.json();
        console.log(`WAQI API raw response for ${city}:`, JSON.stringify(waqiData));
        
        if (waqiData.status !== 'ok' || !waqiData.data) {
            throw new Error(`WAQI API error: ${waqiData.status} - ${JSON.stringify(waqiData)}`);
        }

        // Check if we have the expected data structure
        if (!waqiData.data.iaqi) {
            throw new Error(`WAQI API missing iaqi data for ${city}: ${JSON.stringify(waqiData.data)}`);
        }

        const result = {
            pm25: waqiData.data.iaqi?.pm25?.v ? parseFloat(waqiData.data.iaqi.pm25.v) : null,
            pm10: waqiData.data.iaqi?.pm10?.v ? parseFloat(waqiData.data.iaqi.pm10.v) : null,
            no2: waqiData.data.iaqi?.no2?.v ? parseFloat(waqiData.data.iaqi.no2.v) : null,
            so2: waqiData.data.iaqi?.so2?.v ? parseFloat(waqiData.data.iaqi.so2.v) : null,
            co: waqiData.data.iaqi?.co?.v ? parseFloat(waqiData.data.iaqi.co.v) : null,
            aqi: waqiData.data.aqi,
            source: 'waqi'
        };

        console.log(`WAQI API processed data for ${city}:`, result);

        // Validate that we have at least some valid readings
        const hasValidData = Object.values(result).some(value => value !== null && value !== undefined);
        if (!hasValidData) {
            throw new Error(`No valid readings found in WAQI data for ${city}`);
        }

        return result;
    } catch (error) {
        console.error(`WAQI API error for ${city}:`, error.message);
        return null;
    }
}

async function fetchOpenWeatherData(city) {
    try {
        console.log(`OpenWeather API request for ${city} starting...`);
        const coords = await getLocationCoords(city);
        if (!coords) {
            throw new Error(`Could not get coordinates for city: ${city}`);
        }

        console.log(`Got coordinates for ${city}:`, coords);
        const response = await axios.get(
            `${OPENWEATHER_BASE_URL}/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}`
        );

        console.log(`OpenWeather API raw response for ${city}:`, JSON.stringify(response.data));

        if (!response.data || !response.data.list || !response.data.list[0]) {
            throw new Error(`Invalid OpenWeather API response structure for ${city}`);
        }

        // OpenWeather AQI conversion to match WAQI scale (they use 1-5 scale)
        const openWeatherToWAQI = {
            1: 25,  // Good
            2: 50,  // Fair
            3: 100, // Moderate
            4: 150, // Poor
            5: 300  // Very Poor
        };

        const aqiValue = openWeatherToWAQI[response.data.list[0].main.aqi] || null;

        const result = {
            pm25: response.data.list[0].components.pm2_5,
            pm10: response.data.list[0].components.pm10,
            no2: response.data.list[0].components.no2,
            so2: response.data.list[0].components.so2,
            co: response.data.list[0].components.co,
            aqi: aqiValue,
            source: 'openweather'
        };

        console.log(`OpenWeather API processed data for ${city}:`, result);
        return result;
    } catch (error) {
        console.error(`OpenWeather API error for ${city}:`, error.message);
        return null;
    }
}

async function fetchAirQualityData(city) {
    try {
        console.log(`Attempting to fetch data for ${city}...`);
        
        // Try WAQI API first
        console.log(`Trying WAQI API for ${city}...`);
        let readings = [];
        let primarySource = 'waqi';
        
        // Make multiple attempts with WAQI
        for (let i = 0; i < 3; i++) {
            const waqiData = await fetchWAQIData(city);
            if (waqiData) {
                readings.push(waqiData);
                if (i < 2) await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // If WAQI failed or returned incomplete data, try OpenWeather
        if (readings.length === 0) {
            console.log(`WAQI data not available for ${city}, trying OpenWeather...`);
            const openWeatherData = await fetchOpenWeatherData(city);
            if (openWeatherData) {
                readings = [openWeatherData];
                primarySource = 'openweather';
            }
        }

        if (readings.length === 0) {
            console.log(`No data available for ${city} from either API`);
            return null;
        }

        // Process metrics and handle potential outliers
        const processMetric = (metricName) => {
            const metricReadings = readings
                .map(r => r[metricName])
                .filter(v => v !== null && !isNaN(v));
            
            if (metricReadings.length === 0) return null;

            const validReadings = removeOutliers(metricReadings);
            return validReadings.length > 0 
                ? validReadings.reduce((a, b) => a + b, 0) / validReadings.length 
                : null;
        };

        // Calculate final values
        const result = {
            city: city,
            created_at: new Date().toISOString(),
            pm25: processMetric('pm25'),
            pm10: processMetric('pm10'),
            no2: processMetric('no2'),
            so2: processMetric('so2'),
            co: processMetric('co'),
            air_quality: processMetric('aqi'),
            data_source: primarySource
        };

        // Validate the result
        const hasValidData = result.pm25 !== null || result.air_quality !== null;
        if (!hasValidData) {
            console.log(`No valid metrics found for ${city} after processing`);
            return null;
        }

        console.log(`Successfully processed data for ${city} from ${primarySource}:`, result);
        return result;

    } catch (error) {
        console.error(`Error in fetchAirQualityData for ${city}:`, error);
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
                
                if (cityData) {
                    console.log(`Successfully fetched data for ${city}:`, cityData);
                    results.push(cityData);
                } else {
                    console.log(`No valid data available for ${city}, skipping...`);
                }
            } catch (error) {
                console.error(`Error fetching data for ${city}:`, error);
                // Continue with other cities even if one fails
            }
        }

        if (results.length === 0) {
            console.log('No data was successfully fetched for any cities');
            return { 
                success: false, 
                error: 'Failed to fetch data for any cities',
                citiesAttempted: cities
            };
        }

        console.log('Attempting to store data for cities:', results.map(r => r.city).filter(Boolean));
        const storedData = await storeDataInSupabase(results.filter(r => r && r.city));
        
        return { 
            success: true, 
            message: 'Data fetch and storage completed',
            citiesProcessed: results.map(r => r?.city).filter(Boolean),
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