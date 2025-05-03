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
    
    if (item['PM 2.5']) {
      aggregated[dateKey].sum += item['PM 2.5'];
      aggregated[dateKey].count += 1;
    }
  });
  
  return Object.values(aggregated).map(item => ({
    date: item.date,
    'PM 2.5': item.count > 0 ? item.sum / item.count : null
  }));
};

const PM25Chart = ({ data, userPreferences }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

      // Aggregate the data by day
      const aggregatedData = aggregateDataByDay(data);

      const formattedData = {
        labels: aggregatedData.map(item => new Date(item.date)),
        datasets: [
          {
            label: 'Outdoor',
            data: aggregatedData.map(item => ({
              x: new Date(item.date),
              y: item['PM 2.5']
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
              y: item['PM 2.5'] ? calculateIndoorWithDevices(
                item['PM 2.5'],
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
            y: item['PM 2.5'] ? calculateIndoorWithDevices(
              item['PM 2.5'],
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
            y: item['PM 2.5'] ? calculateIndoorWithDevices(
              item['PM 2.5'],
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
      console.error('Error processing PM2.5 data:', err);
      setError('Failed to process PM2.5 data');
      setIsLoading(false);
    }
  }, [data, userPreferences, activeDatasets]);

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