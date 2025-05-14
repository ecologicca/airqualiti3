import React from 'react';

const PMDisplay = ({ year, value, rating }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem'
  }}>
    <h2 style={{
      color: '#043A24',
      fontSize: '1.75rem',
      margin: 0
    }}>
      Average PM2.5 Levels in {year}
    </h2>
    
    <div style={{
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      backgroundColor: '#e6f4ea',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        fontSize: '3rem',
        fontWeight: '500',
        color: '#043A24'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '1rem',
        color: '#666'
      }}>
        μg/m³
      </div>
    </div>

    <div style={{
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center'
    }}>
      <span style={{
        color: '#666',
        backgroundColor: '#f5f5f5',
        padding: '0.5rem 1rem',
        borderRadius: '20px'
      }}>
        City Average
      </span>
      <span style={{
        color: '#043A24',
        fontWeight: '500'
      }}>
        {rating}
      </span>
    </div>
  </div>
);

const YearlyPM25Comparison = ({ city }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '3rem',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4rem',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <PMDisplay 
          year={2025}
          value={12.7}
          rating="Moderate"
        />
        <PMDisplay 
          year={2024}
          value={8.3}
          rating="Good"
        />
      </div>

      <p style={{
        color: '#666',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto',
        fontSize: '1.1rem'
      }}>
        This level of particulate matter can impact cardiovascular health over time.
      </p>
    </div>
  );
};

export default YearlyPM25Comparison; 