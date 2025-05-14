import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaUser, FaHeartbeat } from 'react-icons/fa';
import '../../styles/style.css';

const Profile = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: 'casey.reid@hotmail.com',
    age: '34',
    gender: 'Female',
    location: 'San Francisco, CA',
    joined: 'March 14, 2024',
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData(prev => ({
          ...prev,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          location: locations.includes(data.city) ? data.city : 'San Francisco, CA',
          anxiety_base_level: data.anxiety_base_level?.toString() || '5',
          activity_level: data.activity_level?.toString() || '5',
          sleep_level: data.sleep_level?.toString() || '3'
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      // First check if the user already has a profile
      const { data: existingProfile } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const profileData = {
        user_id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        city: formData.location,
        anxiety_base_level: parseInt(formData.anxiety_base_level),
        activity_level: parseInt(formData.activity_level),
        sleep_level: parseInt(formData.sleep_level)
      };

      let error;
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update(profileData)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert(profileData);
        error = insertError;
      }

      if (error) throw error;

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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile-container" style={{ padding: '2rem' }}>
      {successMessage && (
        <div style={{
          background: '#D9F6BB',
          color: '#043A24',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {successMessage}
        </div>
      )}
      {error && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto 2rem auto',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
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
                onClick={async () => {
                  if (isEditing) {
                    await handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
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
                {isEditing ? 'Save Profile' : 'Edit Profile'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <label style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                <div style={{ color: '#043A24', fontSize: '1.2rem', fontWeight: '500' }}>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        fontSize: '1.2rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    `${formData.first_name} ${formData.last_name}`
                  )}
                </div>
              </div>

              <div>
                <label style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <div style={{ color: '#043A24', fontSize: '1.2rem' }}>{formData.email}</div>
              </div>

              <div>
                <label style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>Age</label>
                <div style={{ color: '#043A24', fontSize: '1.2rem' }}>{formData.age}</div>
              </div>

              <div>
                <label style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>Gender</label>
                <div style={{ color: '#043A24', fontSize: '1.2rem' }}>{formData.gender}</div>
              </div>

              <div>
                <label style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>Location</label>
                <div style={{ color: '#043A24', fontSize: '1.2rem' }}>
                  {isEditing ? (
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        fontSize: '1.2rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        background: 'white'
                      }}
                    >
                      {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  ) : (
                    formData.location
                  )}
                </div>
              </div>

              <div>
                <label style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>Joined</label>
                <div style={{ color: '#043A24', fontSize: '1.2rem' }}>{formData.joined}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
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
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <label style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                  Anxiety Base Level: {formData.anxiety_base_level}
                </label>
                <div style={{ 
                  background: '#f0f0f0', 
                  borderRadius: '8px',
                  padding: '4px',
                  position: 'relative',
                  height: '24px'
                }}>
                  <input
                    type="range"
                    name="anxiety_base_level"
                    min="1"
                    max="10"
                    value={formData.anxiety_base_level}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      appearance: 'none',
                      background: '#D9F6BB',
                      height: '16px',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                  Activity Level: {formData.activity_level}
                </label>
                <div style={{ 
                  background: '#f0f0f0', 
                  borderRadius: '8px',
                  padding: '4px',
                  position: 'relative',
                  height: '24px'
                }}>
                  <input
                    type="range"
                    name="activity_level"
                    min="1"
                    max="10"
                    value={formData.activity_level}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      appearance: 'none',
                      background: '#D9F6BB',
                      height: '16px',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>Sleep Level</label>
                <select
                  name="sleep_level"
                  value={formData.sleep_level}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    background: 'white'
                  }}
                >
                  {sleepLevels.map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 