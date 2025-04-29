const cron = require('node-cron');
const { supabase } = require('../db/database');
const AppError = require('../utils/AppError');

// Get cities from user_preferences table
async function getCities() {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('city')
        .distinct();
    
    if (error) {
        throw new AppError('Failed to fetch cities', 500);
    }
    
    return data.map(item => item.city);
}

async function fetchAirQualityData(city) {
    try {
        const response = await fetch(
            `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_TOKEN}`
        );
        const data = await response.json();
        
        if (data.status !== 'ok') {
            throw new Error(`Failed to fetch data for ${city}`);
        }

        // Match your existing schema
        return {
            city,
            pm25: data.data.iaqi.pm25?.v || null,
            pm10: data.data.iaqi.pm10?.v || null,
            temp: data.data.iaqi.t?.v?.toString() || null, // stored as text in your schema
            created_at: new Date().toISOString(),
            air_quality: data.data.aqi?.toString() || null // stored as text
        };
    } catch (error) {
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

// Schedule daily data fetch at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Starting daily data fetch...');
    
    try {
        // Get cities from database
        const cities = await getCities();
        console.log('Fetching data for cities:', cities);

        // Fetch data for all cities
        const dataPromises = cities.map(city => fetchAirQualityData(city));
        const cityData = await Promise.all(dataPromises);
        
        // Store all data in Supabase
        await storeDataInSupabase(cityData);
        
        console.log('Daily data fetch completed successfully');
    } catch (error) {
        console.error('Error in daily data fetch:', error);
    }
});

// Function to manually trigger data fetch (for testing)
async function manualFetch() {
    try {
        const cities = await getCities();
        const dataPromises = cities.map(city => fetchAirQualityData(city));
        const cityData = await Promise.all(dataPromises);
        await storeDataInSupabase(cityData);
        return { 
            success: true, 
            message: 'Data fetch completed',
            cities: cities
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    manualFetch
}; 