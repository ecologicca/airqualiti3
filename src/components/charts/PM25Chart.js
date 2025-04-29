import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { supabase } from '../../supabaseClient';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const calculateIndoorReduction = (value) => {
  return value * 0.7; // 30% reduction for indoor air quality
};

const calculateEcologicaReduction = (value) => {
  return value * 0.6; // 40% reduction
};

const calculateCombinedReduction = (value) => {
  return value * 0.5; // 50% reduction
};

const calculateImpact = (value, hasEcologica) => {
  const indoorValue = calculateIndoorReduction(value);
  if (hasEcologica) {
    return calculateCombinedReduction(value);
  }
  return indoorValue;
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

const PM25Chart = ({ userPreferences }) => {
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

        setWeatherData(data);

        const formattedData = {
          labels: data.map(item => new Date(item.created_at)),
          datasets: []
        };

        // Add With Ecologica (bottom layer)
        if (showEcologica) {
          formattedData.datasets.push({
            label: 'With Ecologica',
            data: data.map(item => calculateCombinedReduction(item.pm25)),
            backgroundColor: 'rgba(100, 149, 237, 0.9)',
            hidden: false,
            stack: 'stack1',
            barThickness: 18
          });
        }

        // Add Indoor (middle layer)
        formattedData.datasets.push({
          label: 'Indoor',
          data: data.map(item => calculateIndoorReduction(item.pm25)),
          backgroundColor: 'rgba(144, 238, 144, 0.9)',
          hidden: !activeDatasets['Indoor'],
          stack: 'stack1',
          barThickness: 18
        });

        // Add Outdoor (top layer)
        formattedData.datasets.push({
          label: 'Outdoor',
          data: data.map(item => item.pm25),
          backgroundColor: 'rgba(0, 100, 0, 0.9)',
          hidden: !activeDatasets['Outdoor'],
          stack: 'stack1',
          barThickness: 18
        });

        setChartData(formattedData);
      } catch (err) {
        console.error('Error fetching PM2.5 data:', err);
        setError('Failed to load PM2.5 data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userPreferences.city) {
      fetchData();
    }
  }, [userPreferences, showEcologica, activeDatasets]);

  const calculateDaysOverThreshold = (data, threshold) => {
    if (!data || !data.length) return 0;
    return data.filter(day => parseFloat(day.pm25) > threshold).length;
  };

  if (isLoading) return <div>Loading PM2.5 data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData || !weatherData.length) return <div>No PM2.5 data available</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
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
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'μg/m³'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const stackTotal = context.chart.data.datasets.reduce((total, dataset) => {
              const value = dataset.data[context.dataIndex];
              return total + (isNaN(value) ? 0 : value);
            }, 0);
            
            if (label === 'With Ecologica') {
              const reduction = ((context.chart.data.datasets[2].data[context.dataIndex] - value) / context.chart.data.datasets[2].data[context.dataIndex] * 100).toFixed(1);
              return `${label}: ${value.toFixed(1)} μg/m³ (${reduction}% total reduction)`;
            }
            return `${label}: ${stackTotal.toFixed(1)} μg/m³`;
          }
        }
      }
    }
  };

  return (
    <div className="content-wrapper">
      <div className="chart-side">
        <div style={{ height: '400px', width: '100%' }}>
          <Bar data={chartData} options={options} />
        </div>
        <div className="chart-legend">
          {chartData.datasets.map((dataset, index) => (
            <div key={index} className="legend-item" onClick={() => toggleDataset(dataset.label)}>
              <span 
                className="legend-color" 
                style={{ backgroundColor: dataset.borderColor }}
              ></span>
              <span>{dataset.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="data-side">
        <div className="key-data-title">
          KEY DATA POINTS
        </div>
        <div className="key-data-points">
          <div className="key-data-point">
            <span className="key-data-number">
              {weatherData && calculateDaysOverThreshold(weatherData, 12)}
            </span>
            <span className="key-data-label">
              days over<br />
              12μg/m³
            </span>
          </div>
          <div className="key-data-point">
            <span className="key-data-number">
              {weatherData && calculateDaysOverThreshold(weatherData, 35)}
            </span>
            <span className="key-data-label">
              days over<br />
              35μg/m³
            </span>
          </div>
          <div className="key-data-point">
            <span className="key-data-number">
              {weatherData && calculateDaysOverThreshold(weatherData, 55)}
            </span>
            <span className="key-data-label">
              days over<br />
              55μg/m³
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PM25Chart; 