import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import WeeklyAnxietyChart from '../../components/charts/WeeklyAnxietyChart';
import MonthlyAnxietyChart from '../../components/charts/MonthlyAnxietyChart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AnxietyDashboard = () => {
  const [userPreferences, setUserPreferences] = useState({
    hasHVAC: false,
    hasEcologica: false,
    city: 'Toronto',
    firstName: '',
    anxietyLevel: 5
  });
  const [airQualityData, setAirQualityData] = useState([]);
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
            hasEcologica: data.has_ecologgica || false,
            city: data.city || 'Toronto',
            firstName: data.first_name || '',
            anxietyLevel: data.anxiety_base_level || 5
          });
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAirQualityData = async () => {
      try {
        // Get last 30 days of data to cover both weekly and monthly calculations
        const { data, error } = await supabase
          .from('weather_data')
          .select('*')
          .eq('city', userPreferences.city)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;

        const transformedData = data.map(item => ({
          date: item.created_at,
          pm25: item.pm25,
          city: item.city
        }));
        
        setAirQualityData(transformedData);
      } catch (error) {
        console.error('Error fetching air quality data:', error);
        setAirQualityData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPreferences();
    if (userPreferences.city) {
      fetchAirQualityData();
    }

    const interval = setInterval(() => {
      if (userPreferences.city) {
        fetchAirQualityData();
      }
    }, 60 * 60 * 1000); // Refresh every hour

    return () => clearInterval(interval);
  }, [userPreferences.city]);

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
          <h2>Weekly Anxiety Risk</h2>
          <WeeklyAnxietyChart userPreferences={userPreferences} />
        </div>

        <div className="dashboard-section">
          <h2>Monthly Anxiety Risk</h2>
          <MonthlyAnxietyChart userPreferences={userPreferences} />
        </div>
      </div>
    </div>
  );
};

export default AnxietyDashboard; 