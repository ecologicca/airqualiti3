import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import RiskChart from '../components/charts/RiskChart';
import '../styles/Insights.css'
import AnxietyRiskChart from '../components/charts/AnxietyRiskChart';

const Insights = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const age = calculateAge(data.birthdate);
      console.log('User birthdate:', data.birthdate);
      console.log('Calculated age:', age);

      setUserProfile({
        ...data,
        age: age
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return 0;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) return <div>Loading insights...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userProfile) return <div>Please complete your profile to view insights</div>;

  return (
    <div className="insights-container" style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>Personal Health Insights</h1>
      
      <div className="insight-card" style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div className="insight-header" style={{
          marginBottom: '20px'
        }}>
          <h2>Anxiety Risk Analysis</h2>
          <p>Track how air quality affects your anxiety risk over different time periods</p>
        </div>
        <AnxietyRiskChart userPreferences={userProfile} />
      </div>
    </div>
  );
};

export default Insights; 