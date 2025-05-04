import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { supabase } from '../supabaseClient';

const ALGORITHMS = {
  WEEKLY: {
    code: 'anxSym96',
    period_days: 7,
    color: '#043A24',
    age_group: '65+',
    description: 'Weekly anxiety risk for seniors (65+)'
  },
  MONTHLY_GENERAL: {
    code: 'anxSym961',
    period_days: 30,
    color: '#90c789',
    description: 'Monthly anxiety risk (all ages)'
  },
  MONTHLY_AGED: {
    code: 'anxSym30',
    period_days: 30,
    color: '#90c789',
    age_min: 45,
    age_max: 74,
    description: 'Monthly anxiety risk (ages 45-74)'
  },
  QUARTERLY: {
    code: 'anxDis32',
    period_days: 90,
    color: '#D9F6BB',
    description: 'Quarterly anxiety risk (all ages)'
  }
};

const calculateAdjustedPM25 = (pm25, hasHVAC, hasAirPurifier) => {
  let value = pm25;
  if (hasHVAC) value *= 0.7; // 30% reduction
  if (hasAirPurifier) value *= 0.6; // Additional 40% reduction
  return value;
};

const isUserEligibleForAlgorithm = (userAge, algorithm) => {
  if (algorithm.age_group === '65+') {
    return userAge >= 65;
  }
  if (algorithm.age_min && algorithm.age_max) {
    return userAge >= algorithm.age_min && userAge <= algorithm.age_max;
  }
  return true; // No age restrictions
};

const calculateRollingAverage = (data, periodDays) => {
  if (!data || data.length === 0) return 0;
  const relevantData = data.slice(0, periodDays);
  const sum = relevantData.reduce((acc, day) => acc + day.pm25, 0);
  return sum / relevantData.length;
};

const getAnxietyModifier = (anxietyLevel) => {
  return 1 + (anxietyLevel - 5) * 0.1; // level 7 → +20% risk
};

const calculateRiskScore = (pm25Data, algorithm, userPreferences) => {
  const rollingPM = calculateRollingAverage(pm25Data, algorithm.period_days);
  const userModifier = getAnxietyModifier(userPreferences.anxiety_base_level || 5);
  
  // Apply indoor air quality adjustments if enabled
  let adjustedPM = rollingPM;
  if (userPreferences.has_HVAC) {
    adjustedPM *= 0.7; // 30% reduction
  }
  if (userPreferences.has_ecologgica) {
    adjustedPM *= 0.6; // Additional 40% reduction
  }

  return (adjustedPM / algorithm.threshold) * algorithm.base_ratio * userModifier;
};

const AnxietyRiskAnalysis = ({ userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [algorithms, setAlgorithms] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch algorithms from risk_algorithms table
        const { data: algoData, error: algoError } = await supabase
          .from('risk_algorithms')
          .select('*')
          .in('code', Object.values(ALGORITHMS).map(a => a.code));

        if (algoError) throw algoError;

        // Create algorithm map with thresholds and base ratios
        const algoMap = {};
        algoData.forEach(algo => {
          const algKey = Object.keys(ALGORITHMS).find(
            key => ALGORITHMS[key].code === algo.code
          );
          if (algKey) {
            algoMap[algKey] = {
              ...ALGORITHMS[algKey],
              ...algo
            };
          }
        });

        // Filter algorithms based on user's age
        const userAge = userPreferences.age || 0;
        const eligibleAlgos = Object.entries(algoMap)
          .filter(([_, algo]) => isUserEligibleForAlgorithm(userAge, algo))
          .reduce((acc, [key, algo]) => {
            acc[key] = algo;
            return acc;
          }, {});

        setAlgorithms(eligibleAlgos);

        // Set default selected period
        const periods = Object.keys(eligibleAlgos);
        if (periods.length > 0) {
          const defaultPeriod = periods.reduce((shortest, current) => {
            return eligibleAlgos[current].period_days < eligibleAlgos[shortest].period_days
              ? current
              : shortest;
          }, periods[0]);
          setSelectedPeriod(defaultPeriod);
        }

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

        // Calculate risk scores for each eligible algorithm
        const datasets = Object.entries(eligibleAlgos).map(([key, algo]) => {
          const periodData = pmData.slice(0, algo.period_days);
          const data = periodData.map((_, index) => {
            const windowData = periodData.slice(0, index + 1);
            const riskScore = calculateRiskScore(windowData, algo, userPreferences);

            return {
              x: new Date(periodData[index].created_at),
              y: riskScore,
              raw: {
                pm25: periodData[index].pm25,
                rolling_average: calculateRollingAverage(windowData, windowData.length),
                threshold: algo.threshold,
                user_modifier: getAnxietyModifier(userPreferences.anxiety_base_level)
              }
            };
          });

          return {
            label: algo.description,
            data,
            borderColor: algo.color,
            backgroundColor: `${algo.color}20`,
            hidden: key !== selectedPeriod
          };
        });

        setChartData({ datasets });

      } catch (err) {
        console.error('Error fetching anxiety risk data:', err);
        setError('Failed to load anxiety risk data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userPreferences?.city) {
      fetchData();
    }
  }, [userPreferences, selectedPeriod]);

  if (isLoading) return <div>Loading anxiety risk data...</div>;
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
      tooltip: {
        callbacks: {
          label: (context) => {
            const data = context.raw;
            return [
              `Risk Score: ${data.y.toFixed(2)}`,
              `PM2.5: ${data.raw.pm25.toFixed(1)}`,
              `Rolling Average: ${data.raw.rolling_average.toFixed(1)}`,
              `Threshold: ${data.raw.threshold}`,
              `User Modifier: ${data.raw.user_modifier.toFixed(2)}x`
            ];
          }
        }
      }
    }
  };

  return (
    <div className="anxiety-risk-analysis">
      <div className="chart-container" style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
      
      <div className="period-toggles">
        {Object.entries(algorithms).map(([key, algo]) => (
          <button
            key={key}
            className={`period-toggle ${selectedPeriod === key ? 'active' : ''}`}
            onClick={() => setSelectedPeriod(key)}
            style={{
              '--button-color': algo.color
            }}
            title={algo.description}
          >
            {key.split('_')[0]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnxietyRiskAnalysis; 