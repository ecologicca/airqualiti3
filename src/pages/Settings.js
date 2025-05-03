import React, { useState, useEffect } from 'react';
import { FaBell, FaEnvelope } from 'react-icons/fa';
import { supabase } from '../supabaseClient';

const Settings = () => {
  const [settings, setSettings] = useState({
    pushNotifications: false,
    emailNotifications: false,
    dailyAirQuality: true,
    airQualityAlerts: true,
    healthImpact: true,
    weeklyReports: true
  });
  
  // Add state to track if settings have been modified
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          pushNotifications: data.push_notifications,
          emailNotifications: data.email_notifications,
          dailyAirQuality: data.daily_air_quality,
          airQualityAlerts: data.air_quality_alerts,
          healthImpact: data.health_impact_updates,
          weeklyReports: data.weekly_reports
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    setHasChanges(true); // Mark that changes have been made
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          push_notifications: settings.pushNotifications,
          email_notifications: settings.emailNotifications,
          daily_air_quality: settings.dailyAirQuality,
          air_quality_alerts: settings.airQualityAlerts,
          health_impact_updates: settings.healthImpact,
          weekly_reports: settings.weeklyReports,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setHasChanges(false); // Reset changes flag after successful save
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="notification-settings">Loading...</div>;
  }

  return (
    <div className="notification-settings">
      <h1>Notification Settings</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="notification-section">
        <h2>Notification Methods</h2>
        <div className="notification-method">
          <div className="method-info">
            <FaBell className="method-icon" />
            <span>Push Notifications</span>
          </div>
          <div 
            className={`pill-toggle ${settings.pushNotifications ? 'active' : ''}`}
            onClick={() => handleToggle('pushNotifications')}
          >
            <div className="toggle-slider" />
          </div>
        </div>

        <div className="notification-method">
          <div className="method-info">
            <FaEnvelope className="method-icon" />
            <span>Email Notifications</span>
          </div>
          <div 
            className={`pill-toggle ${settings.emailNotifications ? 'active' : ''}`}
            onClick={() => handleToggle('emailNotifications')}
          >
            <div className="toggle-slider" />
          </div>
        </div>
      </div>

      <div className="notification-section">
        <h2>Alert Types</h2>
        
        <div className="notification-method">
          <span>Daily Air Quality Summary</span>
          <div 
            className={`pill-toggle ${settings.dailyAirQuality ? 'active' : ''}`}
            onClick={() => handleToggle('dailyAirQuality')}
          >
            <div className="toggle-slider" />
          </div>
        </div>

        <div className="notification-method">
          <span>Air Quality Alerts</span>
          <div 
            className={`pill-toggle ${settings.airQualityAlerts ? 'active' : ''}`}
            onClick={() => handleToggle('airQualityAlerts')}
          >
            <div className="toggle-slider" />
          </div>
        </div>

        <div className="notification-method">
          <span>Health Impact Updates</span>
          <div 
            className={`pill-toggle ${settings.healthImpact ? 'active' : ''}`}
            onClick={() => handleToggle('healthImpact')}
          >
            <div className="toggle-slider" />
          </div>
        </div>

        <div className="notification-method">
          <span>Weekly Health Reports</span>
          <div 
            className={`pill-toggle ${settings.weeklyReports ? 'active' : ''}`}
            onClick={() => handleToggle('weeklyReports')}
          >
            <div className="toggle-slider" />
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button 
          className="save-settings-button"
          onClick={saveSettings}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings; 