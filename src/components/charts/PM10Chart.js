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
    const date = new Date(item.date);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!aggregated[dateKey]) {
      aggregated[dateKey] = {
        sum: 0,
        count: 0,
        date: date
      };
    }
    
    if (item['PM 10']) {
      aggregated[dateKey].sum += item['PM 10'];
      aggregated[dateKey].count += 1;
    }
  });
  
  return Object.values(aggregated).map(item => ({
    date: item.date,
    'PM 10': item.count > 0 ? item.sum / item.count : null
  }));
};

const PM10Chart = ({ data, userPreferences }) => {
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

  // Add new aggregation functions
  const aggregateDataByWeek = (data) => {
    const aggregated = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!aggregated[weekKey]) {
        aggregated[weekKey] = {
          sum: 0,
          count: 0,
          date: weekStart
        };
      }
      
      if (item['PM 10']) {
        aggregated[weekKey].sum += item['PM 10'];
        aggregated[weekKey].count += 1;
      }
    });
    
    return Object.values(aggregated).map(item => ({
      date: item.date,
      'PM 10': item.count > 0 ? item.sum / item.count : null
    }));
  };

  const aggregateDataByMonth = (data) => {
    const aggregated = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!aggregated[monthKey]) {
        aggregated[monthKey] = {
          sum: 0,
          count: 0,
          date: new Date(date.getFullYear(), date.getMonth(), 1)
        };
      }
      
      if (item['PM 10']) {
        aggregated[monthKey].sum += item['PM 10'];
        aggregated[monthKey].count += 1;
      }
    });
    
    return Object.values(aggregated).map(item => ({
      date: item.date,
      'PM 10': item.count > 0 ? item.sum / item.count : null
    }));
  };

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
            data: aggregatedData.map(item => ({
              x: new Date(item.date),
              y: item['PM 10']
            })),
            borderColor: '#043A24',
            backgroundColor: 'rgba(4, 58, 36, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            hidden: !activeDatasets['Outdoor']
          },
          {
            label: 'Indoor',
            data: aggregatedData.map(item => ({
              x: new Date(item.date),
              y: item['PM 10'] ? calculateIndoorWithDevices(
                item['PM 10'],
                false,
                false
              ) : null
            })),
            borderColor: '#D9F6BB',
            backgroundColor: 'rgba(217, 246, 187, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            hidden: !activeDatasets['Indoor']
          }
        ]
      };

      // Add HVAC dataset if available
      if (userPreferences?.has_HVAC) {
        formattedData.datasets.push({
          label: 'HVAC',
          data: aggregatedData.map(item => ({
            x: new Date(item.date),
            y: item['PM 10'] ? calculateIndoorWithDevices(
              item['PM 10'],
              true,
              false
            ) : null
          })),
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
          data: aggregatedData.map(item => ({
            x: new Date(item.date),
            y: item['PM 10'] ? calculateIndoorWithDevices(
              item['PM 10'],
              false,
              true
            ) : null
          })),
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
      console.error('Error processing PM10 data:', err);
      setError('Failed to process PM10 data');
      setIsLoading(false);
    }
  }, [data, userPreferences, activeDatasets, timeRange]);

  if (isLoading) return <div>Loading PM10 data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData || !data.length) return <div>No PM10 data available</div>;

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
      },
      title: {
        display: true,
        text: 'PM10 Air Quality Measurements',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      }
    }
  };

  return (
    <div className="content-wrapper">
      <div className="chart-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div className="time-toggle" style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setTimeRange('day')}
            className={`toggle-btn ${timeRange === 'day' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: timeRange === 'day' ? '#043A24' : '#D9F6BB',
              color: timeRange === 'day' ? 'white' : '#043A24',
              cursor: 'pointer'
            }}
          >
            Day
          </button>
          <button 
            onClick={() => setTimeRange('week')}
            className={`toggle-btn ${timeRange === 'week' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: timeRange === 'week' ? '#043A24' : '#D9F6BB',
              color: timeRange === 'week' ? 'white' : '#043A24',
              cursor: 'pointer'
            }}
          >
            Week
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            className={`toggle-btn ${timeRange === 'month' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: timeRange === 'month' ? '#043A24' : '#D9F6BB',
              color: timeRange === 'month' ? 'white' : '#043A24',
              cursor: 'pointer'
            }}
          >
            Month
          </button>
        </div>
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

export default PM10Chart; 