// MainRouter.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/login';
import SignUp from './pages/signUp';
import Dashboard from './pages/dashboard/Dashboard';
import ThankYou from './ThankYou';
import WelcomePage from './pages/WelcomePage';
import Questionnaire from './Questionnaire';
import Profile from './pages/profile';
import ResetPassword from './pages/ResetPassword';

const MainRouter = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        setLoading(true);
        // Get the current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Session found, user is logged in");
          setUser(session.user);
        } else {
          console.log("No active session found");
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="main-layout">
          {user && <Sidebar />}
          <div className="main-content">
            <Routes>
              <Route path="/Login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default MainRouter;