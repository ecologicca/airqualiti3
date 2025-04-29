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

const calculateEcologicaAnxiety = (pm25Value, baseAnxiety) => {
  // First reduce PM2.5 by 50% with Ecologica, then calculate anxiety
  const reducedPM25 = pm25Value * 0.5;
  return calculateAnxietyFromPM25(reducedPM25, baseAnxiety);
};

const DatasetToggle = ({ name, isActive, onToggle, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
    <button
      onClick={() => onToggle(name)}
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: `2px solid ${color}`,
        backgroundColor: isActive ? color : 'white',
        cursor: 'pointer',
        marginRight: '8px',
        padding: 0
      }}
    />
    <span style={{ fontSize: '0.9rem' }}>{name}</span>
  </div>
);

const AnxietyChart = ({ userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [anxietyData, setAnxietyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEcologica, setShowEcologica] = useState(userPreferences.hasEcologica);
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
              borderColor: 'rgb(0, 100, 0)',
              backgroundColor: 'rgba(0, 100, 0, 0.1)',
              borderWidth: 2,
              tension: 0.1
            }
          ]
        };

        if (showEcologica) {
          formattedData.datasets.push({
            label: 'With Ecologica',
            data: data.map(item => ({
              x: new Date(item.created_at),
              y: calculateEcologicaAnxiety(item.pm25, baseAnxiety)
            })),
            borderColor: 'rgb(100, 149, 237)',
            backgroundColor: 'rgba(100, 149, 237, 0.1)',
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
  }, [userPreferences, showEcologica, baseAnxiety]);

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
          <div style={{ 
            marginTop: '20px',
            display: 'flex',
            gap: '20px',
            justifyContent: 'center'
          }}>
            <DatasetToggle 
              name="Outdoor" 
              isActive={true}
              onToggle={() => {}}
              color="rgb(0, 100, 0)"
            />
            {userPreferences.hasEcologica && (
              <DatasetToggle 
                name="With Ecologica" 
                isActive={showEcologica} 
                onToggle={() => setShowEcologica(!showEcologica)}
                color="rgb(100, 149, 237)"
              />
            )}
          </div>
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