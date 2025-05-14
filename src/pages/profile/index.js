import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaUser, FaHeartbeat } from 'react-icons/fa';
import '../../styles/style.css';

const Profile = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    age: '',
    gender: '',
    location: '',
    joined: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    anxiety_base_level: '5',
    activity_level: '5',
    sleep_level: '3'
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

  const sleepLevels = ['1', '2', '3', '4', '5'];

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
          anxiety_base_level: existingPrefs.anxiety_base_level?.toString() || '5',
          activity_level: existingPrefs.activity_level?.toString() || '5',
          sleep_level: existingPrefs.sleep_level?.toString() || '3'
        }));
      } else {
        // Create default preferences
        const defaultPrefs = {
          user_id: user.id,
          first_name: '',
          last_name: '',
          city: '',
          anxiety_base_level: 5,
          activity_level: 5,
          sleep_level: 3,
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
          sleep_level: defaultPrefs.sleep_level.toString()
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
      
      <div className="profile-section">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
          <div style={{
            background: '#D9F6BB',
            borderRadius: '50%',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaUser size={48} color="#043A24" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1 style={{ color: '#043A24', margin: 0 }}>Personal Information</h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  background: '#D9F6BB',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '2rem',
                  color: '#043A24',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="profile-info">
              <div className="info-row">
                <div className="info-label">Full Name</div>
                {isEditing ? (
                  <div className="info-edit">
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="First Name"
                    />
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Last Name"
                    />
                  </div>
                ) : (
                  <div className="info-value">
                    {formData.first_name || formData.last_name ? 
                      `${formData.first_name} ${formData.last_name}`.trim() : 
                      'Not set'}
                  </div>
                )}
              </div>

              <div className="info-row">
                <div className="info-label">Email</div>
                <div className="info-value">{formData.email}</div>
              </div>

              <div className="info-row">
                <div className="info-label">Location</div>
                {isEditing ? (
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="info-select"
                  >
                    <option value="">Select a city</option>
                    {locations.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                ) : (
                  <div className="info-value">{formData.location || 'Not set'}</div>
                )}
              </div>

              <div className="info-row">
                <div className="info-label">Joined</div>
                <div className="info-value">{formData.joined}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
          <div style={{
            background: '#D9F6BB',
            borderRadius: '50%',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaHeartbeat size={48} color="#043A24" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1 style={{ color: '#043A24', margin: 0 }}>Health Profile</h1>
              {isEditing && (
                <button
                  onClick={handleSave}
                  style={{
                    background: '#D9F6BB',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '2rem',
                    color: '#043A24',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              )}
            </div>

            <div className="profile-info">
              <div className="info-row">
                <div className="info-label">Anxiety Base Level</div>
                {isEditing ? (
                  <input
                    type="range"
                    name="anxiety_base_level"
                    min="1"
                    max="10"
                    value={formData.anxiety_base_level}
                    onChange={handleChange}
                    className="slider"
                  />
                ) : (
                  <div className="info-value">{formData.anxiety_base_level}</div>
                )}
              </div>

              <div className="info-row">
                <div className="info-label">Activity Level</div>
                {isEditing ? (
                  <input
                    type="range"
                    name="activity_level"
                    min="1"
                    max="10"
                    value={formData.activity_level}
                    onChange={handleChange}
                    className="slider"
                  />
                ) : (
                  <div className="info-value">{formData.activity_level}</div>
                )}
              </div>

              <div className="info-row">
                <div className="info-label">Sleep Level</div>
                {isEditing ? (
                  <select
                    name="sleep_level"
                    value={formData.sleep_level}
                    onChange={handleChange}
                    className="info-select"
                  >
                    {sleepLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                ) : (
                  <div className="info-value">{formData.sleep_level}</div>
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