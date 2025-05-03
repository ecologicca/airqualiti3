import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../icons/logo.png';

const SplashPage = () => {
  const [betaCode, setBetaCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const VALID_BETA_CODE = 'BREATHE-ACCESS-5016';

  const verifyBetaCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simple direct comparison with the valid beta code
      if (betaCode.trim() === VALID_BETA_CODE) {
        // Store the beta access in local storage
        localStorage.setItem('betaAccess', 'true');
        
        // Navigate to login page
        navigate('/login');
      } else {
        setError('Invalid beta code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Beta code verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="splash-container">
      <div className="splash-content">
        <img src={logo} alt="AirQualiti" className="splash-logo" />
        <h1>Welcome to AirQualiti Beta</h1>
        <p>Enter your beta invite code to access the application</p>
        
        <form onSubmit={verifyBetaCode} className="beta-code-form">
          <input
            type="text"
            value={betaCode}
            onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
            placeholder="Enter your beta code"
            className="beta-code-input"
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading} className="beta-submit-button">
            {loading ? 'Verifying...' : 'Enter App'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SplashPage; 