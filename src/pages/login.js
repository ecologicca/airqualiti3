import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: true
        }
      });

      if (error) throw error;

      const userId = data.user.id;

      localStorage.setItem('supabase.auth.token', data.session.access_token);

      const { data: userPreferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!userPreferences) {
        navigate('/questionnaire');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetEmailSent(true);
      setError(null);
    }
  };

  return (
    <div className="login-container">
      <div className="container form-container">
        <h2>Login</h2>
        {resetEmailSent ? (
          <div className="success-message">
            Password reset instructions have been sent to your email.
            Please check your inbox and follow the link to reset your password.
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error">{error}</p>}
            <button 
              type="submit" 
              disabled={loading}
              style={styles.button}
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <button 
                type="button" 
                className="text-button"
                onClick={() => navigate('/reset-password')}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}
        <button className="signup-button" onClick={() => navigate('/signup')}>
          Sign Up
        </button>
      </div>
    </div>
  );
};

const styles = {
  button: {
    padding: '0.75rem',
    backgroundColor: '#123522',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    ':hover': {
      backgroundColor: '#1a4d33',
    },
  },
};

export default Login;
