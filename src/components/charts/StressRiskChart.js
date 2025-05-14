import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { supabase } from '../../supabaseClient';
import { chartColors, baseChartOptions } from './ChartStyles';
import { applyRiskReduction } from '../../utils/airQualityCalculations';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';

const StressRiskChart = ({ userPreferences, airQualitySettings }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [baseRiskData, setBaseRiskData] = useState([]);

  // Constants for stress risk calculation
  const ROLLING_DAYS = 90; // Changed from 71 to 90 days
  const PM25_THRESHOLD = 12; // WHO guideline for annual mean PM2.5

  const calculateBaseStressRisk = (pm25Value) => {
    // More sensitive base risk calculation
    if (pm25Value === null || pm25Value === undefined) {
      console.log('Warning: Invalid PM2.5 value:', pm25Value);
      return 0.5; // Base risk level instead of 0
    }

    // Start with a base risk level
    let risk = 0.5; // Baseline risk

    // Add risk based on PM2.5 levels
    if (pm25Value <= PM25_THRESHOLD) {
      // Below threshold: slight variations around baseline
      risk += (pm25Value / PM25_THRESHOLD) * 0.2; // Max +0.2 at threshold
    } else {
      // Above threshold: more significant increase
      risk = 0.7 + ((pm25Value - PM25_THRESHOLD) / 23) * 2.3; // Scale to reach max 3.0
    }
    
    const clampedRisk = Math.min(Math.max(risk, 0.3), 3);
    console.log(`PM2.5: ${pm25Value} -> Base Stress Risk: ${clampedRisk}`);
    return clampedRisk;
  };

  useEffect(() => {
    if (userPreferences?.city) {
      console.log('Fetching data for city:', userPreferences.city);
      fetchStressData();
    } else {
      console.log('No city selected in user preferences');
    }
  }, [userPreferences]);

  useEffect(() => {
    if (baseRiskData.length > 0) {
      console.log('Updating chart with settings:', airQualitySettings);
      console.log('Base risk data points:', baseRiskData.length);
      updateChartWithSettings();
    }
  }, [airQualitySettings, baseRiskData]);

  const fetchStressData = async () => {
    try {
      const endDate = new Date().toISOString();
      const { data: airData, error: airError } = await supabase
        .from('weather_data')
        .select('*')
        .eq('city', userPreferences?.city)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(90);

      if (airError) throw airError;

      if (!airData || airData.length === 0) {
        console.log('No data returned from Supabase');
        setError('No data available');
        setLoading(false);
        return;
      }

      // Sort data in ascending order for chart display
      const sortedData = airData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      console.log('Fetched air data:', sortedData);
      console.log('Sample PM2.5 values:', sortedData.map(d => d.pm25).slice(0, 5));

      // Calculate base risk data
      const baseData = sortedData.map(item => {
        const pm25 = parseFloat(item.pm25 || 0);
        console.log(`Processing PM2.5 value: ${pm25} from:`, item);
        return {
          date: new Date(item.created_at),
          risk: calculateBaseStressRisk(pm25),
          pm25: pm25
        };
      });
      
      console.log('Calculated base risks:', baseData.map(d => d.risk).slice(0, 5));
      
      setBaseRiskData(baseData);
      updateChartWithSettings(baseData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stress data:', err);
      setError('Failed to load stress risk data');
      setLoading(false);
    }
  };

  const updateChartWithSettings = (data = baseRiskData) => {
    const formattedData = {
      labels: data.map(item => item.date),
      datasets: [
        {
          label: '71-Day Stress Risk',
          data: data.map(item => {
            const adjustedRisk = applyRiskReduction(item.risk, airQualitySettings);
            console.log(`Original risk: ${item.risk} -> Adjusted risk: ${adjustedRisk}`);
            return {
              x: item.date,
              y: adjustedRisk
            };
          }),
          borderColor: chartColors.outdoor,
          backgroundColor: 'rgba(4, 58, 36, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    setChartData(formattedData);
  };

  const options = {
    ...baseChartOptions,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM d'
          }
        },
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        max: 3,
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          stepSize: 0.5,
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Risk Level',
          font: {
            size: 14,
            weight: 'normal'
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => {
            return format(new Date(context[0].raw.x), 'MMM d, yyyy');
          },
          label: (context) => {
            return `Risk Level: ${context.raw.y.toFixed(2)}`;
          }
        }
      },
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false,
    responsive: true
  };

  if (loading) return <div>Loading stress risk data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No stress risk data available</div>;

  return (
    <div className="stress-risk-chart" style={{ position: 'relative' }}>
      {/* Information tooltip */}
      <div 
        className="info-tooltip-trigger"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ 
          position: 'absolute', 
          right: '1rem', 
          top: '1rem',
          cursor: 'help',
          zIndex: 1
        }}
      >
        ℹ️
        {showTooltip && (
          <div className="info-tooltip" style={{
            position: 'absolute',
            right: '2rem',
            top: '0',
            background: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            width: '300px',
            zIndex: 10
          }}>
            <h4>Stress Risk Score</h4>
            <p>This score is calculated using:</p>
            <ul>
              <li>90-day rolling average of PM2.5 levels</li>
              <li>WHO guideline threshold (12 μg/m³)</li>
              <li>Non-linear risk increase above threshold</li>
              <li>Indoor air quality improvements:</li>
              <ul>
                <li>HVAC system: 30% reduction</li>
                <li>Air purifier: Additional 40% reduction</li>
              </ul>
            </ul>
            <p>The risk assessment focuses on longer-term exposure patterns (90 days) 
            to assess chronic stress risk from air pollution exposure.</p>
          </div>
        )}
      </div>

      <div style={{ height: '400px', width: '100%' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default StressRiskChart; 