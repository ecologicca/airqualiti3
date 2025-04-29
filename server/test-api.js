const axios = require('axios');

const API_KEY = '3f8a4d2a8875fb203575175662bb64d7';
const city = 'Toronto'; // Test with one city

async function testAPI() {
  try {
    // Test geo API
    const geoResponse = await axios.get(
      `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    console.log('Geo API Response:', geoResponse.data);

    const [geoData] = geoResponse.data;
    if (!geoData) {
      throw new Error('No geo data returned');
    }

    // Test air quality API
    const airData = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${geoData.lat}&lon=${geoData.lon}&appid=${API_KEY}`
    );
    console.log('Air Quality API Response:', airData.data);

  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
  }
}

testAPI(); 