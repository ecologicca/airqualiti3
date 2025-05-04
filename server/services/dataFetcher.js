const cron = require('node-cron');
const { supabase } = require('../db/database');
const AppError = require('../utils/AppError');

// Get cities from user_preferences table
async function getCities() {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('city', { count: 'exact', head: false })
        .is('city', 'not.null');
    
    if (error) {
        throw new AppError('Failed to fetch cities', 500);
    }
    
    // Get unique cities using Set
    const uniqueCities = [...new Set(data.map(item => item.city))];
    return uniqueCities;
}

async function fetchAirQualityData(city) {
    try {
        // Add delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(
            `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_TOKEN}`
        );
        
        if (response.status === 429) {
            // Wait longer if we hit rate limit
            await new Promise(resolve => setTimeout(resolve, 5000));
            throw new AppError('WAQI API rate limit exceeded, retrying after delay', 429);
        }
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
            if (data.data === 'Over quota') {
                logToFile('WAQI API quota exceeded, will retry next hour');
                throw new AppError('WAQI API quota exceeded', 429);
            }
            throw new Error(`Failed to fetch data for ${city}: ${data.data}`);
        }

        return {
            city,
            pm25: parseFloat(data.data.iaqi.pm25?.v) || null,
            pm10: parseFloat(data.data.iaqi.pm10?.v) || null,
            temp: parseFloat(data.data.iaqi.t?.v) || null,
            co: parseFloat(data.data.iaqi.co?.v) || null,    // float8
            o3: parseFloat(data.data.iaqi.o3?.v) || null,    // float8
            aqi: parseInt(data.data.aqi) || null,            // int2
            created_at: new Date().toISOString()
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error(`Error fetching data for ${city}:`, error);
        throw new AppError(`Failed to fetch data for ${city}`, 500);
    }
}

async function storeDataInSupabase(data) {
    try {
        console.log('Attempting to store data:', JSON.stringify(data, null, 2));
        
        // Validate data before insertion
        const validData = data.filter(item => {
            const isValid = item && item.city && 
                          (item.pm25 !== null || item.pm10 !== null || 
                           item.temp !== null || item.co !== null || 
                           item.o3 !== null || item.aqi !== null);
            
            if (!isValid) {
                console.warn('Invalid data item:', item);
            }
            return isValid;
        });

        if (validData.length === 0) {
            throw new Error('No valid data to insert');
        }

        const { data: insertedData, error } = await supabase
            .from('weather_data')
            .insert(validData)
            .select(); // Add this to get back the inserted data

        if (error) {
            console.error('Supabase insertion error:', error);
            throw new AppError('Failed to store data in database', 500);
        }

        console.log('Successfully stored data. Inserted rows:', insertedData.length);
        return insertedData;
    } catch (error) {
        console.error('Error in storeDataInSupabase:', error);
        throw error;
    }
}

// Function to manually trigger data fetch (for testing)
async function manualFetch() {
    try {
        console.log('Starting manual data fetch...');
        
        const cities = await getCities();
        console.log('Found cities:', cities);
        
        if (!cities || cities.length === 0) {
            throw new Error('No cities found to fetch data for');
        }

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