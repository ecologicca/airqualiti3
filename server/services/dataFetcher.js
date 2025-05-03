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
    const { error } = await supabase
        .from('weather_data')
        .insert(data);

    if (error) {
        console.error('Error storing data in Supabase:', error);
        throw new AppError('Failed to store data in database', 500);
    }
}

// Function to manually trigger data fetch (for testing)
async function manualFetch() {
    try {
        console.log('Starting data fetch...');
        
        const cities = await getCities();
        console.log('Found cities:', cities);
        
        const dataPromises = cities.map(city => fetchAirQualityData(city));
        const cityData = await Promise.all(dataPromises);
        console.log('Fetched data:', cityData);
        
        await storeDataInSupabase(cityData);
        console.log('Successfully stored data in Supabase');
        
        return { 
            success: true, 
            message: 'Data fetch completed',
            cities: cities
        };
    } catch (error) {
        console.error('Error in manualFetch:', error);
        return { success: false, error: error.message };
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
    manualFetch
}; 