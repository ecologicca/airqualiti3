import React from 'react';

const RespiratoryHealthScore = ({ score, changePercentage }) => {
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
        Respiratory Health Impact
      </h2>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
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
            fontSize: '3.5rem',
            fontWeight: '500',
            color: '#043A24'
          }}>
            {score}
          </div>
          <div style={{
            fontSize: '1.2rem',
            color: '#666'
          }}>
            Health Score
          </div>
        </div>

        <div style={{
          background: '#e6f4ea',
          padding: '0.75rem 1.5rem',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#043A24'
        }}>
          <span>📈</span>
          <span>{`${changePercentage > 0 ? '+' : ''}${changePercentage}% from last month`}</span>
        </div>

        <p style={{
          color: '#666',
          textAlign: 'center',
          maxWidth: '500px',
          marginTop: '1rem'
        }}>
          Your respiratory health has improved since you started monitoring indoor air quality.
        </p>
      </div>
    </div>
  );
};

export default RespiratoryHealthScore; 