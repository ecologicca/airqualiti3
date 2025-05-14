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
import ChartLegend from './ChartLegend';
import TimeRangeSelector from '../TimeRangeSelector';
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

// Utility functions
const aggregateDataByDay = (data) => {
  const aggregated = {};
  
  data.forEach(item => {
    const date = new Date(item.created_at || item.date);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!aggregated[dateKey]) {
      aggregated[dateKey] = {
        sum: 0,
        count: 0,
        date: date
      };
    }
    
    const pm25Value = parseFloat(item['PM 2.5']);
    if (!isNaN(pm25Value) && pm25Value > 0) {
      aggregated[dateKey].sum += pm25Value;
      aggregated[dateKey].count += 1;
    }
  });
  
  return Object.values(aggregated)
    .map(item => ({
      date: item.date,
      'PM 2.5': item.count > 0 ? (item.sum / item.count).toFixed(1) : null
    }))
    .sort((a, b) => a.date - b.date);
};

const aggregateDataByWeek = (data) => {
  const aggregated = {};
  
  data.forEach(item => {
    const date = new Date(item.created_at || item.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!aggregated[weekKey]) {
      aggregated[weekKey] = {
        sum: 0,
        count: 0,
        date: weekStart
      };
    }
    
    const pm25Value = parseFloat(item['PM 2.5']);
    if (!isNaN(pm25Value) && pm25Value > 0) {
      aggregated[weekKey].sum += pm25Value;
      aggregated[weekKey].count += 1;
    }
  });
  
  return Object.values(aggregated)
    .map(item => ({
      date: item.date,
      'PM 2.5': item.count > 0 ? (item.sum / item.count).toFixed(1) : null
    }))
    .sort((a, b) => a.date - b.date);
};

const aggregateDataByMonth = (data) => {
  const aggregated = {};
  
  data.forEach(item => {
    const date = new Date(item.created_at || item.date);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthKey = monthStart.toISOString().split('T')[0];
    
    if (!aggregated[monthKey]) {
      aggregated[monthKey] = {
        sum: 0,
        count: 0,
        date: monthStart
      };
    }
    
    const pm25Value = parseFloat(item['PM 2.5']);
    if (!isNaN(pm25Value) && pm25Value > 0) {
      aggregated[monthKey].sum += pm25Value;
      aggregated[monthKey].count += 1;
    }
  });
  
  return Object.values(aggregated)
    .map(item => ({
      date: item.date,
      'PM 2.5': item.count > 0 ? (item.sum / item.count).toFixed(1) : null
    }))
    .sort((a, b) => a.date - b.date);
};

const PM25Chart = ({ data, userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('day');
  const [activeDatasets, setActiveDatasets] = useState({
    'Outdoor': true,
    'Indoor': true,
    'HVAC': false,
    'Air Purifier': false
  });

  useEffect(() => {
    try {
      if (!data || data.length === 0) {
        setError('No data available');
        setIsLoading(false);
        return;
      }

      // Choose aggregation based on timeRange
      let aggregatedData;
      switch (timeRange) {
        case 'week':
          aggregatedData = aggregateDataByWeek(data);
          break;
        case 'month':
          aggregatedData = aggregateDataByMonth(data);
          break;
        default:
          aggregatedData = aggregateDataByDay(data);
      }

      const formattedData = {
        labels: aggregatedData.map(item => new Date(item.date)),
        datasets: [
          {
            label: 'Outdoor',
            data: aggregatedData
              .filter(item => item['PM 2.5'] !== null && !isNaN(item['PM 2.5']))
              .map(item => ({
                x: new Date(item.date),
                y: parseFloat(item['PM 2.5'])
              })),
            borderColor: '#043A24',
            backgroundColor: 'rgba(4, 58, 36, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            hidden: !activeDatasets['Outdoor']
          }
        ]
      };

      // Add HVAC dataset if available
      if (userPreferences?.has_HVAC) {
        formattedData.datasets.push({
          label: 'HVAC',
          data: aggregatedData.map(item => {
            const pm25 = parseFloat(item['PM 2.5']);
            return {
              x: new Date(item.date),
              y: !isNaN(pm25) ? calculateIndoorWithDevices(
                pm25,
                true,
                false
              ).toFixed(1) : null
            };
          }).filter(item => item.y !== null),
          borderColor: '#A9ED8A',
          backgroundColor: 'rgba(169, 237, 138, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          hidden: !activeDatasets['HVAC']
        });
      }

      // Add Air Purifier dataset if available
      if (userPreferences?.has_ecologgica) {
        formattedData.datasets.push({
          label: 'Air Purifier',
          data: aggregatedData.map(item => {
            const pm25 = parseFloat(item['PM 2.5']);
            return {
              x: new Date(item.date),
              y: !isNaN(pm25) ? calculateIndoorWithDevices(
                pm25,
                false,
                true
              ).toFixed(1) : null
            };
          }).filter(item => item.y !== null),
          borderColor: '#7FD663',
          backgroundColor: 'rgba(127, 214, 99, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          hidden: !activeDatasets['Air Purifier']
        });
      }

      setChartData(formattedData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error processing PM2.5 data:', err);
      setError('Failed to process PM2.5 data');
      setIsLoading(false);
    }
  }, [data, userPreferences, activeDatasets, timeRange]);

  if (isLoading) return <div>Loading PM2.5 data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData || !data.length) return <div>No PM2.5 data available</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === 'month' ? 'month' : timeRange === 'week' ? 'week' : 'day',
          displayFormats: {
            day: 'MMM d',
            week: 'MMM d',
            month: 'MMM yyyy'
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
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  return (
    <div className="content-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#043A24', fontSize: '24px' }}>Air Quality History</h2>
        <TimeRangeSelector timeRange={timeRange} setTimeRange={setTimeRange} />
      </div>
      <div className="chart-side">
        <div style={{ height: '400px', width: '100%' }}>
          <Line data={chartData} options={options} />
        </div>
        <ChartLegend 
          activeDatasets={activeDatasets}
          onToggle={(label) => {
            setActiveDatasets(prev => ({
              ...prev,
              [label]: !prev[label]
            }));
          }}
          userPreferences={userPreferences}
        />
      </div>
    </div>
  );
};

export default PM25Chart; 