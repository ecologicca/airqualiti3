import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const getAirQualityLevel = (pm25) => {
  if (pm25 <= 12) return 'Good';
  if (pm25 <= 35.4) return 'Moderate';
  if (pm25 <= 55.4) return 'Unhealthy for Sensitive Groups';
  if (pm25 <= 150.4) return 'Unhealthy';
  if (pm25 <= 250.4) return 'Very Unhealthy';
  return 'Hazardous';
};

const getHealthMessage = (category) => {
  const messages = {
    'heart': 'This level of particulate matter can impact cardiovascular health over time.',
    'lungs': 'This level of particulate matter can affect respiratory function.',
    'brain': 'This level of particulate matter may influence cognitive performance.',
    'body': 'This level of particulate matter can affect overall health.'
  };
  return messages[category] || messages.heart;
};

const AirQualityDisplay = ({ city, category, year }) => {
  const [average, setAverage] = useState(null);
  const [previousYearAverage, setPreviousYearAverage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current year data
        const { data: currentData, error: currentError } = await supabase
          .from('weather_data')
          .select('pm25')
          .eq('city', city)
          .gte('created_at', `${year}-01-01`)
          .lte('created_at', `${year}-12-31`);

        if (currentError) throw currentError;

        // Fetch previous year data if viewing 2025
        if (year === 2025) {
          const { data: previousData, error: previousError } = await supabase
            .from('weather_data')
            .select('pm25')
            .eq('city', city)
            .gte('created_at', '2024-01-01')
            .lte('created_at', '2024-12-31');

          if (previousError) throw previousError;

          if (previousData && previousData.length > 0) {
            const prevAvg = previousData.reduce((sum, curr) => sum + curr.pm25, 0) / previousData.length;
            setPreviousYearAverage(prevAvg);
          }
        }

        if (currentData && currentData.length > 0) {
          const avg = currentData.reduce((sum, curr) => sum + curr.pm25, 0) / currentData.length;
          setAverage(avg);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        setIsLoading(false);
      }
    };

    if (city) {
      fetchData();
    }
  }, [city, year]);

  const getComparisonMessage = () => {
    if (!previousYearAverage || !average) return '';
    
    const percentChange = ((average - previousYearAverage) / previousYearAverage) * 100;
    const direction = percentChange > 0 ? 'increased' : 'decreased';
    const impact = direction === 'decreased' ? 'improving' : 'affecting';
    
    return `PM2.5 levels have ${direction} by ${Math.abs(percentChange).toFixed(1)}% compared to 2024, ${impact} cardiovascular health risks.`;
  };

  if (isLoading) return <div>Loading data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!average) return <div>No data available</div>;

  const circleColor = year === 2024 ? '#ffd699' : '#e6f4ea';
  const airQualityLevel = getAirQualityLevel(average);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h2 style={{
        color: '#043A24',
        fontSize: '1.75rem',
        marginBottom: '2rem'
      }}>
        Average PM2.5 Levels in {year}
      </h2>
      
      <div style={{
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        backgroundColor: circleColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{
          fontSize: '3rem',
          fontWeight: '500',
          color: '#043A24'
        }}>
          {average.toFixed(1)}
        </div>
        <div style={{
          fontSize: '1rem',
          color: '#666'
        }}>
          μg/m³
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <span style={{
          color: '#666',
          backgroundColor: '#f5f5f5',
          padding: '0.5rem 1rem',
          borderRadius: '20px'
        }}>
          City Average
        </span>
        <span style={{
          color: '#043A24',
          fontWeight: '500'
        }}>
          {airQualityLevel}
        </span>
      </div>

      <p style={{
        color: '#666',
        maxWidth: '600px',
        lineHeight: '1.5'
      }}>
        {year === 2025 
          ? getComparisonMessage()
          : 'This level of particulate matter can impact cardiovascular health over time.'}
      </p>
    </div>
  );
};

export default AirQualityDisplay; 