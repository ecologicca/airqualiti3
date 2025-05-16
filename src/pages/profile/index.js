import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaUser, FaHeartbeat } from 'react-icons/fa';
import '../../styles/style.css';

// Mapping objects for the dropdown values - consistent with UserPreferences
const anxietyLevelOptions = {
  'Low (Calm)': 2,
  'Moderate (Occasional)': 4,
  'High (Frequent)': 6,
  'Very High (Chronic)': 8
};

const activityLevelOptions = {
  'Sedentary (Little activity)': 1,
  'Light (Occasional walks)': 3,
  'Moderate (Regular exercise)': 5,
  'High (Daily active routine)': 7
};

const sleepLevelOptions = {
  'Poor (<4 hrs / fragmented)': 1,
  'Fair (4–6 hrs, light)': 3,
  'Good (6–8 hrs, decent)': 5,
  'Excellent (8+ hrs, deep)': 7
};

// Helper function to get label from value
const getLabelFromValue = (value, optionsMap) => {
  return Object.entries(optionsMap).find(([_, val]) => val === parseInt(value))?.[0] || '';
};

const Profile = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    age: '',
    gender: '',
    location: '',
    joined: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    anxiety_base_level: '4',
    activity_level: '5',
    sleep_level: '5',
    has_ecologgica: false,
    has_HVAC: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const locations = [
    'Toronto',
    'San Francisco',
    'Dallas',
    'New York',
    'Boston',
    'Houston',
    'Miami'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No user found');
        return;
      }

      // Set email from auth
      setFormData(prev => ({
        ...prev,
        email: user.email
      }));

      // First check if user preferences exist
      const { data: existingPrefs, error: checkError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking preferences:', checkError);
        setError('Failed to load profile data');
        return;
      }

      if (existingPrefs) {
        // Update form with existing preferences
        setFormData(prev => ({
          ...prev,
          first_name: existingPrefs.first_name || '',
          last_name: existingPrefs.last_name || '',
          location: locations.includes(existingPrefs.city) ? existingPrefs.city : '',
          anxiety_base_level: existingPrefs.anxiety_base_level?.toString() || '4',
          activity_level: existingPrefs.activity_level?.toString() || '5',
          sleep_level: existingPrefs.sleep_level?.toString() || '5',
          has_ecologgica: existingPrefs.has_ecologgica || false,
          has_HVAC: existingPrefs.has_HVAC || false,
        }));
      } else {
        // Create default preferences
        const defaultPrefs = { 
          user_id: user.id,
          first_name: '',
          last_name: '',
          city: '',
          anxiety_base_level: 4,
          activity_level: 5,
          sleep_level: 5,
          has_ecologgica: false,
          has_HVAC: false,
          created_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert([defaultPrefs]);

        if (insertError) {
          console.error('Error creating default preferences:', insertError);
          setError('Failed to initialize profile');
          return;
        }

        // Set form data with defaults
        setFormData(prev => ({
          ...prev,
          ...defaultPrefs,
          anxiety_base_level: defaultPrefs.anxiety_base_level.toString(),
          activity_level: defaultPrefs.activity_level.toString(),
          sleep_level: defaultPrefs.sleep_level.toString(),
          has_ecologgica: defaultPrefs.has_ecologgica,
          has_HVAC: defaultPrefs.has_HVAC,
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No user found');
        return;
      }

      const profileData = {
        user_id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        city: formData.location,
        anxiety_base_level: parseInt(formData.anxiety_base_level),
        activity_level: parseInt(formData.activity_level),
        sleep_level: parseInt(formData.sleep_level),
        has_ecologgica: !!formData.has_ecologgica,
        has_HVAC: !!formData.has_HVAC,
        updated_at: new Date().toISOString()
      };

      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert(profileData, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

      // Trigger a real-time update for other components
      await supabase
        .channel('custom-all-channel')
        .send({
          type: 'broadcast',
          event: 'city_update',
          payload: { city: formData.location }
        });
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="profile-container">
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      <div className="profile-cards-wrapper">
        {/* Personal Information Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar">
              <FaUser size={48} color="#043A24" />
            </div>
            <h1 className="profile-title">Personal Information</h1>
            <button
              className="profile-edit-btn"
              onClick={() => {
                if (isEditing) handleSave();
                else setIsEditing(true);
              }}
            >
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>
          <div className="profile-info-grid">
            <div className="profile-info-row">
              <div className="profile-info-label">Full Name</div>
              <div className="profile-info-value">
                {isEditing ? (
                  <>
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="form-input"
                    />
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="form-input"
                    />
                  </>
                ) : (
                  formData.first_name || formData.last_name ?
                    `${formData.first_name} ${formData.last_name}`.trim() :
                    'Not set'
                )}
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">Email</div>
              <div className="profile-info-value">{formData.email}</div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">Location</div>
              <div className="profile-info-value">
                {isEditing ? (
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select a city</option>
                    {locations.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                ) : (
                  formData.location || 'Not set'
                )}
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">Joined</div>
              <div className="profile-info-value">{formData.joined}</div>
            </div>
          </div>
        </div>

        {/* Health Profile Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar profile-avatar-health">
              <FaHeartbeat size={48} color="#043A24" />
            </div>
            <h1 className="profile-title">Health Profile</h1>
          </div>
          <div className="profile-info-grid">
            <div className="profile-info-row">
              <div className="profile-info-label">Anxiety Base Level</div>
              <div className="profile-info-value">
                {isEditing ? (
                  <select
                    name="anxiety_base_level"
                    value={getLabelFromValue(formData.anxiety_base_level, anxietyLevelOptions)}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      anxiety_base_level: anxietyLevelOptions[e.target.value].toString()
                    }))}
                    className="form-select"
                  >
                    {Object.entries(anxietyLevelOptions).map(([label, _]) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                ) : (
                  getLabelFromValue(formData.anxiety_base_level, anxietyLevelOptions)
                )}
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">Activity Level</div>
              <div className="profile-info-value">
                {isEditing ? (
                  <select
                    name="activity_level"
                    value={getLabelFromValue(formData.activity_level, activityLevelOptions)}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      activity_level: activityLevelOptions[e.target.value].toString()
                    }))}
                    className="form-select"
                  >
                    {Object.entries(activityLevelOptions).map(([label, _]) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                ) : (
                  getLabelFromValue(formData.activity_level, activityLevelOptions)
                )}
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">Sleep Level</div>
              <div className="profile-info-value">
                {isEditing ? (
                  <select
                    name="sleep_level"
                    value={getLabelFromValue(formData.sleep_level, sleepLevelOptions)}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      sleep_level: sleepLevelOptions[e.target.value].toString()
                    }))}
                    className="form-select"
                  >
                    {Object.entries(sleepLevelOptions).map(([label, _]) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                ) : (
                  getLabelFromValue(formData.sleep_level, sleepLevelOptions)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Device Settings Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h1 className="profile-title">Device Settings</h1>
          </div>
          <div className="profile-info-grid">
            <div className="profile-info-row">
              <div className="profile-info-label">Has an Air Purifier</div>
              <div className="profile-info-value">
                {isEditing ? (
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!!formData.has_ecologgica}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        has_ecologgica: e.target.checked
                      }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                ) : (
                  formData.has_ecologgica ? 'Yes' : 'No'
                )}
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-label">Has an HVAC</div>
              <div className="profile-info-value">
                {isEditing ? (
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!!formData.has_HVAC}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        has_HVAC: e.target.checked
                      }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                ) : (
                  formData.has_HVAC ? 'Yes' : 'No'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 