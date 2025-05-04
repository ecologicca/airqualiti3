import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { supabase } from '../supabaseClient';

const ALGORITHMS = {
  WEEKLY: {
    code: 'cogFunc80',
    period_days: 7,
    color: '#043A24',
    description: 'Weekly cognitive function risk assessment'
  },
  MONTHLY: {
    code: 'cogFunc80',
    period_days: 30,
    color: '#90c789',
    description: 'Monthly cognitive function risk assessment'
  },
  QUARTERLY: {
    code: 'cogFunc80',
    period_days: 90,
    color: '#D9F6BB',
    description: 'Quarterly cognitive function risk assessment'
  }
};

const calculateAdjustedPM25 = (pm25, hasHVAC, hasAirPurifier) => {
  let value = pm25;
  if (hasHVAC) value *= 0.7; // 30% reduction with HVAC
  if (hasAirPurifier) value *= 0.6; // Additional 40% reduction with air purifier
  return value;
};

const calculateRollingAverage = (data, periodDays) => {
  if (!data || data.length === 0) return 0;
  const relevantData = data.slice(0, periodDays);
  const sum = relevantData.reduce((acc, day) => acc + day.pm25, 0);
  return sum / relevantData.length;
};

const calculateCognitiveRiskScore = (pm25Data, algorithm, userPreferences) => {
  const rollingPM = calculateRollingAverage(pm25Data, algorithm.period_days);
  
  // Apply indoor air quality adjustments
  let adjustedPM = rollingPM;
  if (userPreferences.has_HVAC) {
    adjustedPM *= 0.7;
  }
  if (userPreferences.has_ecologgica) {
    adjustedPM *= 0.6;
  }

  // Cognitive function risk calculation based on cogFunc80 algorithm
  // Risk increases more rapidly above WHO guideline of 10 μg/m³
  const threshold = 10; // WHO guideline for annual mean PM2.5
  const baseRisk = adjustedPM / threshold;
  
  // Exponential risk increase above threshold
  if (adjustedPM > threshold) {
    return baseRisk * (1 + Math.log10(adjustedPM / threshold));
  }
  return baseRisk;
};

const CognitiveFunctionRiskAnalysis = ({ userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('WEEKLY');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch PM2.5 data
        const { data: pmData, error: pmError } = await supabase
          .from('weather_data')
          .select('created_at, pm25')
          .eq('city', userPreferences.city)
          .order('created_at', { ascending: false })
          .limit(90);

        if (pmError) throw pmError;

        if (!pmData?.length) {
          setError('No weather data available for your city');
          return;
        }

        // Calculate risk scores for the selected period
        const algo = ALGORITHMS[selectedPeriod];
        const periodData = pmData.slice(0, algo.period_days);
        
        const data = periodData.map((_, index) => {
          const windowData = periodData.slice(0, index + 1);
          const riskScore = calculateCognitiveRiskScore(windowData, algo, userPreferences);

          return {
            x: new Date(periodData[index].created_at),
            y: riskScore,
            raw: {
              pm25: periodData[index].pm25,
              rolling_average: calculateRollingAverage(windowData, windowData.length),
              threshold: 10, // WHO guideline
              adjustments: {
                hvac: userPreferences.has_HVAC ? '30% reduction' : 'none',
                purifier: userPreferences.has_ecologgica ? '40% reduction' : 'none'
              }
            }
          };
        });

        setChartData({
          datasets: [{
            label: algo.description,
            data,
            borderColor: algo.color,
            backgroundColor: `${algo.color}20`,
            fill: true
          }]
        });

      } catch (err) {
        console.error('Error fetching cognitive function risk data:', err);
        setError('Failed to load cognitive function risk data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userPreferences?.city) {
      fetchData();
    }
  }, [userPreferences, selectedPeriod]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM d'
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
              `PM2.5: ${data.raw.pm25.toFixed(1)} μg/m³`,
              `Rolling Average: ${data.raw.rolling_average.toFixed(1)} μg/m³`,
              `WHO Guideline: ${data.raw.threshold} μg/m³`,
              `HVAC: ${data.raw.adjustments.hvac}`,
              `Air Purifier: ${data.raw.adjustments.purifier}`
            ];
          }
        }
      }
    }
  };

  if (isLoading) return <div>Loading cognitive function risk data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No cognitive function risk data available</div>;

  return (
    <div className="cognitive-risk-analysis">
      {/* Information tooltip */}
      <div 
        className="info-tooltip-trigger"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ 
          position: 'absolute', 
          right: '1rem', 
          top: '1rem',
          cursor: 'help'
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
            <h4>How is this calculated?</h4>
            <p>The cognitive function risk score is based on:</p>
            <ul>
              <li>WHO guideline threshold of 10 μg/m³ for PM2.5</li>
              <li>Rolling average of PM2.5 levels over the selected period</li>
              <li>Exponential risk increase above the threshold</li>
              <li>Indoor air quality improvements from:</li>
              <ul>
                <li>HVAC (30% reduction)</li>
                <li>Air purifier (40% additional reduction)</li>
              </ul>
            </ul>
          </div>
        )}
      </div>

      <div className="chart-container" style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
      
      <div className="period-toggles" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        {Object.entries(ALGORITHMS).map(([key, algo]) => (
          <button
            key={key}
            className={`period-toggle ${selectedPeriod === key ? 'active' : ''}`}
            onClick={() => setSelectedPeriod(key)}
            style={{
              padding: '0.5rem 1rem',
              border: `2px solid ${algo.color}`,
              borderRadius: '0.5rem',
              background: selectedPeriod === key ? algo.color : 'transparent',
              color: selectedPeriod === key ? 'white' : algo.color,
              cursor: 'pointer'
            }}
          >
            {key.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CognitiveFunctionRiskAnalysis; 