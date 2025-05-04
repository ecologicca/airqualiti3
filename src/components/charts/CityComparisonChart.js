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
    const fetchCityData = async () => {
    try {
        // Get data for multiple cities for the last 7 days
        const { data: cityData, error: cityError } = await supabase
          .from('weather_data')
          .select('*')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        if (cityError) throw cityError;

        if (!cityData || cityData.length === 0) {
        setError('No data available');
        setIsLoading(false);
        return;
      }

      // Group data by cities
        const cityAverages = cityData.reduce((acc, item) => {
        if (!acc[item.city]) {
          acc[item.city] = {
            pm25Values: [],
            pm10Values: []
          };
        }
          if (item.pm25) acc[item.city].pm25Values.push(item.pm25);
          if (item.pm10) acc[item.city].pm10Values.push(item.pm10);
        return acc;
      }, {});

      // Calculate averages for each city
        const averages = Object.entries(cityAverages).map(([city, values]) => ({
        city,
        pm25Average: values.pm25Values.length > 0 
          ? values.pm25Values.reduce((sum, val) => sum + val, 0) / values.pm25Values.length 
          : 0,
        pm10Average: values.pm10Values.length > 0 
          ? values.pm10Values.reduce((sum, val) => sum + val, 0) / values.pm10Values.length 
          : 0
      }));

      // Sort cities by PM2.5 levels
        averages.sort((a, b) => b.pm25Average - a.pm25Average);

      const formattedData = {
          labels: averages.map(city => city.city),
        datasets: [
          {
            label: 'PM2.5 Average',
              data: averages.map(city => city.pm25Average),
              backgroundColor: '#D9F6BB',
              borderColor: '#043A24',
            borderWidth: 1
          },
          {
            label: 'PM10 Average',
              data: averages.map(city => city.pm10Average),
              backgroundColor: '#A9ED8A',
              borderColor: '#043A24',
            borderWidth: 1
          }
        ]
      };

      setChartData(formattedData);
      setIsLoading(false);
    } catch (err) {
        console.error('Error fetching city comparison data:', err);
        setError('Failed to fetch data');
      setIsLoading(false);
    }
    };

    fetchCityData();
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
          text: 'μg/m³'
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + ' μg/m³';
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="chart-side">
      <div className="chart-wrapper">
      <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default CityComparisonChart; 