import React from 'react';
import { FaChartLine, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';

const Insights = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Insights</h1>
      
      <div style={styles.cardsContainer}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <FaChartLine style={styles.icon} />
            <h2 style={styles.cardTitle}>Trend Analysis</h2>
          </div>
          <p style={styles.cardDescription}>
            View detailed analysis of your air quality trends and patterns over time.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <FaCalendarAlt style={styles.icon} />
            <h2 style={styles.cardTitle}>Historical Data</h2>
          </div>
          <p style={styles.cardDescription}>
            Access and compare historical air quality data across different time periods.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <FaExclamationTriangle style={styles.icon} />
            <h2 style={styles.cardTitle}>Risk Assessment</h2>
          </div>
          <p style={styles.cardDescription}>
            Understand potential health risks based on your air quality exposure patterns.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    color: '#043A24',
    marginBottom: '32px',
    fontSize: '28px',
    fontWeight: '600',
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginTop: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(4, 58, 36, 0.1)',
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '12px',
  },
  icon: {
    fontSize: '24px',
    color: '#043A24',
  },
  cardTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#043A24',
    fontWeight: '500',
  },
  cardDescription: {
    margin: 0,
    color: '#666',
    lineHeight: '1.5',
  },
};

export default Insights; 