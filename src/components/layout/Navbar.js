import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import logo from '../../icons/logo.png';
import { FaMoon, FaBell, FaUserCircle } from 'react-icons/fa';

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
    <nav className="top-navbar">
      <div className="navbar-logo">
        <img src={logo} alt="Ecologicca" />
      </div>

      <div className="navbar-right">
        <button className="navbar-icon-button">
          <FaMoon />
        </button>
        <button className="navbar-icon-button">
          <FaBell />
        </button>
        <div className="navbar-user">
          <button className="navbar-user-button" onClick={toggleDropdown}>
            <FaUserCircle />
          </button>
          {dropdownOpen && (
            <div className="navbar-dropdown">
              <button className="navbar-dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 