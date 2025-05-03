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
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { supabase } from '../../supabaseClient';
import ChartLegend from './ChartLegend';
import { calculateIndoorWithDevices } from '../../utils/airQualityCalculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const calculateAnxietyFromPM25 = (pm25Value, baseAnxiety) => {
  // Increase anxiety by 0.5 for every 10 units of PM2.5 above 12
  const increase = pm25Value > 12 ? ((pm25Value - 12) / 10) * 0.5 : 0;
  return Math.min(10, baseAnxiety + increase); // Cap at 10
};

const AnxietyChart = ({ userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [anxietyData, setAnxietyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDatasets, setActiveDatasets] = useState({
    'Outdoor': true,
    'Indoor': true
  });
  const [showAirPurifier, setShowAirPurifier] = useState(userPreferences?.hasAirPurifier || false);
  const baseAnxiety = userPreferences.anxiety_base_level || 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error: dataError } = await supabase
          .from('weather_data')
          .select('*')
          .eq('city', userPreferences.city)
          .order('created_at', { ascending: false })
          .limit(30);

        if (dataError) throw dataError;

        setAnxietyData(data);

        const formattedData = {
          labels: data.map(item => new Date(item.created_at)),
          datasets: [
            {
              label: 'Outdoor',
              data: data.map(item => ({
                x: new Date(item.created_at),
                y: calculateAnxietyFromPM25(item.pm25, baseAnxiety)
              })),
              borderColor: '#043A24',
              backgroundColor: 'rgba(4, 58, 36, 0.1)',
              borderWidth: 2,
              tension: 0.1,
              hidden: !activeDatasets['Outdoor']
            },
            {
              label: 'Indoor',
              data: data.map(item => ({
                x: new Date(item.created_at),
                y: calculateAnxietyFromPM25(
                  calculateIndoorWithDevices(item.pm25, userPreferences?.has_HVAC || false, false),
                  baseAnxiety
                )
              })),
              borderColor: '#D9F6BB',
              backgroundColor: 'rgba(217, 246, 187, 0.1)',
              borderWidth: 2,
              tension: 0.1,
              hidden: !activeDatasets['Indoor']
            }
          ]
        };

        if (showAirPurifier) {
          formattedData.datasets.push({
            label: 'With Air Purifier',
            data: data.map(item => ({
              x: new Date(item.created_at),
              y: calculateAnxietyFromPM25(
                calculateIndoorWithDevices(item.pm25, userPreferences?.has_HVAC || false, true),
                baseAnxiety
              )
            })),
            borderColor: '#A9ED8A',
            backgroundColor: 'rgba(169, 237, 138, 0.1)',
            borderWidth: 2,
            tension: 0.1
          });
        }

        setChartData(formattedData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userPreferences.city) {
      fetchData();
    }
  }, [userPreferences, showAirPurifier, activeDatasets, baseAnxiety]);

  const calculatePeakLevel = (data) => {
    if (!data || !data.length) return baseAnxiety;
    return Math.max(...data.map(item => 
      calculateAnxietyFromPM25(item.pm25, baseAnxiety)
    ));
  };

  const calculateIncreasedRiskDays = (data) => {
    if (!data || !data.length) return 0;
    return data.filter(item => 
      calculateAnxietyFromPM25(item.pm25, baseAnxiety) > baseAnxiety
    ).length;
  };

  if (isLoading) return <div>Loading anxiety data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData || !anxietyData.length) return <div>No anxiety data available</div>;

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
        max: 10,
        title: {
          display: true,
          text: 'Anxiety Risk Level'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-content">
        <div className="chart-side">
          <div style={{ height: '400px', width: '100%' }}>
            <Line data={chartData} options={options} />
          </div>
          <ChartLegend 
            activeDatasets={{
              'Outdoor': activeDatasets['Outdoor'],
              'Indoor': activeDatasets['Indoor'],
              'With Air Purifier': showAirPurifier
            }}
            onToggle={(label) => {
              if (label === 'With Air Purifier') {
                setShowAirPurifier(!showAirPurifier);
              } else {
                setActiveDatasets(prev => ({...prev, [label]: !prev[label]}));
              }
            }}
            showAirPurifier={userPreferences?.hasAirPurifier}
          />
        </div>
        
        <div className="data-side">
          <div className="key-data-title">
            KEY DATA POINTS
          </div>
          <div className="key-data-points">
            <div className="key-data-point">
              <span className="key-data-number">
                {baseAnxiety.toFixed(1)}
              </span>
              <span className="key-data-label">
                Base<br />
                Level
              </span>
            </div>
            <div className="key-data-point">
              <span className="key-data-number">
                {calculateIncreasedRiskDays(anxietyData)}
              </span>
              <span className="key-data-label">
                Days with<br />
                Increased Risk
              </span>
            </div>
            <div className="key-data-point">
              <span className="key-data-number">
                {calculatePeakLevel(anxietyData).toFixed(1)}
              </span>
              <span className="key-data-label">
                Peak<br />
                Level
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnxietyChart; 