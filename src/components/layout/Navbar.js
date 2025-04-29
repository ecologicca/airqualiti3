import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import logo from '../../icons/logo.png';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Close the dropdown
      setDropdownOpen(false);
      
      // Clear any local storage or session data if needed
      localStorage.removeItem('userPreferences');
      
      // Navigate to login page
      navigate('/login', { replace: true }); // Using replace to prevent going back
    } catch (error) {
      console.error('Logout failed:', error.message);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <nav style={styles.navbar}>
      <h1 style={styles.logo}>
        <img src={logo} alt="Logo" style={{ width: '180px', height: '40px' }} />
      </h1>

      {/* Hamburger Menu */}
      <div style={styles.dropdown}>
        <div onClick={toggleDropdown} style={styles.dropdownTrigger}>
          <div style={styles.hamburger}>
            <div style={styles.hamburgerLine}></div>
            <div style={styles.hamburgerLine}></div>
            <div style={styles.hamburgerLine}></div>
          </div>
        </div>

        {/* Dropdown Content */}
        {dropdownOpen && (
          <div style={styles.dropdownContent}>
            <p onClick={handleLogout} style={styles.dropdownItem}>Logout</p>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#dff5c1',
    color: '#123522',
  },
  logo: {
    fontSize: '24px',
  },
  dropdown: {
    position: 'relative',
    display: 'inline-block',
  },
  dropdownTrigger: {
    cursor: 'pointer',
    padding: '5px',
  },
  dropdownContent: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '5px',
    overflow: 'hidden',
    zIndex: 1,
  },
  dropdownItem: {
    padding: '10px 20px',
    cursor: 'pointer',
    color: '#333',
    margin: 0,
  },
  hamburger: {
    width: '20px',
    height: '15px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: '2px',
    backgroundColor: '#123522',
    transition: 'all 0.3s ease',
  },
};

export default Navbar; 