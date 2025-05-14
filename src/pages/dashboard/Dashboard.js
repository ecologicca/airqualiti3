import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import PM25Chart from '../../components/charts/PM25Chart';
import PM10Chart from '../../components/charts/PM10Chart';
import CityComparisonChart from '../../components/charts/CityComparisonChart';
import HealthImpactAnalysis from '../../components/HealthImpactAnalysis';
import { FaHeart, FaLungs, FaBrain, FaChild, FaUser } from 'react-icons/fa';
import '../../styles/style.css';
import CategoryButtons from '../../components/CategoryButtons';
import AirQualityDisplay from '../../components/AirQualityDisplay';
import RespiratoryHealthScore from '../../components/RespiratoryHealthScore';
import AirPollutantExposure from '../../components/AirPollutantExposure';
import CognitiveFunctionImpact from '../../components/CognitiveFunctionImpact';
import AirQualityBrainHealth from '../../components/AirQualityBrainHealth';
import OverallHealthImpact from '../../components/OverallHealthImpact';
import AirQualityRecommendations from '../../components/AirQualityRecommendations';
import YearlyPM25Comparison from '../../components/YearlyPM25Comparison';
import { useNavigate } from 'react-router-dom';

// Constants
const WHO_GUIDELINE = 10; // WHO guideline for PM2.5
const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes in milliseconds

