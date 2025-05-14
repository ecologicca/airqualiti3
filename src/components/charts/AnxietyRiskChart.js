import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { supabase } from '../../supabaseClient';
import ChartLegend from './ChartLegend';
import { calculateIndoorWithDevices, applyRiskReduction } from '../../utils/airQualityCalculations';
import { format } from 'date-fns';
import { chartColors, baseChartOptions } from './ChartStyles';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

const ALGORITHMS = {
  WEEKLY: {
    code: 'anxSym96',
    period_days: 7,
    color: '#043A24',
    age_group: '65+',
    description: 'Weekly anxiety risk for seniors (65+)',
    threshold: 5,
    base_ratio: 1.14
  },
  MONTHLY_GENERAL: {
    code: 'anxSym961',
    period_days: 30,
    color: '#90c789',
    description: 'Monthly anxiety risk (all ages)',
    threshold: 5,
    base_ratio: 1.34
  },
  QUARTERLY: {
    code: 'anxDis32',
    period_days: 90,
    color: '#D9F6BB',
    description: 'Quarterly anxiety risk (all ages)',
    threshold: 1.13,
    base_ratio: 1.097
  }
};

const calculateAnxietyRisk = (baseLevel, pm10, hasHVAC, hasAirPurifier) => {
  // Calculate the adjusted PM10 value based on indoor/device settings
  let adjustedPM10 = calculateIndoorWithDevices(pm10, hasHVAC, hasAirPurifier);

  if (!adjustedPM10) return baseLevel;
  
  // Adjust risk based on PM10 levels
  if (adjustedPM10 >= 10) {
    const increase = adjustedPM10 / 10;
    const riskIncrease = increase * 0.12;
    return Math.min(10, baseLevel * (1 + riskIncrease));
  }
  
  // If PM10 is below threshold, reduce anxiety by up to 10%
  const reduction = (10 - adjustedPM10) / 10;
  const riskReduction = reduction * 0.1; // 10% maximum reduction
  return Math.max(baseLevel * (1 - riskReduction), baseLevel * 0.9); // Don't reduce below 90% of base
};

const aggregateDataByDay = (data) => {
  const aggregated = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!aggregated[dateKey]) {
      aggregated[dateKey] = {
        sum: 0,
        count: 0,
        date: date,
        pm10Values: []
      };
    }
    
    if (item['PM 10']) {
      aggregated[dateKey].pm10Values.push(item['PM 10']);
      aggregated[dateKey].count += 1;
    }
  });
  
  return Object.values(aggregated).map(item => ({
    date: item.date,
    'PM 10': item.count > 0 ? 
      item.pm10Values.reduce((a, b) => a + b, 0) / item.count : 
      null
  }));
};

