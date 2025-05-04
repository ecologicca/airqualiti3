import React from 'react';

const ChartLegend = ({ activeDatasets, onToggle, colors = {} }) => {
  return (
    <div className="chart-legend">
      {Object.entries(activeDatasets).map(([label, isActive]) => (
        <button
          key={label}
          className={`legend-item ${isActive ? 'active' : ''}`}
          onClick={() => onToggle(label)}
          style={{
            '--button-color': colors[label] || '#043A24'
          }}
        >
          <span className="legend-dot"></span>
          {label}
        </button>
      ))}
    </div>
  );
};

export default ChartLegend; 