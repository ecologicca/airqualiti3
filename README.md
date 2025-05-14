# Air Quality Monitor

This application provides real-time air quality monitoring using the World Air Quality Index (WAQI) API.

## Setup

1. Get your WAQI API token from [WAQI API](https://aqicn.org/api/)
2. Create a `.env` file in the root directory
3. Add your WAQI API token to the `.env` file:
```
REACT_APP_WAQI_API_TOKEN=your_waqi_api_token_here
REACT_APP_DEFAULT_CITY=your_default_city_here
```

## Features

- Real-time air quality data from WAQI API
- 12-hour data caching for optimal performance
- PM2.5, PM10, and O3 measurements
- Temperature readings
- Health impact assessment
- Color-coded AQI indicators

## Usage

To use the WAQI Air Quality Gauge component in your application:

```jsx
import WAQIAirQualityGauge from './components/WAQIAirQualityGauge';

function App() {
  return (
    <WAQIAirQualityGauge city="beijing" />
  );
}
```

The component will automatically fetch and display air quality data for the specified city, with a 12-hour cache to minimize API calls.