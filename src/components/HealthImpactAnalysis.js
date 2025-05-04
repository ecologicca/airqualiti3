import React, { useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import '../styles/HealthImpactAnalysis.css';

// Utility functions
const normalize = (score) => {
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getImpactLevel = (score) => {
  if (score >= 60) return 'High';
  if (score >= 30) return 'Moderate';
  return 'Low';
};

const getImpactColors = (level) => {
  switch (level.toLowerCase()) {
    case 'high':
      return '#FF4D4D'; // Red
    case 'moderate':
      return '#FFA500'; // Orange
    case 'low':
      return '#4CAF50'; // Green
    default:
      return '#90c789';
  }
};

// Constants for WHO guidelines and thresholds
const WHO_GUIDELINES = {
  PM25_24H: 15,  // WHO guideline for 24-hour mean PM2.5
  PM10_24H: 45,  // WHO guideline for 24-hour mean PM10
};

// Sleep quality mapping (matching UserPreferences.js)
const SLEEP_QUALITY_MAP = {
  2: 'low',
  5: 'moderate',
  9: 'high'
};

// Reverse mapping for calculations
const SLEEP_SCORE_MAP = {
  2: 30,  // low
  5: 65,  // moderate
  9: 90   // high
};

// Calculation functions
const calculateRespiratoryScore = (activityLevel, pm25, pm10, sleepScore) => {
  // Adjust PM2.5 based on air purification
  let score = 0;
  
  // Base score on PM2.5 relative to WHO guidelines
  score += (pm25 / WHO_GUIDELINES.PM25_24H) * 50;
  
  // Add PM10 impact if available
  if (pm10 > 0) {
    score += (pm10 / WHO_GUIDELINES.PM10_24H) * 25;
  }
  
  // Activity level impact (10 is best, 1 is worst)
  score -= (activityLevel / 10) * 20;
  
  // Sleep impact (minor factor)
  if (sleepScore === 2) score += 10; // Poor sleep increases risk
  
  // Normalize between 0-100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  
  return {
    score: normalizedScore,
    level: getImpactLevel(normalizedScore)
  };
};

const calculateCardiovascularScore = (activityLevel, pm25, pm10, sleepScore) => {
  let score = 0;
  
  // PM2.5 has stronger impact on cardiovascular health
  score += (pm25 / WHO_GUIDELINES.PM25_24H) * 60;
  
  // PM10 impact if available
  if (pm10 > 0) {
    score += (pm10 / WHO_GUIDELINES.PM10_24H) * 20;
  }
  
  // Activity level has major impact on cardiovascular health
  score -= (activityLevel / 10) * 30;
  
  // Sleep impact
  if (sleepScore === 2) score += 15; // Poor sleep increases risk
  
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  
  return {
    score: normalizedScore,
    level: getImpactLevel(normalizedScore)
  };
};

const calculateSleepScore = (sleepLevel, pm25, anxietyLevel) => {
  let score = 0;
  
  // Base score on sleep level (2=low, 5=moderate, 9=high)
  if (sleepLevel === 2) score += 70;  // Poor sleep = high impact
  else if (sleepLevel === 5) score += 40;  // Moderate sleep = moderate impact
  else score += 10;  // Good sleep = low impact
  
  // Anxiety level impact (1-10 scale)
  score += (anxietyLevel / 10) * 30;
  
  // PM2.5 impact on sleep
  score += (pm25 / WHO_GUIDELINES.PM25_24H) * 20;
  
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  
  return {
    score: normalizedScore,
    level: getImpactLevel(normalizedScore)
  };
};

// Component for the impact bar
const ImpactBar = ({ level }) => {
  const color = getImpactColors(level);
  
  return (
    <div className="impact-bar-container">
      <div className="impact-segments">
        <div 
          className={`segment ${level.toLowerCase() === 'high' ? 'active' : ''}`}
          style={{ backgroundColor: color }}
        />
        <div 
          className={`segment ${level.toLowerCase() === 'moderate' ? 'active' : ''}`}
          style={{ backgroundColor: color }}
        />
        <div 
          className={`segment ${level.toLowerCase() === 'low' ? 'active' : ''}`}
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// Card component
const MetricCard = ({ title, subtitle, score, level, metric }) => {
  const color = getImpactColors(level);
  
  return (
    <div className="health-metric-card" data-tooltip-id={`tooltip-${metric}`}>
      <h3 className="metric-title">{title}</h3>
      <p className="metric-subtitle">{subtitle}</p>
      <div className="metric-details">
        <div className="impact-info">
          <div className="impact-level" style={{ color }}>
            Impact Level: {level}
          </div>
          <ImpactBar level={level} />
        </div>
        <div className="score-circle" style={{ color }}>
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
};

// Main component
const HealthImpactAnalysis = ({ data, userPreferences }) => {
  useEffect(() => {
    // Log only on mount or when dependencies change
    console.log('Health Impact Analysis Update:', {
      userPreferences,
      data: data?.[0]
    });
  }, [data, userPreferences]);

  // Use the most recent data point for calculations
  const latestData = data?.[0] || {};
  const pm25 = Number(latestData['PM 2.5']) || 0;
  const pm10 = Number(latestData['PM 10']) || 0;
  
  // Get values from user preferences with defaults
  const activityLevel = Number(userPreferences?.activity_level) || 5;
  // Get numeric sleep level from preferences
  const sleepLevel = Number(userPreferences?.sleep_level) || SLEEP_QUALITY_MAP.moderate;
  // Convert numeric sleep level to score for calculations
  const sleepScore = SLEEP_SCORE_MAP[sleepLevel] || 65;
  const userAnxietyLevel = Number(userPreferences?.anxiety_base_level) || 5;

  // Log the actual values being used
  console.log('Normalized Calculation Inputs:', {
    pm25,
    pm10,
    activityLevel,
    sleepLevel,
    sleepScore,
    userAnxietyLevel,
    hasHVAC: userPreferences?.has_HVAC,
    hasEcologgica: userPreferences?.has_ecologgica
  });

  // Adjust PM2.5 based on air purification systems
  let adjustedPM25 = pm25;
  if (userPreferences?.has_HVAC) adjustedPM25 *= 0.7; // 30% reduction
  if (userPreferences?.has_ecologgica) adjustedPM25 *= 0.6; // Additional 40% reduction

  const respiratoryMetrics = calculateRespiratoryScore(activityLevel, adjustedPM25, pm10, sleepScore);
  const cardiovascularMetrics = calculateCardiovascularScore(activityLevel, adjustedPM25, pm10, sleepScore);
  const sleepMetrics = calculateSleepScore(sleepLevel, adjustedPM25, userAnxietyLevel);

  // Log the final results
  console.log('Final Calculation Results:', {
    respiratory: {
      score: respiratoryMetrics.score,
      level: respiratoryMetrics.level
    },
    cardiovascular: {
      score: cardiovascularMetrics.score,
      level: cardiovascularMetrics.level
    },
    sleep: {
      score: sleepMetrics.score,
      level: sleepMetrics.level
    }
  });

  return (
    <div className="health-impact-container">
      <div className="health-metrics-grid">
        <MetricCard
          title="Respiratory Health"
          subtitle="Impact on breathing, lungs, and airway conditions"
          score={respiratoryMetrics.score}
          level={respiratoryMetrics.level}
          metric="respiratory"
        />
        <MetricCard
          title="Cardiovascular Health"
          subtitle="Impact on heart and blood vessel conditions"
          score={cardiovascularMetrics.score}
          level={cardiovascularMetrics.level}
          metric="cardiovascular"
        />
        <MetricCard
          title="Sleep Quality"
          subtitle="Impact on sleep patterns and overall rest"
          score={sleepMetrics.score}
          level={sleepMetrics.level}
          metric="sleep"
        />
      </div>
    </div>
  );
};

export default HealthImpactAnalysis; 