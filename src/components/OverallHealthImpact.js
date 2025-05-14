import React from 'react';

const HealthMetric = ({ category, status }) => (
  <div style={{
    marginBottom: '1.5rem'
  }}>
    <div style={{
      color: '#666',
      marginBottom: '0.5rem'
    }}>
      {category}
    </div>
    <div style={{
      color: '#043A24',
      fontSize: '1.5rem',
      fontWeight: '500'
    }}>
      {status}
    </div>
  </div>
);

const OverallHealthImpact = () => {
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
        Overall Health Impact
      </h2>

      <div style={{
        background: '#e6f4ea',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        display: 'inline-block',
        marginBottom: '1.5rem'
      }}>
        <span style={{ color: '#043A24' }}>HEALTH SCORE</span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <div style={{
          flex: 1,
          height: '8px',
          background: 'linear-gradient(to right, #e6f4ea, #043A24)',
          borderRadius: '4px',
          marginRight: '1rem'
        }} />
        <div style={{
          color: '#043A24',
          fontSize: '1.5rem',
          fontWeight: '500'
        }}>
          84%
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        color: '#666',
        marginBottom: '2rem'
      }}>
        <span>Poor</span>
        <span>Fair</span>
        <span>Good</span>
        <span>Excellent</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem'
      }}>
        <HealthMetric category="Cardiovascular" status="Good" />
        <HealthMetric category="Respiratory" status="Excellent" />
        <HealthMetric category="Immune System" status="Good" />
        <HealthMetric category="Skin Health" status="Fair" />
      </div>
    </div>
  );
};

export default OverallHealthImpact; 