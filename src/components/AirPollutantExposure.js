import React from 'react';

const PollutantBar = ({ label, value, maxValue, unit }) => {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <span style={{ color: '#043A24', fontSize: '1.1rem' }}>{label}</span>
        <span style={{ color: '#666' }}>{`${value} ${unit}`}</span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: '#A9ED8A',
          borderRadius: '4px'
        }} />
      </div>
    </div>
  );
};

const AirPollutantExposure = ({ pollutants }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
    }}>
      <h2 style={{
        color: '#043A24',
        fontSize: '1.75rem',
        marginBottom: '2rem'
      }}>
        Air Pollutant Exposure
      </h2>

      <div>
        <PollutantBar 
          label="Ozone (O₃)"
          value={45}
          maxValue={100}
          unit="ppb"
        />
        <PollutantBar 
          label="Nitrogen Dioxide (NO₂)"
          value={32}
          maxValue={100}
          unit="ppb"
        />
        <PollutantBar 
          label="Sulfur Dioxide (SO₂)"
          value={15}
          maxValue={100}
          unit="ppb"
        />
        <PollutantBar 
          label="Carbon Monoxide (CO)"
          value={0.8}
          maxValue={10}
          unit="ppm"
        />
      </div>

      <p style={{
        color: '#666',
        marginTop: '2rem',
        textAlign: 'center'
      }}>
        All pollutants are within healthy limits for respiratory health.
      </p>
    </div>
  );
};

export default AirPollutantExposure; 