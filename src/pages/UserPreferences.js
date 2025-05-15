import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../styles/style.css';

const UserPreferences = () => {
  const [preferences, setPreferences] = useState({
    first_name: '',
    last_name: '',
    birthdate: null,
    city: '',
    has_HVAC: false,
    has_ecologicca: false,
    anxiety_base_level: 5,
    activity_level: 5,
    sleep_level: 5,
    track_anxiety: false,
    has_pets: false,
    allergies: [],
    health_issues: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPreferences();
  }, []);

    const fetchPreferences = async () => {
      try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
        if (!user) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
        // Convert any null values to defaults
        setPreferences({
          ...preferences,
          ...data,
          anxiety_base_level: data.anxiety_base_level || 5,
          activity_level: data.activity_level || 5,
          sleep_level: data.sleep_level || 5
        });
        }
      } catch (error) {
      console.error('Error fetching preferences:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;

      if (!user) {
        alert('Please log in to save preferences');
        navigate('/login');
        return;
      }

      // Prepare the data for saving
      const dataToSave = {
        ...preferences,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_preferences')
        .upsert(dataToSave, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      alert('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error.message);
      alert('Error updating profile: ' + error.message);
    }
  };

  if (isLoading) {
    return <div className="preferences-container"><div className="preferences-content">Loading...</div></div>;
  }

  return (
    <div className="preferences-container">
      <div className="preferences-content">
        <h1 className="preferences-title">Profile</h1>
        
        <form onSubmit={handleSave} className="preferences-form">
          <div className="form-row">
          <div className="form-group">
              <label>First Name</label>
            <input
              type="text"
              value={preferences.first_name}
                onChange={(e) => setPreferences({ ...preferences, first_name: e.target.value })}
                className="form-input"
                placeholder="Enter first name"
            />
          </div>

          <div className="form-group">
              <label>Birthdate</label>
              <input
                type="date"
                value={preferences.birthdate || ''}
                onChange={(e) => setPreferences({ ...preferences, birthdate: e.target.value })}
                className="form-input"
            />
          </div>
          </div>

          <div className="form-row">
          <div className="form-group">
              <label>City</label>
            <select
              value={preferences.city}
                onChange={(e) => setPreferences({ ...preferences, city: e.target.value })}
                className="form-select"
              >
                <option value="">Select a city</option>
                <option value="Miami">Miami</option>
                <option value="San Francisco">San Francisco</option>
                <option value="Calgary">Calgary</option>
                <option value="Edmonton">Edmonton</option>
                <option value="Houston">Houston</option>
                <option value="Boston">Boston</option>
                <option value="New York">New York</option>
                <option value="Toronto">Toronto</option>
            </select>
            </div>
          </div>

          <div className="form-row">
          <div className="form-group">
              <label>Anxiety Base Level: {preferences.anxiety_base_level}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={preferences.anxiety_base_level}
              onChange={(e) => setPreferences({ ...preferences, anxiety_base_level: parseInt(e.target.value) })}
              className="form-slider"
            />
          </div>

          <div className="form-group">
              <label>Activity Level: {preferences.activity_level}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={preferences.activity_level}
                onChange={(e) => setPreferences({ ...preferences, activity_level: parseInt(e.target.value) })}
                className="form-slider"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sleep Level: {preferences.sleep_level}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={preferences.sleep_level}
                onChange={(e) => setPreferences({ ...preferences, sleep_level: parseInt(e.target.value) })}
                className="form-slider"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.has_HVAC}
                onChange={(e) => setPreferences({ ...preferences, has_HVAC: e.target.checked })}
              />
              I have an HVAC system
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.has_ecologicca}
                onChange={(e) => setPreferences({ ...preferences, has_ecologicca: e.target.checked })}
              />
              I have a Blue Air purifier
            </label>
          </div>

          <button type="submit" className="save-button">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserPreferences;
