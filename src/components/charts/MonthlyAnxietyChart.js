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

const MonthlyAnxietyChart = ({ userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [algorithm, setAlgorithm] = useState({ threshold: 5, base_ratio: 1.34 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the algorithm details
        const { data: algoData, error: algoError } = await supabase
          .from('risk_algorithms')
          .select('*')
          .eq('code', 'anxSym961');

        if (algoError) throw algoError;
        
        const algoDetails = algoData?.[0] || {
          threshold: 5,
          base_ratio: 1.34,
          period_days: 30
        };
        
        setAlgorithm(algoDetails);

        // Get the PM2.5 data for the last 270 days (9 months)
        const { data: pmData, error: pmError } = await supabase
          .from('weather_data')
          .select('*')
          .eq('city', userPreferences.city)
          .order('created_at', { ascending: false })
          .limit(270);

        if (pmError) throw pmError;

        if (!pmData || pmData.length === 0) {
          setError('No weather data available for your city');
          return;
        }

        // Group data by months (30-day periods)
        const monthlyData = [];
        for (let i = 0; i < pmData.length; i += 30) {
          const monthData = pmData.slice(i, i + 30);
          const startDate = new Date(monthData[0].created_at);
          
          // Count days where PM2.5 exceeded threshold
          const daysExceeded = monthData.filter(day => day.pm25 > algoDetails.threshold).length;
          
          // Calculate average risk for the month
          const baseRisk = userPreferences.anxietyLevel || 5;
          const monthlyRiskIncrease = (daysExceeded / 30) * algoDetails.base_ratio;
          const monthlyRisk = baseRisk * (1 + monthlyRiskIncrease);

          monthlyData.push({
            x: startDate,
            y: monthlyRisk,
            daysExceeded,
            totalDays: monthData.length,
            threshold: algoDetails.threshold
          });
        }

        const formattedData = {
          labels: monthlyData.map(month => month.x),
          datasets: [{
            label: '9-Month Anxiety Risk Trend',
            data: monthlyData,
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.1)',
            borderWidth: 2,
            tension: 0.1
          }]
        };

        setChartData(formattedData);
      } catch (err) {
        console.error('Error fetching monthly anxiety risk data:', err);
        setError('Failed to load monthly anxiety risk data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userPreferences.city) {
      fetchData();
    }
  }, [userPreferences]);

  if (isLoading) return <div>Loading monthly anxiety risk data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No monthly anxiety risk data available</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          displayFormats: {
            month: 'MMM yyyy'
          }
        },
        title: {
          display: true,
          text: 'Month Starting'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monthly Average Anxiety Risk Score'
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

export default MonthlyAnxietyChart; 