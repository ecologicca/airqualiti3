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
          // If no preferences exist, redirect to questionnaire with user data
          navigate('/questionnaire', { 
            state: { user: session.user },
            replace: true 
          });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="auth-callback-container">
      <p>Verifying your email, please wait...</p>
    </div>
  );
};

export default AuthCallback; 