import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles.css';

const Questionnaire = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [hasEcologgica, setHasEcologgica] = useState(false);
  const [anxietyLevel, setAnxietyLevel] = useState(3);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      setError("Session expired. Please sign up again.");
      navigate('/Signup');
      return;
    }

    try {
      const preferences = {
        user_id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birthdate: birthDate,
        city: city,
        has_ecologgica: hasEcologgica,
        anxiety_base_level: anxietyLevel,
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
    <div className="questionnaire-container">
      <div className="container form-container">
        <h2>Complete Your Profile</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Birth Date</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Select City</label>
            <select 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
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

          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label>
              Typical Level of Anxiety
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginTop: '10px' 
              }}>
                <span style={{ minWidth: '30px' }}>1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={anxietyLevel}
                  onChange={(e) => setAnxietyLevel(Number(e.target.value))}
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    accentColor: '#123522'
                  }}
                />
                <span style={{ minWidth: '30px' }}>10</span>
              </div>
              <div style={{ 
                textAlign: 'center', 
                fontSize: '0.9rem', 
                color: '#666',
                marginTop: '5px' 
              }}>
                Current: {anxietyLevel} (1 = Low, 10 = High)
              </div>
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={hasEcologgica}
                onChange={(e) => setHasEcologgica(e.target.checked)}
              />
              Do you have an Ecologgica product?
            </label>
          </div>

          <button 
            type="submit"
            style={{
              backgroundColor: '#123522',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default Questionnaire;
