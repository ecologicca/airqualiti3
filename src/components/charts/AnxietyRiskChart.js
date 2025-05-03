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

// Register Chart.js components
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

const calculateAnxietyRisk = (baseLevel, pm10, hasHVAC, hasAirPurifier) => {
  // Calculate the adjusted PM10 value based on indoor/device settings
  let adjustedPM10 = calculateIndoorWithDevices(pm10, hasHVAC, hasAirPurifier);

  if (!adjustedPM10) return baseLevel;
  
  // Adjust risk based on PM10 levels
  if (adjustedPM10 >= 10) {
    const increase = adjustedPM10 / 10;
    const riskIncrease = increase * 0.12;
    return Math.min(10, baseLevel * (1 + riskIncrease));
  }
  
  // If PM10 is below threshold, reduce anxiety by up to 10%
  const reduction = (10 - adjustedPM10) / 10;
  const riskReduction = reduction * 0.1; // 10% maximum reduction
  return Math.max(baseLevel * (1 - riskReduction), baseLevel * 0.9); // Don't reduce below 90% of base
};

const aggregateDataByDay = (data) => {
  const aggregated = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!aggregated[dateKey]) {
      aggregated[dateKey] = {
        sum: 0,
        count: 0,
        date: date,
        pm10Values: []
      };
    }
    
    if (item['PM 10']) {
      aggregated[dateKey].pm10Values.push(item['PM 10']);
      aggregated[dateKey].count += 1;
    }
  });
  
  return Object.values(aggregated).map(item => ({
    date: item.date,
    'PM 10': item.count > 0 ? 
      item.pm10Values.reduce((a, b) => a + b, 0) / item.count : 
      null
  }));
};

const AnxietyRiskChart = ({ data, userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDatasets, setActiveDatasets] = useState({
    'Outdoor': true,
    'Indoor': true,
    'HVAC': false,
    'Air Purifier': false
  });

  const toggleDataset = (name) => {
    if (name === 'HVAC' || name === 'Air Purifier') {
      setActiveDatasets(prev => ({
        ...prev,
        'Indoor': true,
        [name]: !prev[name]
      }));
    } else {
      setActiveDatasets(prev => ({
        ...prev,
        [name]: !prev[name]
      }));
    }
  };

  useEffect(() => {
    try {
      if (!data || data.length === 0) {
        setError('No data available');
        setIsLoading(false);
        return;
      }

      const aggregatedData = aggregateDataByDay(data);

      const formattedData = {
        labels: aggregatedData.map(item => item.date),
        datasets: []
      };

      // Add base indoor value (without devices)
      formattedData.datasets.push({
        label: 'Indoor',
        data: aggregatedData.map(item => ({
          x: item.date,
          y: item['PM 10'] ? 
            calculateAnxietyRisk(
              userPreferences.anxietyLevel,
              item['PM 10'],
              false,
              false
            ) : null
        })),
        borderColor: '#D9F6BB',
        backgroundColor: 'rgba(217, 246, 187, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        hidden: !activeDatasets['Indoor']
      });

      // Add HVAC if enabled
      if (userPreferences?.has_HVAC) {
        formattedData.datasets.push({
          label: 'HVAC',
          data: aggregatedData.map(item => ({
            x: item.date,
            y: item['PM 10'] ? 
              calculateAnxietyRisk(
                userPreferences.anxietyLevel,
                item['PM 10'],
                true,
                false
              ) : null
          })),
          borderColor: '#A9ED8A',
          backgroundColor: 'rgba(169, 237, 138, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          hidden: !activeDatasets['HVAC']
        });
      }

      // Add Air Purifier if enabled
      if (userPreferences?.hasEcologica) {
        formattedData.datasets.push({
          label: 'Air Purifier',
          data: aggregatedData.map(item => ({
            x: item.date,
            y: item['PM 10'] ? 
              calculateAnxietyRisk(
                userPreferences.anxietyLevel,
                item['PM 10'],
                false,
                true
              ) : null
          })),
          borderColor: '#7FD663',
          backgroundColor: 'rgba(127, 214, 99, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          hidden: !activeDatasets['Air Purifier']
        });
      }

      // Add Outdoor (top layer)
      formattedData.datasets.push({
        label: 'Outdoor',
        data: aggregatedData.map(item => ({
          x: item.date,
          y: item['PM 10'] ? 
            calculateAnxietyRisk(
              userPreferences.anxietyLevel,
              item['PM 10'],
              false,
              false
            ) : null
        })),
        borderColor: '#043A24',
        backgroundColor: 'rgba(4, 58, 36, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        hidden: !activeDatasets['Outdoor']
      });

      setChartData(formattedData);
      setError(null);
    } catch (err) {
      console.error('Error processing anxiety risk data:', err);
      setError('Failed to process data');
    }
    setIsLoading(false);
  }, [data, activeDatasets, userPreferences]);

  if (isLoading) return <div>Loading anxiety risk data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData || !data.length) return <div>No anxiety risk data available</div>;

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
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(1)} risk level`;
          }
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-side">
        <div style={{ height: '400px', width: '100%' }}>
          <Line data={chartData} options={options} />
        </div>
        <ChartLegend 
          activeDatasets={activeDatasets}
          onToggle={toggleDataset}
          userPreferences={userPreferences}
        />
      </div>
    </div>
  );
};

export default AnxietyRiskChart; 