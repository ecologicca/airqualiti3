import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/style.css';

const Questionnaire = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [hasHVAC, setHasHVAC] = useState(false);
  const [hasAirPurifier, setHasAirPurifier] = useState(false);
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [activityLevel, setActivityLevel] = useState(5);
  const [sleepLevel, setSleepLevel] = useState('moderate');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;

  const sleepQualityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'high', label: 'High' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      setError("Session expired. Please sign up again.");
      navigate('/signup');
      return;
    }

    try {
      const preferences = {
        user_id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birthdate: birthDate,
        city: city,
        has_HVAC: hasHVAC,
        has_ecologgica: hasAirPurifier,
        anxiety_base_level: anxietyLevel,
        activity_level: activityLevel,
        sleep_level: sleepLevel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert(preferences, { 
          onConflict: ['user_id'],
          returning: 'minimal'
        });

      if (upsertError) throw upsertError;

      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error saving preferences:', err.message);
      setError(err.message);
    }
  };

  return (
    <div className="preferences-container">
      <div className="preferences-content">
        <h1 className="preferences-title">Complete Your Profile</h1>
        {error && <p className="error">{error}</p>}
        
        <form onSubmit={handleSubmit} className="preferences-form">
          <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
                className="form-input"
                placeholder="Enter first name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
                className="form-input"
                placeholder="Enter last name"
              required
            />
            </div>
          </div>

          <div className="form-row">
          <div className="form-group">
            <label>Birth Date</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
                className="form-input"
              required
            />
          </div>

          <div className="form-group">
              <label>City</label>
            <select 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
                className="form-select"
              required
            >
              <option value="">Select a city</option>
              <option value="Toronto">Toronto</option>
              <option value="New York">New York</option>
              <option value="San Francisco">San Francisco</option>
              <option value="Dallas">Dallas</option>
              <option value="Boston">Boston</option>
              <option value="Miami">Miami</option>
              <option value="Houston">Houston</option>
            </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Anxiety Base Level: {anxietyLevel}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={anxietyLevel}
                onChange={(e) => setAnxietyLevel(parseInt(e.target.value))}
                className="form-slider"
              />
            </div>

            <div className="form-group">
              <label>Activity Level: {activityLevel}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={activityLevel}
                onChange={(e) => setActivityLevel(parseInt(e.target.value))}
                className="form-slider"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sleep Quality</label>
              <select
                value={sleepLevel}
                onChange={(e) => setSleepLevel(e.target.value)}
                className="form-select"
              >
                {sleepQualityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              </div>
              </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hasHVAC}
                onChange={(e) => setHasHVAC(e.target.checked)}
              />
              I have an HVAC system
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hasAirPurifier}
                onChange={(e) => setHasAirPurifier(e.target.checked)}
              />
              I have an Air Purifier
            </label>
          </div>

          <button type="submit" className="save-button">
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default Questionnaire;
