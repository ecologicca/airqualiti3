import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { supabase } from '../../supabaseClient';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CityComparisonChart = ({ userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get data for the last 60 days for all cities
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 60);

        // Get all cities using a different approach
        const { data: weatherData, error: dataError } = await supabase
          .from('weather_data')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (dataError) throw dataError;

        // Get unique cities from the data
        const cities = [...new Set(weatherData.map(item => item.city))];

        // Calculate 60-day averages for each city
        const cityAverages = cities.map(city => {
          const cityData = weatherData.filter(item => item.city === city);
          const pm25Average = cityData.reduce((sum, item) => sum + (item.pm25 || 0), 0) / (cityData.length || 1);
          const pm10Average = cityData.reduce((sum, item) => sum + (item.pm10 || 0), 0) / (cityData.length || 1);
          return {
            city,
            pm25Average: parseFloat(pm25Average.toFixed(1)),
            pm10Average: parseFloat(pm10Average.toFixed(1))
          };
        });

        // Sort cities by average PM2.5 levels
        cityAverages.sort((a, b) => b.pm25Average - a.pm25Average);

        setChartData({
          labels: cityAverages.map(item => item.city),
          datasets: [
            {
              label: '60-Day Average PM2.5',
              data: cityAverages.map(item => item.pm25Average),
              backgroundColor: 'rgba(0, 100, 0, 0.7)',
              borderColor: 'rgba(0, 100, 0, 1)',
              borderWidth: 1
            },
            {
              label: '60-Day Average PM10',
              data: cityAverages.map(item => item.pm10Average),
              backgroundColor: 'rgba(144, 238, 144, 0.7)',
              borderColor: 'rgba(144, 238, 144, 1)',
              borderWidth: 1
            }
          ]
        });

      } catch (err) {
        console.error('Error fetching city comparison data:', err);
        setError('Failed to load city comparison data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <div>Loading city comparison data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No city comparison data available</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'PM2.5 μg/m³ (Weekly Average)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Cities'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Weekly Average PM2.5 by City',
        color: '#2e7d32',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Average: ${context.parsed.y} μg/m³`;
          }
        }
      }
    }
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default CityComparisonChart; 