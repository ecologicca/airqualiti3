import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import PM25Chart from '../../components/charts/PM25Chart';
import PM10Chart from '../../components/charts/PM10Chart';
import CityComparisonChart from '../../components/charts/CityComparisonChart';
import HealthImpactAnalysis from '../../components/HealthImpactAnalysis';
import '../../styles/style.css';

// Utility function for deeper sleep calculation
const calculateDeeperSleepMinutes = (data, hasEcologica) => {
  const getAdjustedValue = (value) => {
    // Always apply indoor reduction first
    const indoorValue = value * 0.7;
    // Then apply Ecologica if present
    if (hasEcologica) return value * 0.5;
    return indoorValue;
  };

  const daysUnderThreshold = data.filter(day => {
    const adjustedValue = getAdjustedValue(parseFloat(day['PM 2.5']));
    return adjustedValue <= 5;
  }).length;

  return daysUnderThreshold * 8 * 60;
};

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefError) throw prefError;
      setUserPreferences(preferences);

      if (preferences?.city) {
        const { data: airData, error: airError } = await supabase
          .from('weather_data')
          .select('*')
          .eq('city', preferences.city)
          .order('created_at', { ascending: false })
          .limit(30);

        if (airError) throw airError;
        
        const transformedData = airData.map(item => ({
          ...item,
          'PM 2.5': item.pm25 || item['PM 2.5'],
          'PM 10': item.pm10 || item['PM 10'],
          date: new Date(item.created_at || item.date)
        }));

        setData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 60 * 1000); // Refresh every hour
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-spinner">
        Loading...
      </div>
    );
  }

  const calculateMetrics = () => {
    if (!data.length) return {
      avgPM25: 0,
      avgPM10: 0,
      qualityScore: 0,
      trend: 0
    };

    const pm25Values = data.map(d => parseFloat(d['PM 2.5']));
    const pm10Values = data.map(d => parseFloat(d['PM 10']));

    return {
      avgPM25: (pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length).toFixed(1),
      avgPM10: (pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length).toFixed(1),
      qualityScore: Math.round((1 - pm25Values[0] / 50) * 100),
      trend: ((pm25Values[0] - pm25Values[pm25Values.length - 1]) / pm25Values[pm25Values.length - 1] * 100).toFixed(1)
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="dashboard">
      <div className="dashboard-title">
        <span>Air Quality Dashboard</span>
        <button 
          className="refresh-button"
          onClick={fetchData}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="dashboard-content">
        {/* Metrics Row */}
        <div className="metrics-row">
          <div className="card small metric-card">
            <h2 className="card-title">Average PM2.5</h2>
            <div className="metric-value">{metrics.avgPM25}</div>
            <div className={`metric-change ${parseFloat(metrics.trend) >= 0 ? 'positive' : 'negative'}`}>
              {metrics.trend}% since last week
            </div>
          </div>

          <div className="card small metric-card">
            <h2 className="card-title">Average PM10</h2>
            <div className="metric-value">{metrics.avgPM10}</div>
            <div className="metric-change">μg/m³</div>
          </div>

          <div className="card small metric-card">
            <h2 className="card-title">Air Quality Score</h2>
            <div className="metric-value">{metrics.qualityScore}</div>
            <div className="metric-change">out of 100</div>
          </div>

          <div className="card small metric-card">
            <h2 className="card-title">Active Sensors</h2>
            <div className="metric-value">4</div>
            <div className="metric-change positive">All operational</div>
          </div>
        </div>

        {/* Health Impact Analysis */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Health Impact Analysis</h2>
          </div>
          <HealthImpactAnalysis data={data} userPreferences={userPreferences} />
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="card large chart-card">
            <div className="card-header">
              <h2 className="card-title">
                PM 2.5 Levels
              </h2>
            </div>
            <PM25Chart data={data} userPreferences={userPreferences} />
          </div>

          <div className="card large chart-card">
            <div className="card-header">
              <h2 className="card-title">
                PM 10 Levels
              </h2>
            </div>
            <PM10Chart data={data} userPreferences={userPreferences} />
          </div>
        </div>

        {/* City Comparison */}
        <div className="card large chart-card">
          <div className="card-header">
            <h2 className="card-title">
              City Air Quality Comparison
            </h2>
          </div>
          <CityComparisonChart userPreferences={userPreferences} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;