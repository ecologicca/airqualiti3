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

const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes in milliseconds

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshTime, setNextRefreshTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Add function to format time remaining
  const formatTimeRemaining = (ms) => {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
          'PM 2.5': parseFloat(item.pm25 || item['PM 2.5'] || 0),
          'PM 10': parseFloat(item.pm10 || item['PM 10'] || 0),
          'CO': parseFloat(item.co || 0),
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

  // Update triggerNewDataFetch with cooldown logic
  const triggerNewDataFetch = async () => {
    try {
      setIsRefreshing(true);
      
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Make the API call with the session token
      const response = await fetch('http://localhost:3001/api/test-fetch', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      
      // Set next refresh time
      const nextRefresh = Date.now() + REFRESH_COOLDOWN;
      setNextRefreshTime(nextRefresh);
      localStorage.setItem('lastRefreshTime', Date.now().toString());
      
      // Wait a few seconds for the data to be stored
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Then fetch the updated data
      await fetchData();
    } catch (error) {
      console.error('Error triggering data fetch:', error);
      alert('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add useEffect to handle cooldown timer
  useEffect(() => {
    // Check last refresh time from localStorage
    const lastRefresh = localStorage.getItem('lastRefreshTime');
    if (lastRefresh) {
      const nextRefresh = parseInt(lastRefresh) + REFRESH_COOLDOWN;
      if (nextRefresh > Date.now()) {
        setNextRefreshTime(nextRefresh);
    }
    }

    // Update time remaining
    const interval = setInterval(() => {
      if (nextRefreshTime) {
        const remaining = nextRefreshTime - Date.now();
        if (remaining > 0) {
          setTimeRemaining(remaining);
        } else {
          setTimeRemaining(null);
          setNextRefreshTime(null);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRefreshTime]);

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

    // Filter out invalid values before calculating averages
    const pm25Values = data
      .map(d => parseFloat(d['PM 2.5']))
      .filter(val => !isNaN(val));
      
    const pm10Values = data
      .map(d => parseFloat(d['PM 10']))
      .filter(val => !isNaN(val));

    return {
      avgPM25: pm25Values.length ? (pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length).toFixed(1) : 0,
      avgPM10: pm10Values.length ? (pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length).toFixed(1) : 0,
      qualityScore: pm25Values.length ? Math.round((1 - pm25Values[0] / 50) * 100) : 0,
      trend: pm25Values.length > 1 ? ((pm25Values[0] - pm25Values[pm25Values.length - 1]) / pm25Values[pm25Values.length - 1] * 100).toFixed(1) : 0
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="dashboard">
      <div className="dashboard-title">
        <span>Air Quality Dashboard</span>
        <div className="refresh-container">
          {timeRemaining && (
            <span className="refresh-timer">
              Next refresh in: {formatTimeRemaining(timeRemaining)}
            </span>
          )}
          <button 
            className="refresh-button"
            onClick={triggerNewDataFetch}
            disabled={isRefreshing || timeRemaining !== null}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
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
              <h2 className="card-title">PM 2.5 Levels</h2>
            </div>
            <PM25Chart data={data} userPreferences={userPreferences} />
          </div>

          <div className="card large chart-card">
            <div className="card-header">
              <h2 className="card-title">PM 10 Levels</h2>
            </div>
            <PM10Chart data={data} userPreferences={userPreferences} />
        </div>
      </div>

        {/* City Comparison */}
        <div className="card large chart-card">
          <div className="card-header">
            <h2 className="card-title">City Air Quality Comparison</h2>
          </div>
        <CityComparisonChart userPreferences={userPreferences} />
      </div>
      </div>
    </div>
  );
};

export default Dashboard;