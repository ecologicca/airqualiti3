require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_KEY = '3f8a4d2a8875fb203575175662bb64d7';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

async function getLocationCoords(city) {
  const geoResponse = await axios.get(
    `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
  );
  return geoResponse.data[0];
}

async function updateMarch5thRecords() {
  try {
    // Get all records from March 5th, 2025
    const { data: march5Records, error: fetchError } = await supabase
      .from('weather_data')
      .select('created_at, city')  // Removed 'id' since it doesn't exist
      .gte('created_at', '2025-03-05 00:00:00+00')
      .lt('created_at', '2025-03-06 00:00:00+00')
      .order('created_at');

    if (fetchError) throw fetchError;
    console.log(`Found ${march5Records?.length || 0} records from March 5th`);

    if (!march5Records || march5Records.length === 0) {
      console.log('No records found to update');
      return;
    }

    // Calculate dates between Feb 28 and March 5
    const startDate = new Date('2024-02-28');
    const endDate = new Date('2024-03-05');
    const totalDays = 6; // 6 days from Feb 28 to March 5

    // Group records by city
    const citiesData = {};
    march5Records.forEach(record => {
      if (!citiesData[record.city]) {
        citiesData[record.city] = [];
      }
      citiesData[record.city].push(record);
    });

    const cities = Object.keys(citiesData);
    const citiesPerDay = Math.ceil(cities.length / totalDays);

    // Update records city by city
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      const dayOffset = Math.floor(i / citiesPerDay);
      const measurementDate = new Date(startDate);
      measurementDate.setDate(startDate.getDate() + dayOffset);

      // Update all records for this city
      for (const record of citiesData[city]) {
        const { error: updateError } = await supabase
          .from('weather_data')
          .update({ 
            date: measurementDate.toISOString().split('T')[0]
          })
          .eq('created_at', record.created_at)  // Using created_at instead of id
          .eq('city', record.city);  // Added city to ensure uniqueness

        if (updateError) {
          console.error(`Failed to update record for ${record.city} at ${record.created_at}:`, updateError);
        } else {
          console.log(`Updated ${record.city}: created_at ${record.created_at} → date set to ${measurementDate.toISOString().split('T')[0]}`);
        }
      }
    }

    console.log('\nUpdate complete!');

  } catch (error) {
    console.error('Error updating dates:', error);
    console.error('Error details:', error.message);
  }
}

updateMarch5thRecords(); 