// Standard reduction percentages for different environments and devices
export const calculateIndoorValue = (outdoorValue) => {
  return outdoorValue * 0.7; // 30% reduction for indoor
};

export const calculateHVACValue = (indoorValue) => {
  return indoorValue * 0.8; // Additional 20% reduction with HVAC
};

export const calculateAirPurifierValue = (indoorValue) => {
  return indoorValue * 0.6; // Additional 40% reduction with Air Purifier
};

export const calculateIndoorWithDevices = (outdoorValue, hasHVAC, hasAirPurifier) => {
  let indoorValue = calculateIndoorValue(outdoorValue);
  
  if (hasHVAC && hasAirPurifier) {
    return indoorValue * 0.4; // 60% total reduction for both devices
  } else if (hasHVAC) {
    return calculateHVACValue(indoorValue);
  } else if (hasAirPurifier) {
    return calculateAirPurifierValue(indoorValue);
  }
  
  return indoorValue;
};

// Calculate the reduction factor based on air quality settings
export const calculatePM25Reduction = (airQualitySettings) => {
  let reductionPercentage = 0;
  
  if (airQualitySettings?.windowsOpen) {
    reductionPercentage += 10;
  }
  if (airQualitySettings?.nonToxicProducts) {
    reductionPercentage += 8;
  }
  if (airQualitySettings?.recentFilterChange) {
    reductionPercentage += 15;
  }
  
  return 1 - (reductionPercentage / 100);
};

// Apply reduction to PM2.5 value
export const applyPM25Reduction = (value, airQualitySettings) => {
  const reductionFactor = calculatePM25Reduction(airQualitySettings);
  return value * reductionFactor;
};

// Apply reduction to risk score
export const applyRiskReduction = (riskScore, airQualitySettings) => {
  const reductionFactor = calculatePM25Reduction(airQualitySettings);
  return riskScore * reductionFactor;
};

try {
    // Your existing code
} catch (error) {
    console.error('Detailed error:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        // Add any relevant context
        database: !!process.env.DATABASE_URL,
        apis: {
            waqi: !!process.env.WAQI_API_TOKEN,
            weather: !!process.env.OPENWEATHER_API_KEY
        }
    });
    throw error;
} 