import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { supabase } from '../../supabaseClient';
import ChartLegend from './ChartLegend';

const CognitiveRiskChart = ({ userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Constants for cognitive risk calculation
  const WHO_THRESHOLD = 10; // WHO guideline for PM2.5
  const ROLLING_DAYS = 90; // Fixed 90-day rolling average

  const calculateRollingAverage = (data, index) => {
    const windowData = data.slice(Math.max(0, index - ROLLING_DAYS + 1), index + 1);
    return windowData.reduce((sum, day) => sum + day.pm25, 0) / windowData.length;
  };

  const calculateCognitiveRisk = (pm25Value, userPreferences) => {
    // Apply indoor air quality adjustments
    let adjustedPM = pm25Value;
    if (userPreferences.has_HVAC) {
      adjustedPM *= 0.7; // 30% reduction with HVAC
    }
    if (userPreferences.has_ecologgica) {
      adjustedPM *= 0.6; // Additional 40% reduction with air purifier
    }

    // Base risk calculation (cogFunc80 algorithm)
    const baseRisk = adjustedPM / WHO_THRESHOLD;
    
    // Exponential risk increase above WHO threshold
    if (adjustedPM > WHO_THRESHOLD) {
      return baseRisk * (1 + Math.log10(adjustedPM / WHO_THRESHOLD));
    }
    return baseRisk;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch 180 days of data to calculate 90-day rolling averages
        const { data: pmData, error: pmError } = await supabase
          .from('weather_data')
          .select('created_at, pm25')
          .eq('city', userPreferences.city)
          .order('created_at', { ascending: false })
          .limit(180);

        if (pmError) throw pmError;

        if (!pmData?.length) {
          setError('No weather data available for your city');
          return;
        }

        // Calculate rolling averages and risk scores
        const data = pmData.map((_, index) => {
          const rollingAvg = calculateRollingAverage(pmData, index);
          const riskScore = calculateCognitiveRisk(rollingAvg, userPreferences);

          return {
            x: new Date(pmData[index].created_at),
            y: riskScore,
            raw: {
              pm25: pmData[index].pm25,
              rolling_average: rollingAvg,
              threshold: WHO_THRESHOLD,
              adjustments: {
                hvac: userPreferences.has_HVAC ? '30% reduction' : 'none',
                purifier: userPreferences.has_ecologgica ? '40% reduction' : 'none'
              }
            }
          };
        });

        setChartData({
          datasets: [{
            label: '90-Day Cognitive Function Risk',
            data: data,
            borderColor: '#043A24',
            backgroundColor: 'rgba(4, 58, 36, 0.1)',
            fill: true
          }]
        });

      } catch (err) {
        console.error('Error fetching cognitive risk data:', err);
        setError('Failed to load cognitive risk data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userPreferences?.city) {
      fetchData();
    }
  }, [userPreferences]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'week',
          displayFormats: {
            week: 'MMM d'
          }
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cognitive Function Risk Level'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const data = context.raw;
            return [
              `Risk Score: ${data.y.toFixed(2)}`,
              `Daily PM2.5: ${data.raw.pm25.toFixed(1)} μg/m³`,
              `90-Day Average: ${data.raw.rolling_average.toFixed(1)} μg/m³`,
              `WHO Guideline: ${data.raw.threshold} μg/m³`,
              `HVAC: ${data.raw.adjustments.hvac}`,
              `Air Purifier: ${data.raw.adjustments.purifier}`
            ];
          }
        }
      }
    }
  };

  if (isLoading) return <div>Loading cognitive risk data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No cognitive risk data available</div>;

  return (
    <div className="cognitive-risk-chart" style={{ position: 'relative' }}>
      {/* Information tooltip */}
      <div 
        className="info-tooltip-trigger"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ 
          position: 'absolute', 
          right: '1rem', 
          top: '1rem',
          cursor: 'help',
          zIndex: 1
        }}
      >
        ℹ️
        {showTooltip && (
          <div className="info-tooltip" style={{
            position: 'absolute',
            right: '2rem',
            top: '0',
            background: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            width: '300px',
            zIndex: 10
          }}>
            <h4>Cognitive Function Risk Score</h4>
            <p>This score is calculated using:</p>
            <ul>
              <li>90-day rolling average of PM2.5 levels</li>
              <li>WHO guideline threshold (10 μg/m³)</li>
              <li>Exponential risk increase above threshold</li>
              <li>Indoor air quality improvements:</li>
              <ul>
                <li>HVAC system: 30% reduction</li>
                <li>Air purifier: Additional 40% reduction</li>
              </ul>
            </ul>
            <p>Higher scores indicate increased risk to cognitive function based on long-term exposure to PM2.5.</p>
          </div>
        )}
      </div>

      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default CognitiveRiskChart; 