import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { supabase } from '../../supabaseClient';

const YearlyComparisonChart = ({ city, category }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data for both years
        const { data: data2024, error: error2024 } = await supabase
          .from('weather_data')
          .select('created_at, pm25')
          .eq('city', city)
          .gte('created_at', '2024-01-01')
          .lte('created_at', '2024-12-31');

        const { data: data2025, error: error2025 } = await supabase
          .from('weather_data')
          .select('created_at, pm25')
          .eq('city', city)
          .gte('created_at', '2025-01-01')
          .lte('created_at', '2025-12-31');

        if (error2024 || error2025) throw error2024 || error2025;

        // Calculate daily averages
        const processYearData = (data) => {
          const dailyAverages = {};
          data.forEach(reading => {
            const date = new Date(reading.created_at).toISOString().split('T')[0];
            if (!dailyAverages[date]) {
              dailyAverages[date] = { sum: 0, count: 0 };
            }
            dailyAverages[date].sum += reading.pm25;
            dailyAverages[date].count += 1;
          });

          return Object.entries(dailyAverages).map(([date, values]) => ({
            date,
            value: values.sum / values.count
          }));
        };

        const data2024Processed = processYearData(data2024 || []);
        const data2025Processed = processYearData(data2025 || []);

        setChartData({
          labels: [...new Set([...data2024Processed, ...data2025Processed].map(d => d.date))].sort(),
          datasets: [
            {
              label: '2024',
              data: data2024Processed.map(d => ({ x: d.date, y: d.value })),
              borderColor: '#A9ED8A',
              backgroundColor: 'rgba(169, 237, 138, 0.1)',
              borderWidth: 2
            },
            {
              label: '2025',
              data: data2025Processed.map(d => ({ x: d.date, y: d.value })),
              borderColor: '#043A24',
              backgroundColor: 'rgba(4, 58, 36, 0.1)',
              borderWidth: 2
            }
          ]
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [city, category]);

  if (isLoading) return <div>Loading data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No data available</div>;

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
          text: 'PM2.5 (μg/m³)'
        }
      }
    },
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  return (
    <div style={{ height: '400px', width: '100%', padding: '1rem' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default YearlyComparisonChart; 