const CategoryButton = ({ icon, label, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`category-button ${isSelected ? 'selected' : ''}`}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '16px',
      background: isSelected ? '#e6f4ea' : 'white',
      border: isSelected ? '2px solid #043A24' : '1px solid #e0e0e0',
      borderRadius: '12px',
      cursor: 'pointer',
      minWidth: '120px',
      transition: 'all 0.2s ease'
    }}
  >
    <div className="icon-circle" style={{
      background: '#e6f4ea',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#043A24'
    }}>
      {icon}
    </div>
    <span style={{
      color: '#043A24',
      fontSize: '0.9rem',
      fontWeight: '500'
    }}>
      {label}
    </span>
  </button>
);

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshTime, setNextRefreshTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('heart');
  const navigate = useNavigate();

  // Add function to format date
  const formatDate = () => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  useEffect(() => {
    fetchUserPreferences();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('custom-all-channel')
      .on('broadcast', { event: 'city_update' }, async (payload) => {
        console.log('Received city update:', payload);
        // Refresh user preferences and data
        await fetchUserPreferences();
        await fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (userPreferences?.city) {
      fetchData();
      const interval = setInterval(fetchData, 60 * 60 * 1000); // Refresh every hour
      return () => clearInterval(interval);
    }
  }, [userPreferences?.city]); // Depend on city changes

  const fetchUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user preferences:', error.message);
        return;
      }

      if (preferences) {
        setUserPreferences(preferences);
      } else {
        console.log('No preferences found for user');
        // Set default preferences
        setUserPreferences({
          city: 'Toronto', // Default city
          anxiety_base_level: 5,
          activity_level: 5,
          sleep_level: 3
        });
      }
    } catch (error) {
      console.error('Error in fetchUserPreferences:', error.message);
    }
  };

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      if (!userPreferences?.city) {
        console.log('No city selected');
        return;
      }

      const { data: airData, error: airError } = await supabase
        .from('weather_data')
        .select('*')
        .eq('city', userPreferences.city)
        .order('created_at', { ascending: false })
        .limit(30);

      if (airError) throw airError;

      const transformedData = airData.map(item => {
        const pm25 = parseFloat(item.pm25 || item['PM 2.5'] || 0);
        const pm10 = parseFloat(item.pm10 || item['PM 10'] || 0);
        const date = new Date(item.created_at || item.date);
        
        return {
          ...item,
          'PM 2.5': !isNaN(pm25) ? pm25 : 0,
          'PM 10': !isNaN(pm10) ? pm10 : 0,
          date: date.toISOString(),
          created_at: date.toISOString()
        };
      }).filter(item => item['PM 2.5'] > 0 || item['PM 10'] > 0);
      
      setData(transformedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
      setNextRefreshTime(Date.now() + REFRESH_COOLDOWN);
    }
  };

  // Add function to format time remaining
  const formatTimeRemaining = (ms) => {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateMetrics = () => {
    if (!data.length) return {
      avgPM25: 0,
      avgPM10: 'NaN',
      qualityScore: 0,
      trend: 0
    };

    // Filter out invalid values and sort by date
    const pm25Values = data
      .map(d => ({
        value: parseFloat(d['PM 2.5'] || d.pm25),
        date: new Date(d.created_at)
      }))
      .filter(item => !isNaN(item.value))
      .sort((a, b) => b.date - a.date); // Most recent first

    // Calculate 24-hour average (or available data points)
    const last24Hours = pm25Values.filter(item => 
      (Date.now() - item.date) <= 24 * 60 * 60 * 1000
    );

    const avgPM25 = last24Hours.length > 0
      ? (last24Hours.reduce((sum, item) => sum + item.value, 0) / last24Hours.length).toFixed(1)
      : pm25Values[0]?.value.toFixed(1) || 0;

    // Calculate week-over-week trend
    const currentWeekAvg = pm25Values
      .filter(item => (Date.now() - item.date) <= 7 * 24 * 60 * 60 * 1000)
      .reduce((acc, item, i, arr) => acc + (item.value / arr.length), 0);

    const lastWeekAvg = pm25Values
      .filter(item => 
        (Date.now() - item.date) > 7 * 24 * 60 * 60 * 1000 && 
        (Date.now() - item.date) <= 14 * 24 * 60 * 60 * 1000
      )
      .reduce((acc, item, i, arr) => acc + (item.value / (arr.length || 1)), 0) || currentWeekAvg;

    // Calculate bounded quality score (0-100)
    const qualityScore = Math.max(0, Math.min(100, Math.round((1 - avgPM25 / (WHO_GUIDELINE * 5)) * 100)));

    // Calculate PM10 average
    const pm10Values = data
      .filter(d => d['PM 10'] || d.pm10)
      .map(d => parseFloat(d['PM 10'] || d.pm10))
      .filter(val => !isNaN(val));

    const avgPM10 = pm10Values.length 
      ? (pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length).toFixed(1)
      : 'NaN';

    return {
      avgPM25,
      avgPM10,
      qualityScore,
      trend: lastWeekAvg ? ((currentWeekAvg - lastWeekAvg) / lastWeekAvg * 100).toFixed(1) : 0
    };
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

  if (isLoading) {
    return (
      <div className="loading-spinner">
        Loading...
      </div>
    );
  }

  const metrics = calculateMetrics();

  const renderContent = () => {
    switch (selectedCategory) {
      case 'lungs':
        return (
          <div className="dashboard-content" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            padding: '2rem',
            marginTop: '2rem'
          }}>
            <RespiratoryHealthScore 
              score={86}
              changePercentage={12}
            />
            <AirPollutantExposure />
          </div>
        );
      case 'brain':
        return (
          <div className="dashboard-content" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            padding: '2rem',
            marginTop: '2rem'
          }}>
            <CognitiveFunctionImpact />
            <AirQualityBrainHealth />
          </div>
        );
      case 'body':
        return (
          <div className="dashboard-content" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            padding: '2rem',
            marginTop: '2rem'
          }}>
            <OverallHealthImpact />
            <AirQualityRecommendations />
          </div>
        );
      default:
        return (
          <div className="dashboard-content" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            padding: '2rem',
            marginTop: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px'
            }}>
              <AirQualityDisplay 
                city={userPreferences?.city}
                category={selectedCategory}
                year={2025}
              />
            </div>
            <div style={{
              background: 'white',
              borderRadius: '12px'
            }}>
              <AirQualityDisplay 
                city={userPreferences?.city}
                category={selectedCategory}
                year={2024}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{
        marginBottom: '2rem',
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        color: '#043A24'
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          marginBottom: '0.5rem'
        }}>
          {userPreferences?.first_name ? `${userPreferences.first_name}'s ` : ''}
          Personal Health Impact Report
        </h1>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1.1rem'
        }}>
          <div>{formatDate()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📍 {userPreferences?.city || 'Loading location...'}
          </div>
        </div>
      </div>

      <CategoryButtons 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {renderContent()}

      {/* Summary charts with Health Impact first */}
      <div className="dashboard-summary" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        marginTop: '3rem'
      }}>
        {/* Health Impact Analysis - full width */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <HealthImpactAnalysis userPreferences={userPreferences} />
        </div>

        {/* PM2.5 and PM10 charts in a row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            {console.log('PM2.5 Chart Data:', data)}
            <PM25Chart data={data} userPreferences={userPreferences} />
          </div>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            {console.log('PM10 Chart Data:', data)}
            <PM10Chart data={data} userPreferences={userPreferences} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;