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

const WeeklyAnxietyChart = ({ userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [algorithm, setAlgorithm] = useState({ threshold: 5, base_ratio: 1.14 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the algorithm details
        const { data: algoData, error: algoError } = await supabase
          .from('risk_algorithms')
          .select('*')
          .eq('code', 'anxSym96');

        if (algoError) throw algoError;
        
        const algoDetails = algoData?.[0] || {
          threshold: 5,
          base_ratio: 1.14,
          period_days: 7
        };
        
        setAlgorithm(algoDetails);

        // Get the PM2.5 data for the last 140 days (20 weeks)
        const { data: pmData, error: pmError } = await supabase
          .from('weather_data')
          .select('*')
          .eq('city', userPreferences.city)
          .order('created_at', { ascending: false })
          .limit(140);

        if (pmError) throw pmError;

        if (!pmData || pmData.length === 0) {
          setError('No weather data available for your city');
          return;
        }

        // Group data by weeks
        const weeklyData = [];
        for (let i = 0; i < pmData.length; i += 7) {
          const weekData = pmData.slice(i, i + 7);
          const startDate = new Date(weekData[0].created_at);
          
          // Count days where PM2.5 exceeded threshold
          const daysExceeded = weekData.filter(day => day.pm25 > algoDetails.threshold).length;
          
          // Calculate average risk for the week
          const baseRisk = userPreferences.anxietyLevel || 5;
          const weeklyRiskIncrease = (daysExceeded / 7) * algoDetails.base_ratio;
          const weeklyRisk = baseRisk * (1 + weeklyRiskIncrease);

          weeklyData.push({
            x: startDate,
            y: weeklyRisk,
            daysExceeded,
            totalDays: weekData.length,
            threshold: algoDetails.threshold
          });
        }

        const formattedData = {
          labels: weeklyData.map(week => week.x),
          datasets: [{
            label: '20-Week Anxiety Risk Trend',
            data: weeklyData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            tension: 0.1
          }]
        };

        setChartData(formattedData);
      } catch (err) {
        console.error('Error fetching anxiety risk data:', err);
        setError('Failed to load anxiety risk data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userPreferences.city) {
      fetchData();
    }
  }, [userPreferences]);

  if (isLoading) return <div>Loading anxiety risk data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No anxiety risk data available</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'week',
          displayFormats: {
            week: 'MMM d'
          }
        },
        title: {
          display: true,
          text: 'Week Starting'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Weekly Average Anxiety Risk Score'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const data = context.raw;
            return [
              `Risk Score: ${data.y.toFixed(2)}`,
              `Days PM2.5 > ${data.threshold}: ${data.daysExceeded}/${data.totalDays}`
            ];
          }
        }
      }
    }
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default WeeklyAnxietyChart; 