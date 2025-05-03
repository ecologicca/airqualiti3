import React from 'react';
import { FaBook, FaVideo, FaNewspaper, FaQuestionCircle } from 'react-icons/fa';

const Resources = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Resources</h1>
      
      <div style={styles.content}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FaBook style={styles.icon} />
            Educational Materials
          </h2>
          <div style={styles.resourceList}>
            <div style={styles.resourceItem}>
              <h3 style={styles.resourceTitle}>Understanding Air Quality Metrics</h3>
              <p style={styles.resourceDescription}>
                Learn about different air quality measurements and what they mean for your health.
              </p>
            </div>
            <div style={styles.resourceItem}>
              <h3 style={styles.resourceTitle}>Health Impact Guide</h3>
              <p style={styles.resourceDescription}>
                Comprehensive guide on how air quality affects your health and well-being.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FaVideo style={styles.icon} />
            Video Tutorials
          </h2>
          <div style={styles.resourceList}>
            <div style={styles.resourceItem}>
              <h3 style={styles.resourceTitle}>Getting Started</h3>
              <p style={styles.resourceDescription}>
                Quick start guide to using your air quality monitoring system.
              </p>
            </div>
            <div style={styles.resourceItem}>
              <h3 style={styles.resourceTitle}>Advanced Features</h3>
              <p style={styles.resourceDescription}>
                Detailed tutorials on using advanced features and analysis tools.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FaNewspaper style={styles.icon} />
            Latest Updates
          </h2>
          <div style={styles.resourceList}>
            <div style={styles.resourceItem}>
              <h3 style={styles.resourceTitle}>Air Quality News</h3>
              <p style={styles.resourceDescription}>
                Stay informed about the latest air quality news and research.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FaQuestionCircle style={styles.icon} />
            FAQ
          </h2>
          <div style={styles.resourceList}>
            <div style={styles.resourceItem}>
              <h3 style={styles.resourceTitle}>Common Questions</h3>
              <p style={styles.resourceDescription}>
                Find answers to frequently asked questions about air quality monitoring.
              </p>
            </div>
          </div>
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(4, 58, 36, 0.1)',
  },
  sectionTitle: {
    color: '#043A24',
    fontSize: '24px',
    fontWeight: '500',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    fontSize: '24px',
    color: '#043A24',
  },
  resourceList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  resourceItem: {
    padding: '16px',
    backgroundColor: '#F8F9FA',
    borderRadius: '8px',
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  resourceTitle: {
    color: '#043A24',
    fontSize: '18px',
    marginBottom: '8px',
    fontWeight: '500',
  },
  resourceDescription: {
    color: '#666',
    margin: 0,
    lineHeight: '1.5',
  },
};

export default Resources; 