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
import { calculateIndoorWithDevices } from '../../utils/airQualityCalculations';

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

const AnxietyRiskChart = ({ userPreferences }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('MONTHLY_GENERAL');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [algorithms, setAlgorithms] = useState({});
  const [algorithmDescriptions, setAlgorithmDescriptions] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);

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

  // Modify the data processing in useEffect
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!algorithms || !selectedPeriod || !userPreferences?.city) {
          console.log('Missing required data:', {
            hasAlgorithms: !!algorithms,
            selectedPeriod,
            city: userPreferences?.city
          });
          return;
        }

        const currentAlgo = algorithms[selectedPeriod];
        if (!currentAlgo) {
          console.log('Available algorithms:', Object.keys(algorithms));
          console.log('Selected period:', selectedPeriod);
          console.log('No matching algorithm found');
          return;
        }

        console.log('Using algorithm:', currentAlgo);

        // Fetch PM2.5 data
        const { data: pmData, error: pmError } = await supabase
          .from('weather_data')
          .select('*')
          .eq('city', userPreferences.city)
          .order('created_at', { ascending: false })
          .limit(currentAlgo.period_days * 4);

        if (pmError) throw pmError;

        if (!pmData || pmData.length === 0) {
          setError('No weather data available for your city');
          return;
        }

        const periodDays = currentAlgo.period_days;

        // Calculate risk scores with rolling averages
        const data = pmData.map((_, index) => {
          const rollingAvg = calculateRollingAverage(pmData, index, periodDays);
          const baseLevel = userPreferences.anxiety_base_level || 5;
          const hasHVAC = userPreferences.has_HVAC;
          const hasAirPurifier = userPreferences.has_ecologgica;
          
          const riskScore = calculateAnxietyRisk(
            baseLevel,
            rollingAvg,
            hasHVAC,
            hasAirPurifier
          );

          return {
            x: new Date(pmData[index].created_at),
            y: riskScore,
            raw: {
              pm25: pmData[index].pm25,
              rolling_average: rollingAvg,
              base_level: baseLevel,
              adjustments: {
                hvac: hasHVAC ? '30% reduction' : 'none',
                purifier: hasAirPurifier ? '40% reduction' : 'none'
              }
            }
          };
        });

        setChartData({
          datasets: [{
            label: currentAlgo.description,
            data: data,
            borderColor: currentAlgo.color,
            backgroundColor: `${currentAlgo.color}20`,
            fill: true
          }]
        });

      } catch (err) {
        console.error('Error fetching anxiety risk data:', err);
        setError('Failed to load anxiety risk data');
      } finally {
        setLoading(false);
      }
    };

    if (userPreferences?.city) {
      fetchData();
    }
  }, [userPreferences, selectedPeriod, algorithms]);

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
          unit: selectedPeriod === 'WEEKLY' ? 'week' : 
                selectedPeriod === 'MONTHLY_GENERAL' ? 'month' : 'quarter',
          displayFormats: {
            week: 'MMM d',
            month: 'MMM yyyy',
            quarter: 'QQQ yyyy'
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
          text: 'Anxiety Risk Level'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const data = context.raw;
            return [
              `Risk Score: ${data.y.toFixed(2)}`,
              `Daily PM2.5: ${data.raw.pm25.toFixed(1)} μg/m³`,
              `${selectedPeriod.split('_')[0]} Average: ${data.raw.rolling_average.toFixed(1)} μg/m³`,
              `Base Anxiety Level: ${data.raw.base_level}`,
              `HVAC: ${data.raw.adjustments.hvac}`,
              `Air Purifier: ${data.raw.adjustments.purifier}`
            ];
          }
        }
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
              <h4>Anxiety Risk Score Calculation</h4>
              <p>This score is calculated using:</p>
              <ul>
                <li>Age-specific algorithms:
                  <ul>
                    <li>Weekly (anxSym96): Optimized for seniors 65+</li>
                    <li>Monthly (anxSym961): Suitable for all ages</li>
                    <li>Quarterly (anxDis32): Suitable for all ages</li>
                  </ul>
                </li>
                <li>Your profile:
                  <ul>
                    <li>Age: {calculateAge(userPreferences.birthdate)} years</li>
                    <li>Base anxiety level: {userPreferences.anxiety_base_level || 5}</li>
                  </ul>
                </li>
                <li>Rolling average of PM2.5 levels:
                  <ul>
                    <li>Weekly: 7-day average</li>
                    <li>Monthly: 30-day average</li>
                    <li>Quarterly: 90-day average</li>
                  </ul>
                </li>
                <li>Indoor air quality improvements:
                  <ul>
                    <li>HVAC system: 30% reduction</li>
                    <li>Air purifier: Additional 40% reduction</li>
                  </ul>
                </li>
                <li>Risk adjustments:
                  <ul>
                    <li>Increases up to 12% per 10 μg/m³ above threshold</li>
                    <li>Decreases up to 10% when below threshold</li>
                  </ul>
                </li>
              </ul>
              <p style={{ fontSize: '0.9em', marginTop: '0.5rem', color: '#666' }}>
                Note: Some algorithms are age-specific. For example, the weekly analysis (anxSym96) 
                is only shown for users 65 and older, as research shows stronger correlations 
                between air quality and anxiety symptoms in this age group.
              </p>
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
              onClick={() => setSelectedPeriod(key)}
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