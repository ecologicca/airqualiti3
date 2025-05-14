export const chartColors = {
  outdoor: '#043A24',
  indoor: '#D9F6BB',
  hvac: '#A9ED8A',
  airPurifier: '#7FD663',
  background: '#FFFFFF',
  text: '#043A24',
  subtext: '#666666',
  buttonActive: '#043A24',
  buttonInactive: '#D9F6BB',
  buttonText: '#043A24',
  buttonTextActive: '#FFFFFF',
  grid: 'rgba(0, 0, 0, 0.1)'
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: {
        color: chartColors.grid,
        drawBorder: false
      },
      ticks: {
        font: {
          size: 12
        },
        color: chartColors.subtext
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: chartColors.grid,
        drawBorder: false
      },
      ticks: {
        font: {
          size: 12
        },
        color: chartColors.subtext,
        callback: function(value) {
          return value + ' μg/m³';
        }
      }
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 13
      },
      bodyFont: {
        size: 12
      },
      padding: 12
    }
  }
};

export const timeRangeButtonStyles = {
  container: {
    display: 'flex',
    gap: '0.5rem',
    background: '#f5f5f5',
    padding: '0.25rem',
    borderRadius: '2rem'
  },
  button: (isActive) => ({
    padding: '0.5rem 1.25rem',
    borderRadius: '1.5rem',
    border: 'none',
    background: isActive ? chartColors.buttonActive : chartColors.buttonInactive,
    color: isActive ? chartColors.buttonTextActive : chartColors.buttonText,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  })
};

export const legendStyles = {
  container: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  dot: (color) => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: color
  }),
  label: {
    color: chartColors.subtext,
    fontSize: '0.9rem'
  }
}; 