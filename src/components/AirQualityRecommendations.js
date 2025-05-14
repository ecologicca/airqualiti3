import React from 'react';

const Recommendation = ({ number, title, description }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.5rem'
  }}>
    <div style={{
      background: '#e6f4ea',
      borderRadius: '50%',
      width: '2rem',
      height: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#043A24',
      fontWeight: '500',
      flexShrink: 0
    }}>
      {number}
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

const AirQualityRecommendations = () => {
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
        Air Quality Improvement Recommendations
      </h2>

      <Recommendation 
        number="1"
        title="Use air purifiers in frequently used rooms"
        description="HEPA filters can remove up to 99.97% of airborne particles"
      />

      <Recommendation 
        number="2"
        title="Ventilate your home regularly"
        description="15-20 minutes twice daily when outdoor air quality is good"
      />

      <Recommendation 
        number="3"
        title="Monitor indoor humidity levels"
        description="Maintain between 30-50% to prevent mold and allergens"
      />

      <Recommendation 
        number="4"
        title="Use low-VOC products"
        description="For cleaning, paint, and household materials"
      />
    </div>
  );
};

export default AirQualityRecommendations; 