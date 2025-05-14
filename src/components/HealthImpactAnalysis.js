import React, { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import '../styles/HealthImpactAnalysis.css';
import { FaHeart, FaLungs, FaBed } from 'react-icons/fa';

// Utility functions
const normalize = (score) => {
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getImpactLevel = (score) => {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Moderate';
  return 'Low';
};

const getImpactColors = (level) => {
  switch (level.toLowerCase()) {
    case 'high':
      return '#FF4D4D'; // Red for high impact (bad)
    case 'moderate':
      return '#FFA500'; // Orange for moderate
    case 'low':
      return '#4CAF50'; // Green for low impact (good)
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
  1: 'very low',
  2: 'low',
  3: 'moderate-low',
  4: 'moderate',
  5: 'moderate-high'
};

// Reverse mapping for calculations
const SLEEP_SCORE_MAP = {
  1: 90,  // very low - high impact
  2: 75,  // low - moderately high impact
  3: 60,  // moderate-low - moderate impact
  4: 45,  // moderate - moderately low impact
  5: 30   // moderate-high - low impact
};

// Calculation functions
const calculateRespiratoryScore = (activityLevel, pm25, pm10, sleepScore) => {
  let score = 30; // Start at 30 (low impact)
  
  // PM2.5 has major impact on respiratory health
  if (pm25 <= WHO_GUIDELINES.PM25_24H) {
    // Below WHO guideline - moderate increase
    score += (pm25 / WHO_GUIDELINES.PM25_24H) * 30;
  } else {
    // Above WHO guideline - more severe increase
    score += 30 + ((pm25 - WHO_GUIDELINES.PM25_24H) / WHO_GUIDELINES.PM25_24H) * 40;
  }
  
  // PM10 has moderate impact
  if (pm10 > 0) {
    if (pm10 <= WHO_GUIDELINES.PM10_24H) {
      score += (pm10 / WHO_GUIDELINES.PM10_24H) * 15;
    } else {
      score += 15 + ((pm10 - WHO_GUIDELINES.PM10_24H) / WHO_GUIDELINES.PM10_24H) * 25;
    }
  }
  
  // Activity level reduces impact
  score -= (activityLevel / 5) * 10; // Max 10% reduction
  
  // Poor sleep increases impact
  if (sleepScore >= 75) score += 10;
  else if (sleepScore >= 60) score += 5;
  
  const normalizedScore = normalize(score);
  
  return {
    score: normalizedScore,
    level: getImpactLevel(normalizedScore)
  };
};

const calculateCardiovascularScore = (activityLevel, pm25, pm10, sleepScore) => {
  let score = 25; // Start at 25 (low impact)
  
  // PM2.5 has significant impact on cardiovascular health
  if (pm25 <= WHO_GUIDELINES.PM25_24H) {
    score += (pm25 / WHO_GUIDELINES.PM25_24H) * 35;
  } else {
    score += 35 + ((pm25 - WHO_GUIDELINES.PM25_24H) / WHO_GUIDELINES.PM25_24H) * 45;
  }
  
  // PM10 has less impact than on respiratory
  if (pm10 > 0) {
    if (pm10 <= WHO_GUIDELINES.PM10_24H) {
      score += (pm10 / WHO_GUIDELINES.PM10_24H) * 10;
    } else {
      score += 10 + ((pm10 - WHO_GUIDELINES.PM10_24H) / WHO_GUIDELINES.PM10_24H) * 20;
    }
  }
  
  // Activity level reduces impact
  score -= (activityLevel / 5) * 15; // Max 15% reduction
  
  // Poor sleep increases impact
  if (sleepScore >= 75) score += 12;
  else if (sleepScore >= 60) score += 6;
  
  const normalizedScore = normalize(score);
  
  return {
    score: normalizedScore,
    level: getImpactLevel(normalizedScore)
  };
};

const calculateSleepScore = (sleepLevel, pm25, anxietyLevel) => {
  // Start with base impact from sleep level
  let score = SLEEP_SCORE_MAP[sleepLevel] || 60;
  
  // PM2.5 increases impact on sleep quality
  if (pm25 <= WHO_GUIDELINES.PM25_24H) {
    score += (pm25 / WHO_GUIDELINES.PM25_24H) * 15;
  } else {
    score += 15 + ((pm25 - WHO_GUIDELINES.PM25_24H) / WHO_GUIDELINES.PM25_24H) * 25;
  }
  
  // Higher anxiety level increases impact
  score += (anxietyLevel / 5) * 20; // Max 20% increase
  
  const normalizedScore = normalize(score);
  
  return {
    score: normalizedScore,
    level: getImpactLevel(normalizedScore)
  };
};

const HealthMetric = ({ icon, title, subtitle, score, level }) => {
  return (
    <div className="health-metric">
      <div className="metric-header">
        <div className="metric-icon" style={{ backgroundColor: '#e6f4ea' }}>
          {icon}
        </div>
        <div>
          <h3>{title}</h3>
          <p className="metric-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="metric-status">
        <span className="impact-level">
          Impact Level: {level}
        </span>
        <span className="score">{score}%</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar"
          style={{
            width: `${score}%`,
            backgroundColor: level === 'High' ? '#FF4D4D' : level === 'Moderate' ? '#FFA500' : '#4CAF50'
          }}
        />
      </div>
    </div>
  );
};

const HealthImpactAnalysis = ({ data, userPreferences }) => {
  const [recommendations, setRecommendations] = useState([]);
  
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
  const sleepLevel = Number(userPreferences?.sleep_level) || SLEEP_QUALITY_MAP.moderate;
  const sleepScore = SLEEP_SCORE_MAP[sleepLevel] || 65;
  const userAnxietyLevel = Number(userPreferences?.anxiety_base_level) || 5;

  console.log('Raw Values:', {
    pm25,
    pm10,
    activityLevel,
    sleepLevel,
    sleepScore,
    userAnxietyLevel,
    userPreferences
  });

  // Adjust PM values based on air purification systems
  let adjustedPM25 = pm25;
  let adjustedPM10 = pm10;
  
  if (userPreferences?.has_HVAC) {
    adjustedPM25 *= 0.7; // 30% reduction
    adjustedPM10 *= 0.7;
  }
  if (userPreferences?.has_ecologgica) {
    adjustedPM25 *= 0.6; // Additional 40% reduction
    adjustedPM10 *= 0.6;
  }

  // Calculate metrics with adjusted values
  const respiratoryMetrics = calculateRespiratoryScore(activityLevel, adjustedPM25, adjustedPM10, sleepScore);
  const cardiovascularMetrics = calculateCardiovascularScore(activityLevel, adjustedPM25, adjustedPM10, sleepScore);
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

  // Update recommendations when metrics change
  useEffect(() => {
    const highImpactAreas = [];
    if (respiratoryMetrics.level === 'High') highImpactAreas.push('respiratory');
    if (cardiovascularMetrics.level === 'High') highImpactAreas.push('cardiovascular');
    if (sleepMetrics.level === 'High') highImpactAreas.push('sleep');

    const defaultRecommendations = [
      "Use air purifier in bedroom to improve sleep quality.",
      "Enjoy outdoor activities when air quality is good.",
      "Stay hydrated to help your body process pollutants."
    ];

    // If there are high impact areas, provide specific recommendations
    if (highImpactAreas.length > 0) {
      const newRecommendations = [];
      if (highImpactAreas.includes('respiratory')) {
        newRecommendations.push("Use air purifier in bedroom to improve respiratory health.");
      }
      if (highImpactAreas.includes('cardiovascular')) {
        newRecommendations.push("Consider indoor exercises when air quality is poor.");
      }
      if (highImpactAreas.includes('sleep')) {
        newRecommendations.push("Ensure bedroom has good ventilation for better sleep.");
      }
      setRecommendations(newRecommendations.length ? newRecommendations : defaultRecommendations);
    } else {
      setRecommendations(defaultRecommendations);
    }
  }, [respiratoryMetrics.level, cardiovascularMetrics.level, sleepMetrics.level]);

  return (
    <div className="health-impact-card">
      <div className="health-metrics">
        <HealthMetric
          icon={<FaLungs />}
          title="Respiratory Health"
          subtitle="Impact on breathing, lungs, and airway conditions"
          score={respiratoryMetrics.score}
          level={respiratoryMetrics.level}
        />
        <HealthMetric
          icon={<FaHeart />}
          title="Cardiovascular Health"
          subtitle="Impact on heart and blood vessel conditions"
          score={cardiovascularMetrics.score}
          level={cardiovascularMetrics.level}
        />
        <HealthMetric
          icon={<FaBed />}
          title="Sleep Quality"
          subtitle="Impact on sleep patterns and overall rest"
          score={sleepMetrics.score}
          level={sleepMetrics.level}
        />
      </div>
      
      <div className="recommendations-section">
        <h3>Recommendations</h3>
        <ul className="recommendations-list">
          {recommendations.map((recommendation, index) => (
            <li key={index}>
              <span className="checkmark">✓</span>
              {recommendation}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HealthImpactAnalysis; 