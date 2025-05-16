import React, { useState, useEffect } from 'react';
import { FaWindowMaximize, FaSprayCan, FaFilter } from 'react-icons/fa';

const AirQualityControls = ({ onSettingsChange, initialSettings }) => {
  const [settings, setSettings] = useState(initialSettings || {
    windowsOpen: false,
    nonToxicProducts: false,
    recentFilterChange: false
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleSettingChange = (setting) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  // Calculate total reduction percentage
  const calculateReduction = () => {
    let reduction = 0;
    if (settings.windowsOpen) reduction += 10;
    if (settings.nonToxicProducts) reduction += 8;
    if (settings.recentFilterChange) reduction += 15;
    return reduction;
  };

  return (
    <div className="air-quality-controls" style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      {/* Air Quality Improvement Controls */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Air Quality Improvements</h3>
        <p style={{ 
          textAlign: 'center', 
          fontSize: '18px', 
          color: '#043A24',
          marginBottom: '20px'
        }}>
          Total PM2.5 Reduction: {calculateReduction()}%
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          <div className="air-quality-control-row">
            <div className="control-label">
              <FaWindowMaximize size={24} color="#002B19" />
              <div className="label-content">
                <span>Windows Open</span>
                <span className="reduction-label">(-10% PM2.5)</span>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.windowsOpen}
                onChange={() => handleSettingChange('windowsOpen')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="air-quality-control-row">
            <div className="control-label">
              <FaSprayCan size={24} color="#002B19" />
              <div className="label-content">
                <span>Non-Toxic Cleaning Products</span>
                <span className="reduction-label">(-8% PM2.5)</span>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.nonToxicProducts}
                onChange={() => handleSettingChange('nonToxicProducts')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="air-quality-control-row">
            <div className="control-label">
              <FaFilter size={24} color="#002B19" />
              <div className="label-content">
                <span>Filter Replaced (Last 6 Weeks)</span>
                <span className="reduction-label">(-15% PM2.5)</span>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.recentFilterChange}
                onChange={() => handleSettingChange('recentFilterChange')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirQualityControls; 