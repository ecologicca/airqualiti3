import React from 'react';
import '../styles/AirQualityCard.css';

const AirQualityCard = ({ data, type, isLoading }) => {
  // Function to determine AQI color and label
  const getAqiInfo = (aqi) => {
    if (aqi <= 50) {
      return { color: '#10B981', label: 'Good', bgColor: '#E7F9F0' };
    } else if (aqi <= 100) {
      return { color: '#F59E0B', label: 'Moderate', bgColor: '#FEF3C7' };
    } else if (aqi <= 150) {
      return { color: '#F97316', label: 'Unhealthy for Sensitive Groups', bgColor: '#FEE4E2' };
    } else if (aqi <= 200) {
      return { color: '#EF4444', label: 'Unhealthy', bgColor: '#FEE2E2' };
    } else if (aqi <= 300) {
      return { color: '#9333EA', label: 'Very Unhealthy', bgColor: '#F3E8FF' };
    } else {
      return { color: '#7F1D1D', label: 'Hazardous', bgColor: '#FEE2E2' };
    }
  };

  // Get aqi info if data exists
  const aqiInfo = data ? getAqiInfo(data.air_quality) : undefined;

  return (
    <div className="air-quality-card">
      {/* Card Header */}
      <div className="card-header">
        <div className="header-title">
          <span className="icon">
            {type === 'indoor' ? '🏠' : '🌤️'}
          </span>
          <h3>{type === 'indoor' ? 'Indoor' : 'Outdoor'} Air Quality</h3>
        </div>
        <span className="timestamp">
          {data ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Updating data...</p>
        </div>
      )}

      {/* Data Display */}
      {!isLoading && data && (
        <>
          {/* AQI Meter */}
          <div className="aqi-meter">
            <div className="aqi-header">
              <div>
                <p className="label">Air Quality Index</p>
                <div className="aqi-value">
                  <span className="number" style={{ color: aqiInfo?.color }}>{data.air_quality}</span>
                  <span className="description" style={{ color: aqiInfo?.color }}>{aqiInfo?.label}</span>
                </div>
              </div>
              <div 
                className="aqi-circle"
                style={{ backgroundColor: aqiInfo?.color }}
              >
                {Math.round(data.air_quality / 5)}
              </div>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress"
                style={{ 
                  width: `${Math.min(100, (data.air_quality / 500) * 100)}%`,
                  backgroundColor: aqiInfo?.color 
                }}
              ></div>
            </div>
          </div>

          {/* Pollutant Grid */}
          <div className="pollutant-grid">
            <div className="pollutant-item">
              <div className="pollutant-label">PM2.5</div>
              <div className="pollutant-value">{data['PM 2.5']} µg/m³</div>
            </div>
            <div className="pollutant-item">
              <div className="pollutant-label">PM10</div>
              <div className="pollutant-value">{data['PM 10'] || 'N/A'} µg/m³</div>
            </div>
            <div className="pollutant-item">
              <div className="pollutant-label">Temperature</div>
              <div className="pollutant-value">{data.temp}°C</div>
            </div>
            <div className="pollutant-item">
              <div className="pollutant-label">City</div>
              <div className="pollutant-value">{data.city}</div>
            </div>
          </div>

          {/* Health Impact */}
          <div className="health-impact">
            <p className="impact-label">Health Impact</p>
            <p className="impact-description">
              {data.air_quality <= 50 && "Air quality is considered satisfactory, with minimal pollutants."}
              {data.air_quality > 50 && data.air_quality <= 100 && "Air quality is acceptable; however, some pollutants may be a concern for very sensitive individuals."}
              {data.air_quality > 100 && data.air_quality <= 150 && "Members of sensitive groups may experience health effects."}
              {data.air_quality > 150 && data.air_quality <= 200 && "Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects."}
              {data.air_quality > 200 && "Health warnings of emergency conditions. The entire population is more likely to be affected."}
            </p>
          </div>
        </>
      )}

      {/* No Data State */}
      {!isLoading && !data && (
        <div className="no-data">
          <span className="icon">💨</span>
          <p>No data available</p>
          <button className="refresh-button">Refresh Data</button>
        </div>
      )}
    </div>
  );
};

export default AirQualityCard; 