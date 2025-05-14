import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

const AirQualityInsight = ({ insight }) => {
  return (
    <div style={{
      backgroundColor: '#F8F9FA',
      padding: '20px',
      marginBottom: '32px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      borderRadius: '12px',
      border: '1px solid #E9ECEF'
    }}>
      <div style={{
        backgroundColor: '#E7F9F0',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <FaInfoCircle size={20} style={{ color: '#043A24' }} />
      </div>
      <div>
        <h2 style={{ 
          fontSize: '18px', 
          color: '#043A24',
          marginBottom: '6px',
          fontWeight: '600',
          lineHeight: '1.4'
        }}>
          Air Quality Insight
        </h2>
        <p style={{ 
          margin: 0,
          color: '#495057',
          fontSize: '15px',
          lineHeight: '1.5',
          fontWeight: '400'
        }}>
          {insight}
        </p>
      </div>
    </div>
  );
};

export default AirQualityInsight; 