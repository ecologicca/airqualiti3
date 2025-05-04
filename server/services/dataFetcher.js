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

// Modify the existing fetchAirQualityData function
async function fetchAirQualityData(city) {
    try {
        // Try WAQI first
        const response = await fetch(
            `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_TOKEN}`
        );
        
        const data = await response.json();
        
        let pm25 = data.data?.iaqi?.pm25?.v || null;
        let pm10 = data.data?.iaqi?.pm10?.v || null;
        let no2 = data.data?.iaqi?.no2?.v || null;
        let so2 = data.data?.iaqi?.so2?.v || null;
        let co = data.data?.iaqi?.co?.v || null;

        // If either PM2.5 or PM10 is null, try OpenWeather
        if (pm25 === null || pm10 === null) {
            console.log(`PM2.5 or PM10 data missing for ${city}, trying OpenWeather...`);
            const owData = await fetchOpenWeatherAirQuality(city);
            if (owData) {
                // Only replace null values
                pm25 = pm25 === null ? owData.pm25 : pm25;
                pm10 = pm10 === null ? owData.pm10 : pm10;
                no2 = no2 === null ? owData.no2 : no2;
                so2 = so2 === null ? owData.so2 : so2;
                co = co === null ? owData.co : co;
            }
        }

        return {
            city: city,
            station_id: data.data?.idx || null,
            created_at: data.data?.time?.s || new Date().toISOString(),
            pm25: pm25 ? parseFloat(pm25) : null,
            pm10: pm10 ? parseFloat(pm10) : null,
            air_quality: data.data?.aqi?.toString() || null,
            temp: data.data?.iaqi?.t?.v?.toString() || null,
            co: co ? parseFloat(co) : null,
            no2: no2 ? parseFloat(no2) : null,
            so2: so2 ? parseFloat(so2) : null
        };
    } catch (error) {
        console.error(`Error fetching data for ${city}:`, error);
        
        // Try OpenWeather as complete fallback
        console.log(`Trying OpenWeather as complete fallback for ${city}...`);
        const owData = await fetchOpenWeatherAirQuality(city);
        if (owData) {
            return {
                city: city,
                station_id: null,
                created_at: new Date().toISOString(),
                pm25: parseFloat(owData.pm25),
                pm10: parseFloat(owData.pm10),
                air_quality: null,
                temp: null,
                co: parseFloat(owData.co),
                no2: parseFloat(owData.no2),
                so2: parseFloat(owData.so2)
            };
        }
        
        throw new AppError(`Failed to fetch data for ${city} from both sources`, 500);
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

        // Log the exact data being sent to Supabase
        console.log('Validated data for insertion:', JSON.stringify(validData, null, 2));

        const { data: insertedData, error } = await supabase
            .from('weather_data')
            .insert(validData)
            .select(); // Add this to get back the inserted data

        if (error) {
            // Log more details about the error
            console.error('Supabase insertion error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw new AppError(`Failed to store data in database: ${error.message}`, 500);
        }

        console.log('Successfully stored data. Inserted rows:', insertedData.length);
        return insertedData;
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