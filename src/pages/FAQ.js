import React from 'react';
import { FaBook, FaVideo, FaNewspaper, FaQuestionCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const faqs = [
    {
      question: "What is air pollution and where does it come from?",
      answer: "Air pollution refers to how clean or dirty air is, based on the number of contaminants that are present at any given time. Pollution is caused by a number of factors such as wildfires, transportation, construction, agricultures, and a number of other things."
    },
    {
      question: "What is the Air Quality Index (AQI)?",
      answer: "The Air Quality Index, often referred to as AQI, is a standardized measurement of air quality indicating from 0 (great/green) to 500 (hazardous/burgundy) how dangerous air quality is outdoors. This index usually measures a range of pollutants like PM2.5 and PM10, ozone, carbon monoxide and a few other things."
    },
    {
      question: "How can I check the air quality where I live?",
      answer: "If you have access to a smartphone, most of the weather apps that are available will show at least a high level snapshot of real-time outdoor air quality in your city. Many governments across the world also have websites that can inform you of what the air quality is in your region."
    },
    {
      question: "What is PM2.5 and why is it important?",
      answer: "Anytime you see PM followed by a number, that is referring to particulate matter and then its size in micrometers. The smaller the number, generally the more dangerous it is to human health. Particles as small as PM2.5 can embed themselves deeply into your lungs, and even make their way into your bloodstream. PM10 and PM2.5 are some of the more common particles that are found in poor air quality and therefore are measured for most often."
    },
    {
      question: "How does air quality impact my health?",
      answer: "Air quality impacts almost every aspect of your health in some way. Of course, most people equate respiratory health conditions like asthma most often with air quality. However, it can impact things like mental health, neurodegenerative disorders, and cardiovascular health too as it is closely tied to inflammation in the body."
    },
    {
      question: "Should I care more about indoor or outdoor air quality?",
      answer: "Both! There is certainly nuance to this answer depending on where you are located in the world, however, indoor air quality does not always mean better. In fact, studies have shown that indoor air can be 2-5x worse than outdoor air because of things like a lack of airflow, increased carbon dioxide, and volatile organic compounds (VOC)."
    }
  ];

  return (
    <div className="faq-container" style={styles.container}>
      {/* Resource Links */}
      <div style={styles.resourceLinks}>
        <Link to="/resources" style={styles.resourceLink}>
          <FaBook style={styles.icon} /> Educational Materials
        </Link>
        <Link to="/resources" style={styles.resourceLink}>
          <FaVideo style={styles.icon} /> Video Tutorials
        </Link>
        <Link to="/resources" style={styles.resourceLink}>
          <FaNewspaper style={styles.icon} /> Latest Updates
        </Link>
      </div>

      {/* FAQ Section */}
      <div style={styles.faqSection}>
        <h1 style={styles.title}>
          <FaQuestionCircle style={styles.titleIcon} /> Frequently Asked Questions
        </h1>
        <div style={styles.faqList}>
          {faqs.map((faq, index) => (
            <div key={index} style={styles.faqItem}>
              <h3 style={styles.question}>{faq.question}</h3>
              <p style={styles.answer}>{faq.answer}</p>
            </div>
          ))}
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
  resourceLinks: {
    display: 'flex',
    gap: '20px',
    marginBottom: '40px',
    flexWrap: 'wrap',
  },
  resourceLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: '#F8F9FA',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#043A24',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  },
  icon: {
    fontSize: '18px',
  },
  titleIcon: {
    fontSize: '28px',
    marginRight: '12px',
  },
  faqSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 4px rgba(4, 58, 36, 0.1)',
  },
  title: {
    color: '#043A24',
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '32px',
    display: 'flex',
    alignItems: 'center',
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  faqItem: {
    padding: '20px',
    backgroundColor: '#F8F9FA',
    borderRadius: '8px',
  },
  question: {
    color: '#043A24',
    fontSize: '18px',
    marginBottom: '12px',
    fontWeight: '500',
  },
  answer: {
    color: '#666',
    lineHeight: '1.6',
    margin: 0,
  },
};

export default FAQ; 