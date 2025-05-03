import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error during auth callback:', error.message);
        navigate('/login');
        return;
      }

      if (session) {
        // Check if user has completed questionnaire
        const { data: userPreferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!userPreferences) {
          navigate('/questionnaire');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="auth-callback-container">
      <p>Completing authentication, please wait...</p>
    </div>
  );
};

export default AuthCallback; 