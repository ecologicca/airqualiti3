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
    // Check active sessions when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={
              localStorage.getItem('betaAccess') === 'true' ? (
                <Navigate to={session ? '/dashboard' : '/login'} />
              ) : (
                <SplashPage />
              )
            }
          />
          {localStorage.getItem('betaAccess') === 'true' ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {session ? (
                <>
                  <Route
                    path="/dashboard"
                    element={
                      <>
                        <Navbar />
                        <div className="main-layout">
                          <Sidebar />
                          <div className="main-content">
                            <Dashboard />
                          </div>
                        </div>
                      </>
                    }
                  />
                  <Route
                    path="/insights"
                    element={
                      <>
                        <Navbar />
                        <div className="main-layout">
                          <Sidebar />
                          <div className="main-content">
                            <Insights />
                          </div>
                        </div>
                      </>
                    }
                  />
                  <Route
                    path="/resources"
                    element={
                      <>
                        <Navbar />
                        <div className="main-layout">
                          <Sidebar />
                          <div className="main-content">
                            <Resources />
                          </div>
                        </div>
                      </>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <>
                        <Navbar />
                        <div className="main-layout">
                          <Sidebar />
                          <div className="main-content">
                            <Settings />
                          </div>
                        </div>
                      </>
                    }
                  />
                  <Route
                    path="/preferences"
                    element={
                      <>
                        <Navbar />
                        <div className="main-layout">
                          <Sidebar />
                          <div className="main-content">
                            <UserPreferences />
                          </div>
                        </div>
                      </>
                    }
                  />
                  <Route
                    path="/questionnaire"
                    element={
                      <>
                        <Navbar />
                        <div className="main-layout">
                          <Sidebar />
                          <div className="main-content">
                            <Questionnaire />
                          </div>
                        </div>
                      </>
                    }
                  />
                  <Route
                    path="/anxietydashboard"
                    element={
                      <>
                        <Navbar />
                        <div className="main-layout">
                          <Sidebar />
                          <div className="main-content">
                            <AnxietyDashboard />
                          </div>
                        </div>
                      </>
                    }
                  />
                </>
              ) : (
                <Route path="*" element={<Navigate to="/login" />} />
              )}
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" />} />
          )}
        </Routes>
      </div>
    </Router>
  );
};

export default App;