const AnxietyRiskChart = ({ userPreferences, airQualitySettings }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('MONTHLY_GENERAL');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [algorithms, setAlgorithms] = useState({});
  const [algorithmDescriptions, setAlgorithmDescriptions] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [baseRiskData, setBaseRiskData] = useState([]);

  // Constants for anxiety risk calculation
  const WHO_THRESHOLD = 12; // WHO guideline for PM2.5
  const ROLLING_DAYS = 90; // Changed to 90-day rolling average

  // Fetch algorithm descriptions from Supabase
  useEffect(() => {
    const fetchAlgorithmDescriptions = async () => {
      try {
        const { data, error } = await supabase
          .from('risk_algorithms')
          .select('code, description')
          .in('code', Object.values(ALGORITHMS).map(a => a.code));

        if (error) throw error;

        // Create a map of algorithm codes to their descriptions
        const descMap = data.reduce((acc, algo) => {
          acc[algo.code] = algo.description;
          return acc;
        }, {});

        setAlgorithmDescriptions(descMap);
      } catch (err) {
        console.error('Error fetching algorithm descriptions:', err);
      }
    };

    fetchAlgorithmDescriptions();
  }, []);

  // Set up algorithms based on user age
  useEffect(() => {
    if (!userPreferences?.birthdate) return;

    const userAge = calculateAge(userPreferences.birthdate);
    console.log('Setting up algorithms for user age:', userAge);

    const filteredAlgos = Object.entries(ALGORITHMS).reduce((acc, [key, algo]) => {
      if (algo.age_group === '65+' && userAge < 65) {
        return acc;
      }
      return { ...acc, [key]: algo };
    }, {});
    
    console.log('Setting filtered algorithms:', filteredAlgos);
    setAlgorithms(filteredAlgos);
  }, [userPreferences?.birthdate]);

  // Add rolling average calculation
  const calculateRollingAverage = (data, index, periodDays) => {
    const windowData = data.slice(Math.max(0, index - periodDays + 1), index + 1);
    return windowData.reduce((sum, day) => sum + parseFloat(day.pm25 || 0), 0) / windowData.length;
  };

  const calculateBaseAnxietyRisk = (pm25Value) => {
    // More sensitive base risk calculation
    if (pm25Value === null || pm25Value === undefined) {
      console.log('Warning: Invalid PM2.5 value:', pm25Value);
      return 0.5; // Base risk level instead of 0
    }

    // Start with a base risk level
    let risk = 0.5; // Baseline risk

    // Add risk based on PM2.5 levels
    if (pm25Value <= WHO_THRESHOLD) {
      // Below threshold: slight variations around baseline
      risk += (pm25Value / WHO_THRESHOLD) * 0.2; // Max +0.2 at threshold
    } else {
      // Above threshold: more significant increase
      risk = 0.7 + ((pm25Value - WHO_THRESHOLD) / 20) * 2.3; // Scale to reach max 3.0
    }
    
    const clampedRisk = Math.min(Math.max(risk, 0.3), 3);
    console.log(`PM2.5: ${pm25Value} -> Base Anxiety Risk: ${clampedRisk}`);
    return clampedRisk;
  };

  useEffect(() => {
    if (userPreferences?.city) {
      console.log('Fetching data for city:', userPreferences.city);
      fetchAnxietyData();
    } else {
      console.log('No city selected in user preferences');
    }
  }, [userPreferences, selectedPeriod]);

  useEffect(() => {
    if (baseRiskData.length > 0) {
      console.log('Updating chart with settings:', airQualitySettings);
      console.log('Base risk data points:', baseRiskData.length);
      updateChartWithSettings();
    }
  }, [airQualitySettings, baseRiskData]);

  const fetchAnxietyData = async () => {
    try {
      const endDate = new Date().toISOString();
      const periodDays = ALGORITHMS[selectedPeriod].period_days;
      console.log(`Fetching ${periodDays} days of data for ${selectedPeriod} period`);

      const { data: airData, error: airError } = await supabase
        .from('weather_data')
        .select('*')
        .eq('city', userPreferences?.city)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(periodDays);

      if (airError) throw airError;

      if (!airData || airData.length === 0) {
        console.log('No data returned from Supabase');
        setError('No data available');
        setLoading(false);
        return;
      }

      // Sort data in ascending order for chart display
      const sortedData = airData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      console.log('Fetched air data:', sortedData);
      console.log('Sample PM2.5 values:', sortedData.map(d => d.pm25).slice(0, 5));

      // Calculate base risk data
      const baseData = sortedData.map(item => {
        const pm25 = parseFloat(item.pm25 || 0);
        console.log(`Processing PM2.5 value: ${pm25} from:`, item);
        return {
          date: new Date(item.created_at),
          risk: calculateBaseAnxietyRisk(pm25),
          pm25: pm25
        };
      });
      
      console.log('Calculated base risks:', baseData.map(d => d.risk).slice(0, 5));
      
      setBaseRiskData(baseData);
      updateChartWithSettings(baseData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching anxiety data:', err);
      setError('Failed to load anxiety risk data');
      setLoading(false);
    }
  };

  const updateChartWithSettings = (data = baseRiskData) => {
    const currentAlgorithm = ALGORITHMS[selectedPeriod];
    
    const formattedData = {
      labels: data.map(item => item.date),
      datasets: [
        {
          label: `${selectedPeriod.split('_')[0]} Anxiety Risk`,
          data: data.map(item => {
            const adjustedRisk = applyRiskReduction(item.risk, airQualitySettings);
            console.log(`Original risk: ${item.risk} -> Adjusted risk: ${adjustedRisk}`);
            return {
              x: item.date,
              y: adjustedRisk
            };
          }),
          borderColor: currentAlgorithm.color,
          backgroundColor: `${currentAlgorithm.color}33`, // Add 20% opacity
          fill: true,
          tension: 0.4
        }
      ]
    };

    setChartData(formattedData);
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return 0;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) return <div>Loading anxiety risk data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No anxiety risk data available</div>;
  if (Object.keys(algorithms).length === 0) {
    return <div>No applicable anxiety risk algorithms available for your age group</div>;
  }

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
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        max: 3,
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          stepSize: 0.5,
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Risk Level',
          font: {
            size: 14,
            weight: 'normal'
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => {
            return format(new Date(context[0].raw.x), 'MMM d, yyyy');
          },
          label: (context) => {
            return `Risk Level: ${context.raw.y.toFixed(2)}`;
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  return (
    <div className="anxiety-risk-analysis" style={{ 
      width: '100%',
      height: '100%',
      padding: '16px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="chart-container" style={{ 
        flex: 1,
        minHeight: '300px',
        maxHeight: '400px',
        width: '100%',
        position: 'relative'
      }}>
        {/* Add information tooltip */}
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
              <h4>Anxiety Risk Score</h4>
              <p>This score is calculated using:</p>
              <ul>
                <li>{ALGORITHMS[selectedPeriod].period_days}-day analysis period</li>
                <li>WHO guideline threshold ({WHO_THRESHOLD} μg/m³)</li>
                <li>Non-linear risk increase above threshold</li>
                <li>Indoor air quality improvements:</li>
                <ul>
                  <li>Windows Open: 10% reduction</li>
                  <li>Non-Toxic Products: 8% reduction</li>
                  <li>Recent Filter Change: 15% reduction</li>
                </ul>
              </ul>
              <p>Higher scores indicate increased risk to anxiety based on PM2.5 exposure.</p>
            </div>
          )}
        </div>
        {chartData && <Line data={chartData} options={options} />}
      </div>
      
      <div className="period-toggles" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '16px',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ 
          display: 'flex',
          gap: '10px',
          marginBottom: '8px'
        }}>
          {Object.entries(algorithms).map(([key, algo]) => (
            <button
              key={key}
              onClick={() => {
                console.log('Switching to period:', key);
                setSelectedPeriod(key);
              }}
              style={{
                padding: '8px 16px',
                border: '2px solid var(--button-color)',
                borderRadius: '20px',
                background: selectedPeriod === key ? algo.color : 'transparent',
                color: selectedPeriod === key ? '#fff' : algo.color,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '--button-color': algo.color
              }}
            >
              {key.split('_')[0]}
            </button>
          ))}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#666',
          textAlign: 'center',
          minHeight: '20px',
          padding: '8px'
        }}>
          {algorithms[selectedPeriod] && 
           algorithmDescriptions[algorithms[selectedPeriod].code]}
        </div>
      </div>
    </div>
  );
};

export default AnxietyRiskChart; 