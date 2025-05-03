import React from 'react';

const ChartLegend = ({ activeDatasets, onToggle, showAirPurifier, userPreferences }) => {
  const legendItems = [
    { label: 'Outdoor', color: 'rgba(4, 58, 36, 0.9)' },
    { label: 'Indoor', color: 'rgba(217, 246, 187, 0.9)' },
    { label: 'HVAC', color: 'rgba(169, 237, 138, 0.9)', show: userPreferences?.has_HVAC },
    { label: 'Air Purifier', color: 'rgba(169, 237, 138, 0.9)', show: userPreferences?.has_ecologgica }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      gap: '2rem', 
      marginTop: '2rem',
      padding: '1rem'
    }}>
      {legendItems.filter(item => item.show !== false).map(item => (
        <div 
          key={item.label} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            cursor: 'pointer'
          }}
          onClick={() => onToggle(item.label)}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: activeDatasets[item.label] ? item.color : 'white',
            border: `2px solid ${item.color}`,
            transition: 'background-color 0.2s ease'
          }} />
          <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ChartLegend; 