import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
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

// Utility functions
const calculateIndoorReduction = (value) => {
  return value * 0.7; // 30% reduction for indoor air quality
};

const calculateEcologicaReduction = (value) => {
  return value * 0.6; // 40% reduction
};

const calculateCombinedReduction = (value) => {
  return value * 0.5; // 50% reduction
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

const PM10Chart = ({ userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [weatherData, setWeatherData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDatasets, setActiveDatasets] = useState({
    'Outdoor': true,
    'Indoor': true
  });
  const [showEcologica, setShowEcologica] = useState(userPreferences.hasEcologica);

  const toggleDataset = (name) => {
    setActiveDatasets(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const calculateDaysOverThreshold = (data, threshold) => {
    return data.filter(day => parseFloat(day.y) > threshold).length;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error: dataError } = await supabase
          .from('weather_data')
          .select('*')
          .eq('city', userPreferences.city)
          .order('created_at', { ascending: false })
          .limit(60);

        if (dataError) throw dataError;

        setWeatherData(data);

        const formattedData = {
          labels: data.map(item => new Date(item.created_at)),
          datasets: [
            {
              label: 'Outdoor',
              data: data.map(item => ({
                x: new Date(item.created_at),
                y: item.pm10
              })),
              borderColor: 'rgb(0, 100, 0)',
              backgroundColor: 'rgba(0, 100, 0, 0.1)',
              borderWidth: 2,
              tension: 0.1
            },
            {
              label: 'Indoor',
              data: data.map(item => ({
                x: new Date(item.created_at),
                y: calculateIndoorReduction(item.pm10)
              })),
              borderColor: 'rgb(144, 238, 144)',
              backgroundColor: 'rgba(144, 238, 144, 0.1)',
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
              y: calculateCombinedReduction(item.pm10)
            })),
            borderColor: 'rgb(100, 149, 237)',
            backgroundColor: 'rgba(100, 149, 237, 0.1)',
            borderWidth: 2,
            tension: 0.1
          });
        }

        setChartData(formattedData);
      } catch (err) {
        console.error('Error fetching PM10 data:', err);
        setError('Failed to load PM10 data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userPreferences.city) {
      fetchData();
    }
  }, [userPreferences, showEcologica]);

  if (isLoading) return <div>Loading PM10 data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData || !weatherData.length) return <div>No PM10 data available</div>;

  const { hasHVAC, hasEcologica } = userPreferences;

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
          text: 'μg/m³'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  return (
    <div className="content-wrapper">
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
            isActive={activeDatasets['Outdoor']} 
            onToggle={toggleDataset}
            color="rgba(0, 100, 0, 0.8)"
          />
          <DatasetToggle 
            name="Indoor" 
            isActive={activeDatasets['Indoor']} 
            onToggle={toggleDataset}
            color="rgba(144, 238, 144, 0.8)"
          />
          {userPreferences.hasEcologica && (
            <DatasetToggle 
              name="With Ecologica" 
              isActive={showEcologica} 
              onToggle={() => setShowEcologica(!showEcologica)}
              color="rgba(100, 149, 237, 0.8)"
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
              {calculateDaysOverThreshold(chartData.datasets[0].data, 20)}
            </span>
            <span className="key-data-label">
              days over<br />
              20μg/m³
            </span>
          </div>
          <div className="key-data-point">
            <span className="key-data-number">
              {calculateDaysOverThreshold(chartData.datasets[0].data, 40)}
            </span>
            <span className="key-data-label">
              days over<br />
              40μg/m³
            </span>
          </div>
          <div className="key-data-point">
            <span className="key-data-number">
              {calculateDaysOverThreshold(chartData.datasets[0].data, 50)}
            </span>
            <span className="key-data-label">
              days over<br />
              50μg/m³
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PM10Chart; 