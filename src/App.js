// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/dashboard/Dashboard';
import AnxietyDashboard from './pages/dashboard/AnxietyDashboard';
import UserPreferences from './pages/UserPreferences';
import Login from './pages/login';
import SignUp from './pages/signUp';
import Questionnaire from './pages/Questionnaire';
import ResetPassword from './pages/ResetPassword';
import SplashPage from './pages/SplashPage';
import Insights from './pages/Insights';
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import './styles/style.css';

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check session if we have beta access
    if (localStorage.getItem('betaAccess') === 'true') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check for beta access first
  const hasBetaAccess = localStorage.getItem('betaAccess') === 'true';

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Show splash page if no beta access */}
          <Route
            path="/"
            element={
              hasBetaAccess ? (
                <Navigate to={session ? '/dashboard' : '/login'} />
              ) : (
                <SplashPage />
              )
            }
          />
          
          {/* Public routes (only accessible with beta access) */}
          {hasBetaAccess && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </>
          )}

          {/* Protected routes (require both beta access and session) */}
          {hasBetaAccess && session ? (
            <>
              <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/insights" element={<Layout><Insights /></Layout>} />
              <Route path="/resources" element={<Layout><Resources /></Layout>} />
              <Route path="/settings" element={<Layout><Settings /></Layout>} />
              <Route path="/preferences" element={<Layout><UserPreferences /></Layout>} />
              <Route path="/questionnaire" element={<Layout><Questionnaire /></Layout>} />
              <Route path="/anxietydashboard" element={<Layout><AnxietyDashboard /></Layout>} />
            </>
          ) : (
            // Redirect to login or splash page depending on beta access
            <Route 
              path="*" 
              element={<Navigate to={hasBetaAccess ? '/login' : '/'} />} 
            />
          )}
        </Routes>
      </div>
    </Router>
  );
};

// Layout component to avoid repetition
const Layout = ({ children }) => (
  <>
    <Navbar />
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  </>
);

export default App;