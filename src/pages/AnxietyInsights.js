import React, { useState } from 'react';
import WeeklyAnxietyChart from '../components/charts/WeeklyAnxietyChart';
import MonthlyAnxietyChart from '../components/charts/MonthlyAnxietyChart';
import QuarterlyAnxietyChart from '../components/charts/QuarterlyAnxietyChart';
import SixMonthAnxietyChart from '../components/charts/SixMonthAnxietyChart';

const AnxietyInsights = ({ userPreferences }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7-day');

  const periods = [
    { value: '7-day', label: 'Weekly' },
    { value: '30-day', label: 'Monthly' },
    { value: '90-day', label: 'Quarterly' },
    { value: '180-days', label: '6 Months' }
  ];

  const renderChart = () => {
    switch (selectedPeriod) {
      case '7-day':
        return <WeeklyAnxietyChart userPreferences={userPreferences} />;
      case '30-day':
        return <MonthlyAnxietyChart userPreferences={userPreferences} />;
      case '90-day':
        return <QuarterlyAnxietyChart userPreferences={userPreferences} />;
      case '180-days':
        return <SixMonthAnxietyChart userPreferences={userPreferences} />;
      default:
        return <WeeklyAnxietyChart userPreferences={userPreferences} />;
    }
  };

  return (
    <div className="insights-container">
      <div className="period-toggle">
        {periods.map(period => (
          <button
            key={period.value}
            className={`toggle-button ${selectedPeriod === period.value ? 'active' : ''}`}
            onClick={() => setSelectedPeriod(period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>
      <div className="chart-container">
        {renderChart()}
      </div>
    </div>
  );
};

export default AnxietyInsights; 