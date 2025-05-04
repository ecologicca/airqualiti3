import AirQualityCard from '../components/AirQualityCard';

// In your dashboard component
const Dashboard = () => {
  // ... your existing code ...

  const calculateIndoorData = (outdoorData) => {
    if (!outdoorData) return null;
    
    const hasEcologica = userPreferences?.has_ecologica;
    const reductionFactor = hasEcologica ? 0.5 : 0.7; // 50% reduction with Ecologica, 70% without

    return {
      air_quality: Math.round(outdoorData.air_quality * reductionFactor),
      'PM 2.5': (outdoorData['PM 2.5'] * reductionFactor).toFixed(1),
      'PM 10': outdoorData['PM 10'] ? (outdoorData['PM 10'] * reductionFactor).toFixed(1) : 'N/A',
      temp: outdoorData.temp, // Temperature stays the same indoors
      city: outdoorData.city,
      created_at: outdoorData.created_at
    };
  };

  const latestOutdoorData = data[0] ? {
    air_quality: data[0].aqi || calculateAQI(data[0]['PM 2.5']),
    'PM 2.5': data[0]['PM 2.5'],
    'PM 10': data[0]['PM 10'],
    temp: data[0].temperature,
    city: userPreferences?.city,
    created_at: data[0].created_at
  } : null;

  const latestIndoorData = calculateIndoorData(latestOutdoorData);

  return (
    <div className="dashboard">
      <div className="dashboard-title">
        <span>Air Quality Dashboard</span>
        <div className="refresh-container">
          {timeRemaining && (
            <span className="refresh-timer">
              Next refresh in: {formatTimeRemaining(timeRemaining)}
            </span>
          )}
        </div>
      </div>

      <div className="air-quality-cards" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem',
        margin: '1.5rem 0' 
      }}>
        <AirQualityCard 
          data={latestOutdoorData}
          type="outdoor"
          isLoading={isLoading || isRefreshing}
        />
        <AirQualityCard 
          data={latestIndoorData}
          type="indoor"
          isLoading={isLoading || isRefreshing}
        />
      </div>
      
      {/* ... other components ... */}
    </div>
  );
}; 