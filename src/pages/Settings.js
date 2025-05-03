import React, { useState } from 'react';
import { FaBell, FaEnvelope } from 'react-icons/fa';

const Settings = () => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    dailyAirQuality: true,
    airQualityAlerts: true,
    healthImpact: true,
    weeklyReports: true
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Settings saved:', settings);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Notification Settings</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Notification Methods</h2>
        <div style={styles.settingItem}>
          <div style={styles.settingHeader}>
            <FaBell style={styles.icon} />
            <span style={styles.settingLabel}>Push Notifications</span>
          </div>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={settings.pushNotifications}
              onChange={() => handleToggle('pushNotifications')}
            />
            <span style={styles.slider}></span>
          </label>
        </div>

        <div style={styles.settingItem}>
          <div style={styles.settingHeader}>
            <FaEnvelope style={styles.icon} />
            <span style={styles.settingLabel}>Email Notifications</span>
          </div>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <span style={styles.slider}></span>
          </label>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Alert Types</h2>
        
        <div style={styles.settingItem}>
          <span style={styles.settingLabel}>Daily Air Quality Summary</span>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={settings.dailyAirQuality}
              onChange={() => handleToggle('dailyAirQuality')}
            />
            <span style={styles.slider}></span>
          </label>
        </div>

        <div style={styles.settingItem}>
          <span style={styles.settingLabel}>Air Quality Alerts</span>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={settings.airQualityAlerts}
              onChange={() => handleToggle('airQualityAlerts')}
            />
            <span style={styles.slider}></span>
          </label>
        </div>

        <div style={styles.settingItem}>
          <span style={styles.settingLabel}>Health Impact Updates</span>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={settings.healthImpact}
              onChange={() => handleToggle('healthImpact')}
            />
            <span style={styles.slider}></span>
          </label>
        </div>

        <div style={styles.settingItem}>
          <span style={styles.settingLabel}>Weekly Health Reports</span>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={settings.weeklyReports}
              onChange={() => handleToggle('weeklyReports')}
            />
            <span style={styles.slider}></span>
          </label>
        </div>
      </div>

      <button onClick={handleSave} style={styles.saveButton}>
        Save Notification Settings
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    color: '#043A24',
    marginBottom: '32px',
    fontSize: '28px',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(4, 58, 36, 0.1)',
  },
  sectionTitle: {
    color: '#043A24',
    fontSize: '20px',
    fontWeight: '500',
    marginBottom: '20px',
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid rgba(4, 58, 36, 0.1)',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  settingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    fontSize: '20px',
    color: '#043A24',
  },
  settingLabel: {
    color: '#043A24',
    fontSize: '16px',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '48px',
    height: '24px',
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '0.4s',
    borderRadius: '24px',
    '&:before': {
      position: 'absolute',
      content: '""',
      height: '20px',
      width: '20px',
      left: '2px',
      bottom: '2px',
      backgroundColor: 'white',
      transition: '0.4s',
      borderRadius: '50%',
    },
  },
  'input:checked + span': {
    backgroundColor: '#A9ED8A',
  },
  'input:checked + span:before': {
    transform: 'translateX(24px)',
  },
  saveButton: {
    backgroundColor: '#043A24',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#032918',
    },
  },
};

export default Settings; 