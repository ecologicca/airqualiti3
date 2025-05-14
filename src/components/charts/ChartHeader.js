import React from 'react';
import TimeRangeSelector from '../TimeRangeSelector';

const ChartHeader = ({ title, timeRange, setTimeRange }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '24px'
    }}>
      <h2 style={{ 
        margin: 0, 
        color: '#043A24', 
        fontSize: '24px'
      }}>
        {title}
      </h2>
      <div style={{ 
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%'
      }}>
        <TimeRangeSelector timeRange={timeRange} setTimeRange={setTimeRange} />
      </div>
    </div>
  );
};

export default ChartHeader; 