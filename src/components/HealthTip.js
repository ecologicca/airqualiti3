import React, { useEffect, useState } from 'react';

const healthTips = [
  "Opening windows for just 5-10 minutes can improve indoor air quality.",
  "Place air-purifying plants like Spider Plants or Peace Lilies in your home.",
  "Change your HVAC filters every 60-90 days for optimal air quality.",
  "Use natural cleaning products to reduce harmful chemical emissions.",
  "Keep indoor humidity between 30-50% to prevent mold growth.",
  "Vacuum with a HEPA filter twice weekly to reduce indoor particulates.",
  "Don't smoke indoors - secondhand smoke can linger for hours.",
  "Clean bedding weekly in hot water to reduce dust mites.",
  "Use doormats to reduce tracked-in pollutants.",
  "Run bathroom fans during and 30 minutes after showers.",
  "Keep indoor plants dust-free to maximize their air-cleaning ability.",
  "Avoid burning candles or using air fresheners that emit VOCs.",
  "Schedule annual HVAC maintenance for optimal air filtration.",
  "Use exhaust fans while cooking to remove airborne particles.",
  "Keep your home's relative humidity below 60% to prevent mold.",
  "Regularly clean or replace range hood filters.",
  "Open windows during and after cleaning to ventilate spaces.",
  "Consider using an air quality monitor to track indoor pollution.",
  "Dust with a damp cloth to prevent particles from becoming airborne.",
  "Keep pets groomed to reduce dander in the air.",
  "Use carbon monoxide detectors on every floor of your home.",
  "Choose low-VOC paints and finishes for home improvements.",
  "Clean air vents and ducts regularly to prevent dust circulation.",
  "Store chemicals, paints, and solvents in a well-ventilated area.",
  "Use natural pest control methods to avoid harmful pesticides.",
  "Keep indoor temperature stable to prevent moisture issues.",
  "Consider removing shoes indoors to reduce tracked pollutants.",
  "Use UV air purifiers to eliminate airborne bacteria.",
  "Regularly clean or replace air purifier filters.",
  "Test your home for radon - it's the second leading cause of lung cancer."
];

const HealthTip = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // Get the last login date from localStorage
    const lastLogin = localStorage.getItem('lastLoginDate');
    const today = new Date().toDateString();

    if (lastLogin !== today) {
      // If it's a new day, update the tip index
      const newIndex = Math.floor(Math.random() * healthTips.length);
      setTipIndex(newIndex);
      localStorage.setItem('lastLoginDate', today);
      localStorage.setItem('currentTipIndex', newIndex.toString());
    } else {
      // If same day, use the stored tip index
      const storedIndex = localStorage.getItem('currentTipIndex');
      setTipIndex(storedIndex ? parseInt(storedIndex) : 0);
    }
  }, []);

  return (
    <div className="health-tip">
      <h3>Healthy Tip</h3>
      <p>{healthTips[tipIndex]}</p>
    </div>
  );
};

export default HealthTip; 