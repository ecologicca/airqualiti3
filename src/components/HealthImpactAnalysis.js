import React from 'react';
import { calculateIndoorWithDevices } from '../utils/airQualityCalculations';
import '../styles/HealthImpactAnalysis.css';

const normalize = (score) => {
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getImpactLevel = (score, metric) => {
  switch (metric) {
    case 'respiratory':
      if (score <= 30) return 'High';
      if (score <= 60) return 'Moderate';
      return 'Low';
    case 'cardiovascular':
      if (score <= 30) return 'High';
      if (score <= 60) return 'Moderate';
      return 'Low';
    case 'sleep':
      if (score < 40) return 'High';
      if (score <= 70) return 'Moderate';
      return 'Low';
    default:
      return 'Unknown';
  }
};

// Map sleep quality levels to numeric values for calculations
const sleepQualityMap = {
  'low': 30,
  'moderate': 65,
  'high': 90
};

const calculateRespiratoryScore = (activityLevel, pm25, pm10, sleepScore) => {
  // If we don't have PM data, return a moderate score
  if (pm25 === 0 && pm10 === 0) {
    return {
      score: 50,
      level: 'Moderate'
    };
  }

  // Higher activity level means better respiratory health (more resilient)
  // Higher PM2.5 and PM10 mean worse respiratory health
  // Better sleep means better respiratory health
  const score = normalize(
    100 - (
      (pm25 * 3.0) +     // PM2.5 has biggest negative impact
      (pm10 * 2.0) +     // PM10 has significant negative impact
      (activityLevel * -5) + // Activity level significantly improves score (negative means reduction)
      (sleepScore * -0.3)    // Sleep quality slightly improves score (negative means reduction)
    )
  );
  return {
    score,
    level: getImpactLevel(score, 'respiratory')
  };
};

const calculateCardiovascularScore = (activityLevel, pm25, pm10, sleepScore) => {
  // If we don't have PM data, return a moderate score
  if (pm25 === 0 && pm10 === 0) {
    return {
      score: 50,
      level: 'Moderate'
    };
  }

  const score = normalize(
    100 - (
      (pm25 * 2.5) +     // PM2.5 has biggest negative impact
      (pm10 * 1.5) +     // PM10 has significant negative impact
      (activityLevel * -4) + // Activity level significantly improves score
      (sleepScore * -0.8)    // Sleep quality moderately improves score
    )
  );
  return {
    score,
    level: getImpactLevel(score, 'cardiovascular')
  };
};

const calculateSleepScore = (sleepScore, pm25, userAnxietyLevel) => {
  const score = normalize(
    (sleepScore * 1.5) -
    (pm25 * 0.8) -
    (userAnxietyLevel * 4)
  );
  return {
    score,
    level: getImpactLevel(score, 'sleep')
  };
};

const MetricCard = ({ title, subtitle, score, level, color }) => (
  <div className="health-metric-card">
    <h3 className="metric-title">{title}</h3>
    <p className="metric-subtitle">{subtitle}</p>
    <div className="metric-details">
      <div className="impact-level">
        <div>Impact Level: {level}</div>
      </div>
      <div className="score-circle">
        {score}%
      </div>
    </div>
    <div className="progress-bar-container">
      <div 
        className="progress-bar"
        style={{
          width: `${score}%`,
          backgroundColor: color
        }} 
      />
    </div>
  </div>
);

const HealthImpactAnalysis = ({ data, userPreferences }) => {
  // Use the most recent data point for calculations
  const latestData = data[0] || {};
  const pm25 = latestData['PM 2.5'] || 0;
  const pm10 = latestData['PM 10'] || 0;
  
  // Get values from user preferences using the correct field names
  const activityLevel = userPreferences?.activity_level || 5;
  const sleepLevel = userPreferences?.sleep_level || 'moderate';
  const sleepScore = sleepQualityMap[sleepLevel] || 65; // Convert sleep level to numeric score
  const userAnxietyLevel = userPreferences?.anxiety_base_level || 5;

  // Calculate adjusted values based on indoor/device settings
  const adjustedPM25 = calculateIndoorWithDevices(
    pm25,
    userPreferences?.has_HVAC || false,
    userPreferences?.has_ecologgica || false
  );
  
  const adjustedPM10 = calculateIndoorWithDevices(
    pm10,
    userPreferences?.has_HVAC || false,
    userPreferences?.has_ecologgica || false
  );

  const respiratoryMetrics = calculateRespiratoryScore(activityLevel, adjustedPM25, adjustedPM10, sleepScore);
  const cardiovascularMetrics = calculateCardiovascularScore(activityLevel, adjustedPM25, adjustedPM10, sleepScore);
  const sleepMetrics = calculateSleepScore(sleepScore, adjustedPM25, userAnxietyLevel);

  return (
    <div className="health-impact-container">
      <div className="health-metrics-grid">
        <MetricCard
          title="Respiratory Health"
          subtitle="Impact on breathing, lungs, and airway conditions"
          score={respiratoryMetrics.score}
          level={respiratoryMetrics.level}
          color="#043A24"
        />
        <MetricCard
          title="Cardiovascular Health"
          subtitle="Impact on heart and blood vessel conditions"
          score={cardiovascularMetrics.score}
          level={cardiovascularMetrics.level}
          color="#90c789"
        />
        <MetricCard
          title="Sleep Quality"
          subtitle="Impact on sleep patterns and overall rest"
          score={sleepMetrics.score}
          level={sleepMetrics.level}
          color="#D9F6BB"
        />
      </div>
    </div>
  );
};

export default HealthImpactAnalysis; 