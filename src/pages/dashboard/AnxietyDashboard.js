import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AnxietyRiskChart from '../../components/charts/AnxietyRiskChart';

const AnxietyDashboard = () => {
  const [userPreferences, setUserPreferences] = useState({
    hasHVAC: false,
    hasBlueair: false,
    city: 'Toronto',
    firstName: '',
    anxietyLevel: 5
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setUserPreferences({
            hasHVAC: data.has_HVAC || false,
            hasBlueair: data.has_ecologgica || false,
            city: data.city || 'Toronto',
            firstName: data.first_name || '',
            anxietyLevel: data.anxiety_base_level || 5,
            birthdate: data.birthdate
          });
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPreferences();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>
        {userPreferences.firstName ? `${userPreferences.firstName}'s ` : ''}
        Anxiety Risk Dashboard
      </h1>
      
      <div style={{
        marginBottom: '20px',
        fontSize: '1.1rem',
        color: '#2e7d32',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        Your current base level Anxiety: 
        <a 
          href="/preferences" 
          style={{
            color: '#2e7d32',
            textDecoration: 'underline',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/preferences';
          }}
        >
          {userPreferences.anxietyLevel}
        </a>
      </div>
      
      <div className="dashboard-container">
        <div className="dashboard-section">
          <h2>Anxiety Risk Analysis</h2>
          <AnxietyRiskChart userPreferences={userPreferences} />
        </div>
      </div>
    </div>
  );
};

export default AnxietyDashboard; 