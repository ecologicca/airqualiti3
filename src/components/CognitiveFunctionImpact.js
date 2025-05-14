import React from 'react';

const MetricBox = ({ label, percentage }) => (
  <div style={{
    background: '#e6f4ea',
    padding: '1.5rem',
    borderRadius: '12px',
    textAlign: 'center',
    minWidth: '120px'
  }}>
    <div style={{
      fontSize: '1.2rem',
      color: '#043A24',
      marginBottom: '0.5rem'
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '2rem',
      color: '#043A24',
      fontWeight: '500'
    }}>
      {percentage > 0 ? `+${percentage}%` : `${percentage}%`}
    </div>
  </div>
);

const CognitiveFunctionImpact = () => {
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
        Cognitive Function Impact
      </h2>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <MetricBox label="Memory" percentage={4} />
        <MetricBox label="Focus" percentage={7} />
        <MetricBox label="Clarity" percentage={5} />
      </div>

      <p style={{
        color: '#666',
        textAlign: 'center',
        fontSize: '1.1rem'
      }}>
        Improvements in cognitive function metrics based on air quality correlation studies and self-reported data.
      </p>
    </div>
  );
};

export default CognitiveFunctionImpact; 