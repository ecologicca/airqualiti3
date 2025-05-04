import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://app.ecologicca.com/auth/callback'
        }
      });

      if (error) throw error;

      // Show confirmation email sent message
      if (data.user) {
        setConfirmationSent(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="login-container">
        <div className="container form-container">
          <h2>Check Your Email</h2>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>We've sent a confirmation email to:</p>
            <p style={{ 
              fontWeight: 'bold', 
              color: '#123522',
              margin: '15px 0' 
            }}>{email}</p>
            <p>Click the link in the email to verify your account and continue setting up your profile.</p>
            <button 
              onClick={() => navigate('/login')} 
              style={{
                ...styles.button,
                marginTop: '20px',
                width: '100%'
              }}
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="container form-container">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignUp}>
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button 
              type="button" 
              className="text-button"
              onClick={() => navigate('/login')}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
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
    width: '100%',
  },
};

export default SignUp;
