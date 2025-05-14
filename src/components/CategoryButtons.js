import React from 'react';
import { FaHeart, FaLungs, FaBrain, FaChild } from 'react-icons/fa';

const CategoryButton = ({ icon, label, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`category-button ${isSelected ? 'selected' : ''}`}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '24px',
      background: 'white',
      border: isSelected ? '2px solid #043A24' : '1px solid #e0e0e0',
      borderRadius: '12px',
      cursor: 'pointer',
      width: '100%',
      minWidth: '200px'
    }}
  >
    <div style={{ fontSize: '24px', color: '#043A24' }}>{icon}</div>
    <div style={{ color: '#043A24', fontWeight: isSelected ? '600' : '400' }}>
      {label}
    </div>
  </button>
);

const CategoryButtons = ({ selectedCategory, onCategoryChange }) => {
  const categories = [
    { id: 'heart', label: 'Heart', icon: <FaHeart /> },
    { id: 'lungs', label: 'Lungs', icon: <FaLungs /> },
    { id: 'brain', label: 'Brain', icon: <FaBrain /> },
    { id: 'body', label: 'Body', icon: <FaChild /> }
  ];

  return (
    <div className="category-buttons" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '2rem',
      padding: '2rem',
      background: 'white',
      borderRadius: '12px',
      marginBottom: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {categories.map(category => (
        <CategoryButton
          key={category.id}
          icon={category.icon}
          label={category.label}
          isSelected={selectedCategory === category.id}
          onClick={() => onCategoryChange(category.id)}
        />
      ))}
    </div>
  );
};

export default CategoryButtons; 