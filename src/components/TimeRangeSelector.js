import React from 'react';

const TimeRangeSelector = ({ timeRange, setTimeRange }) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px',
      justifyContent: 'flex-end',
      width: '100%'
    }}>
      <button 
        onClick={() => setTimeRange('day')}
        style={{
          padding: '8px 24px',
          borderRadius: '20px',
          border: 'none',
          background: timeRange === 'day' ? '#D9F6BB' : '#FFFFFF',
          color: '#043A24',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Day
      </button>
      <button 
        onClick={() => setTimeRange('week')}
        style={{
          padding: '8px 24px',
          borderRadius: '20px',
          border: 'none',
          background: timeRange === 'week' ? '#043A24' : '#D9F6BB',
          color: timeRange === 'week' ? '#FFFFFF' : '#043A24',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Week
      </button>
      <button 
        onClick={() => setTimeRange('month')}
        style={{
          padding: '8px 24px',
          borderRadius: '20px',
          border: 'none',
          background: timeRange === 'month' ? '#D9F6BB' : '#FFFFFF',
          color: '#043A24',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Month
      </button>
    </div>
  );
};

export default TimeRangeSelector; 