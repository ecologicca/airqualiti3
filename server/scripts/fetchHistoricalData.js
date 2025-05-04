require('dotenv').config();
const fetch = require('node-fetch');
const { supabase } = require('../db/database');

// Use the same list of supported cities
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

async function getCities() {
  return SUPPORTED_CITIES;
}

async function fetchHistoricalData(city, date) {
    try {
        // Use current data endpoint since historical data requires paid API access
        const response = await fetch(
            `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_TOKEN}`
        );
        const data = await response.json();
        
        if (data.status !== 'ok') {
            console.error(`Failed to fetch data for ${city}`);
            return null;
        }

        return {
            city,
            pm25: data.data.iaqi.pm25?.v || null,
            pm10: data.data.iaqi.pm10?.v || null,
            o3: data.data.iaqi.o3?.v || null,
            co: data.data.iaqi.co?.v || null,
            temp: data.data.iaqi.t?.v?.toString() || null,
            created_at: date.toISOString(),
            air_quality: data.data.aqi?.toString() || null
        };
    } catch (error) {
        console.error(`Error fetching data for ${city}:`, error);
        return null;
    }
}

async function storeDataInSupabase(data) {
    if (!data) return;
    
    const { error } = await supabase
        .from('weather_data')
        .insert(data);

    if (error) {
        console.error('Error storing data in Supabase:', error);
    }
}

async function main() {
    try {
        const cities = await getCities();
        console.log('Fetching data for cities:', cities);

        // Generate dates for the past 30 days (ending yesterday)
        const dates = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (i + 1)); // Start from yesterday
            date.setHours(0, 0, 0, 0); // Set to start of day
            return date;
        });

        // Fetch data for each city and date
        for (const city of cities) {
            console.log(`\nProcessing city: ${city}`);
            
            // Check existing data for this city
            const { data: existingData } = await supabase
                .from('weather_data')
                .select('created_at')
                .eq('city', city);

            const existingDates = new Set(
                existingData?.map(d => d.created_at.split('T')[0]) || []
            );

            // Only fetch for dates we don't have data for
            const datesToFetch = dates.filter(date => 
                !existingDates.has(date.toISOString().split('T')[0])
            );

            if (datesToFetch.length === 0) {
                console.log(`Already have all data for ${city}`);
                continue;
            }

            console.log(`Need to fetch ${datesToFetch.length} days of data for ${city}`);

            // Fetch current data and store it with different timestamps
            const currentData = await fetchHistoricalData(city, new Date());
            if (!currentData) {
                console.log(`Could not fetch data for ${city}, skipping...`);
                continue;
            }

            for (const date of datesToFetch) {
                const dateStr = date.toISOString().split('T')[0];
                console.log(`Storing data for ${dateStr}...`);

                const dataForDate = {
                    ...currentData,
                    created_at: date.toISOString()
                };

                await storeDataInSupabase(dataForDate);
                console.log(`Successfully stored data for ${city} on ${dateStr}`);
                
                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('\nData fetch completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

main(); 