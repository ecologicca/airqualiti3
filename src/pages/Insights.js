import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import RiskChart from '../components/charts/RiskChart';
import '../styles/Insights.css'
import '../styles/AirQualityControls.css'
import AnxietyRiskChart from '../components/charts/AnxietyRiskChart';
import CognitiveRiskChart from '../components/charts/CognitiveRiskChart';
import StressRiskChart from '../components/charts/StressRiskChart';
import { FaWifi, FaEllipsisV } from 'react-icons/fa';
import AirQualityControls from '../components/AirQualityControls';
import AirQualityInsight from '../components/AirQualityInsight';

const Insights = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const fetchData = async () => {
    try {
      if (!userProfile?.city) {
        console.log('No city selected');
        return;
      }

      const { data: airData, error: airError } = await supabase
        .from('weather_data')
        .select('*')
        .eq('city', userProfile.city)
        .order('created_at', { ascending: false })
        .limit(30);

      if (airError) throw airError;

      // Process the data here if needed
      console.log('Fetched air data:', airData);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch air quality data');
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const age = calculateAge(data.birthdate);
      console.log('User birthdate:', data.birthdate);
      console.log('Calculated age:', age);

      setUserProfile({
        ...data,
        age: age
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
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

  if (loading) return <div>Loading insights...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userProfile) return <div>Please complete your profile to view insights</div>;

  return (
    <div className="insights-container" style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>Personal Indoor Insights</h1>

      {/* Air Quality Insight Banner */}
      <AirQualityInsight 
        insight="You had 2 days with high VOC levels this week. Using an air purifier or improving ventilation could help reduce anxiety triggers."
      />

      {/* Connected Devices Card */}
      <div className="insight-card" style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0 }}>Connected Devices</h2>
          <button style={{
            background: '#D9F6BB',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '100px',
            color: '#043A24',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            + Add Device
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {devices.map(device => (
            <div key={device.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #eee',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  background: '#D9F6BB',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaWifi color="#043A24" size={24} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{device.name}</h3>
                  <p style={{ margin: 0, color: '#666' }}>Last updated: {device.lastUpdated}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: device.status === 'Connected' ? '#4CAF50' : '#f44336'
                  }} />
                  {device.status}
                </span>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px'
                }}>
                  <FaEllipsisV color="#666" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Air Quality Controls */}
      <AirQualityControls 
        onSettingsChange={handleAirQualitySettingsChange}
        initialSettings={airQualitySettings}
      />

      {/* Existing Risk Analysis Cards */}
      <div className="insight-card" style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div className="insight-header" style={{
          marginBottom: '20px'
        }}>
          <h2>Anxiety Risk Analysis</h2>
          <p>Track how air quality affects your anxiety risk over different time periods</p>
        </div>
        <AnxietyRiskChart 
          userPreferences={userProfile} 
          airQualitySettings={airQualitySettings}
        />
      </div>

      <div className="insight-card" style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div className="insight-header" style={{
          marginBottom: '20px'
        }}>
          <h2>Cognitive Function Risk Analysis</h2>
          <p>Monitor long-term cognitive health risks based on 90-day rolling PM2.5 exposure</p>
        </div>
        <CognitiveRiskChart 
          userPreferences={userProfile} 
          airQualitySettings={airQualitySettings}
        />
      </div>

      <div className="insight-card" style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div className="insight-header" style={{
          marginBottom: '20px'
        }}>
          <h2>Stress Risk Analysis</h2>
          <p>Monitor chronic stress risk based on long-term PM2.5 exposure patterns</p>
        </div>
        <StressRiskChart 
          userPreferences={userProfile}
          airQualitySettings={airQualitySettings}
        />
      </div>
    </div>
  );
};

export default Insights; 