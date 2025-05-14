// MainRouter.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Layout from './components/layout/Layout';
import Login from './pages/login';
import SignUp from './pages/signUp';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile';
import ResetPassword from './pages/ResetPassword';

const MainRouter = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        setLoading(true);
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

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  // Render auth pages without layout
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  // Render app pages with layout
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default MainRouter;