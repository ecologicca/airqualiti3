import React from 'react';
import { Line } from 'react-chartjs-2';

const RiskChart = ({ data, threshold, baseRatio, periodLabel, userModifier }) => {
  const calculateRiskScore = (pm25Value) => {
    return (pm25Value / threshold) * baseRatio * userModifier;
  };

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Risk Score',
        data: data.map(d => calculateRiskScore(d.value)),
        borderColor: '#043A24',
        backgroundColor: 'rgba(4, 58, 36, 0.1)',
        borderWidth: 2,
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${periodLabel} Risk Trend`
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const score = context.raw.toFixed(2);
            return `Risk Score: ${score}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Risk Score'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  return (
    <div className="risk-chart">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default RiskChart; 