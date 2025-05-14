import React from 'react';
import { FaLightbulb, FaBrain, FaGraduationCap } from 'react-icons/fa';

const HealthInsight = ({ icon, title, description }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.5rem'
  }}>
    <div style={{
      background: '#e6f4ea',
      borderRadius: '50%',
      padding: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#043A24',
      fontSize: '1.25rem'
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{
        color: '#043A24',
        fontSize: '1.2rem',
        marginBottom: '0.25rem'
      }}>
        {title}
      </h3>
      <p style={{
        color: '#666',
        margin: 0
      }}>
        {description}
      </p>
    </div>
  </div>
);

const AirQualityBrainHealth = () => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem'
    }}>
      <h2 style={{
        color: '#043A24',
        fontSize: '1.75rem',
        marginBottom: '2rem'
      }}>
        Air Quality and Brain Health
      </h2>

      <HealthInsight 
        icon={<FaLightbulb />}
        title="Cleaner indoor air linked to better sleep quality"
        description="Better sleep = improved cognitive function"
      />

      <HealthInsight 
        icon={<FaBrain />}
        title="Lower PM2.5 exposure reduces inflammation"
        description="Inflammation affects neural pathways"
      />

      <HealthInsight 
        icon={<FaGraduationCap />}
        title="Reduced pollutant exposure enhances learning"
        description="Studies show 5-10% performance improvement"
      />
    </div>
  );
};

export default AirQualityBrainHealth; 