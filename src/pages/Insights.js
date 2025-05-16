import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/Insights.css';
import '../styles/AirQualityControls.css';
import { FaWifi, FaEllipsisV, FaInfoCircle, FaSprayCan, FaFilter, FaTimes } from 'react-icons/fa';
import { BsXLg } from 'react-icons/bs';
import AirQualityControls from '../components/AirQualityControls';
import AirQualityInsight from '../components/AirQualityInsight';
import CognitiveRiskChart from '../components/charts/CognitiveRiskChart';
import StressRiskChart from '../components/charts/StressRiskChart';

const Insights = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [airQualityData, setAirQualityData] = useState([]);
  const [devices, setDevices] = useState([
    {
      id: 1,
      name: 'Living Room Monitor',
      lastUpdated: '02:29 PM',
      status: 'Connected'
    },
    {
      id: 2,
      name: 'Bedroom Monitor',
      lastUpdated: '02:22 PM',
      status: 'Connected'
    },
    {
      id: 3,
      name: 'Kitchen VOC Monitor',
      lastUpdated: '01:46 PM',
      status: 'Disconnected'
    }
  ]);
  const [airQualitySettings, setAirQualitySettings] = useState({
    windowsOpen: false,
    nonToxicProducts: false,
    recentFilterChange: false
  });

  // Calculate total reduction based on active improvements
  const calculateTotalReduction = () => {
    let total = 0;
    if (airQualitySettings.windowsOpen) total += 10;
    if (airQualitySettings.nonToxicProducts) total += 8;
    if (airQualitySettings.recentFilterChange) total += 15;
    return total;
  };

  // Placeholder data - to be replaced with actual calculations
  const [healthImpacts] = useState({
    indoorOutdoorComparison: 35, // % better than outside
    buildingComparison: 45, // % better than average buildings
    cumulativeImpact: {
      productivity: 28,
      mentalHealth: 32,
      respiratoryHealth: 40
    },
    currentImpact: {
      productivity: 15,
      mentalHealth: 18,
      respiratoryHealth: 22
    },
    totalReduction: calculateTotalReduction()
  });

  const fetchData = async () => {
    try {
      if (!userProfile?.city) {
        console.log('No city selected');
        return;
      }

      setLoading(true);
      const { data: airData, error: airError } = await supabase
        .from('weather_data')
        .select('*')
        .eq('city', userProfile.city)
        .order('created_at', { ascending: false })
        .limit(30);

      if (airError) throw airError;

      setAirQualityData(airData || []);
      console.log('Fetched air data:', airData);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch air quality data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();

    // Subscribe to real-time updates for city changes
    const channel = supabase
      .channel('custom-all-channel')
      .on('broadcast', { event: 'city_update' }, async (payload) => {
        console.log('Insights received city update:', payload);
        await fetchUserProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view insights');
        return;
      }

      // Set email from auth
      setUserProfile(prev => ({
        ...prev,
        email: user.email
      }));

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user preferences:', error.message);
        setError('Failed to load profile data. Please try again.');
        return;
      }

      // Only update form data if we found preferences
      if (data) {
        setUserProfile({
          ...data,
          age: calculateAge(data.birthdate)
        });
      } else {
        // Set default profile
        setUserProfile({
          city: 'Toronto',
          anxiety_base_level: 5,
          activity_level: 5,
          sleep_level: 3
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error.message);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return 0;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (userProfile?.city) {
      fetchData();
      const interval = setInterval(fetchData, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userProfile?.city]);

  const handleAirQualitySettingsChange = (newSettings) => {
    setAirQualitySettings(newSettings);
    // Calculate total reduction
    let totalReduction = 0;
    if (newSettings.windowsOpen) totalReduction += 10;
    if (newSettings.nonToxicProducts) totalReduction += 8;
    if (newSettings.recentFilterChange) totalReduction += 15;
    
    // Store the settings in local storage for persistence
    localStorage.setItem('airQualitySettings', JSON.stringify(newSettings));
  };

  // Load settings from local storage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('airQualitySettings');
    if (savedSettings) {
      setAirQualitySettings(JSON.parse(savedSettings));
    }
  }, []);

  const renderMainDashboard = () => (
    <div className="dashboard-container">
      {/* Title */}
      <h1 className="dashboard-title">
        {userProfile?.first_name ? `${userProfile.first_name}'s Home Insights` : 'Personal Indoor Insights'}
      </h1>
      {/* Air Quality Insight Banner */}
      <div className="insight-banner">
        <div className="insight-message">
          <FaInfoCircle className="info-icon" />
          <p>You had 2 days with high VOC levels this week. Using an air purifier or improving ventilation could help reduce anxiety triggers.</p>
        </div>
      </div>
      {/* Main Content Card Row */}
      <div className="insights-main-row-card">
        <div className="insights-main-row">
          {/* Connected Devices Card */}
          <div className="content-card devices-card">
            <div className="section-header">
              <h2>Connected Devices</h2>
              <button className="add-device-button">+ Add Device</button>
            </div>
            <div className="devices-list">
              {devices.map(device => (
                <div key={device.id} className="device-card">
                  <div className="device-info">
                    <div className="device-icon">
                      <FaWifi />
                    </div>
                    <div className="device-details">
                      <h3>{device.name}</h3>
                      <p>Last updated: {device.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="device-status">
                    <span className={`status-indicator ${device.status.toLowerCase()}`}>
                      {device.status}
                    </span>
                    <button className="device-menu">
                      <FaEllipsisV />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Indoor Air Improvements Card */}
          <div className="content-card improvements-card">
            <h2>Indoor Air Improvements</h2>
            <div className="total-reduction">
              Total reduction in pollutants: {calculateTotalReduction()}%
            </div>
            <div className="improvements-list">
              <div className="improvement-item">
                <FaTimes className="improvement-icon" />
                <span>Windows closed during high pollution</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={airQualitySettings.windowsOpen}
                    onChange={(e) => setAirQualitySettings(prev => ({
                      ...prev,
                      windowsOpen: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="improvement-item">
                <FaSprayCan className="improvement-icon" />
                <span>Using non-toxic cleaning products</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={airQualitySettings.nonToxicProducts}
                    onChange={(e) => setAirQualitySettings(prev => ({
                      ...prev,
                      nonToxicProducts: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="improvement-item">
                <FaFilter className="improvement-icon" />
                <span>Recent filter change</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={airQualitySettings.recentFilterChange}
                    onChange={(e) => setAirQualitySettings(prev => ({
                      ...prev,
                      recentFilterChange: e.target.checked
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Charts Section */}
      <div className="insights-charts-section">
        <div className="insights-chart-card">
          <h2 className="insights-chart-title">Cognitive Function Risk Analysis</h2>
          <CognitiveRiskChart userPreferences={userProfile} airQualitySettings={airQualitySettings} />
        </div>
        <div className="insights-chart-card">
          <h2 className="insights-chart-title">Stress Risk Analysis</h2>
          <StressRiskChart userPreferences={userProfile} airQualitySettings={airQualitySettings} />
        </div>
      </div>
    </div>
  );

  if (loading) return <div>Loading insights...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userProfile) return <div>Please complete your profile to view insights</div>;

  return (
    <div className="insights-container">
      {renderMainDashboard()}
    </div>
  );
};

export default Insights; 