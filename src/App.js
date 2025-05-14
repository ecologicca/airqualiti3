// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Auth Pages
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPassword';
import AuthCallback from './pages/auth/callback';

// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile';
import Resources from './pages/Resources';
import FAQ from './pages/FAQ';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import WelcomePage from './pages/WelcomePage';
import ThankYou from './pages/ThankYou';

// Layout
import Layout from './components/layout/Layout';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/auth/login'} />} />
        <Route path="/auth/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/signup" element={!user ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/thank-you" element={<ThankYou />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/auth/login" />} />
        <Route path="/profile" element={user ? <Layout><Profile /></Layout> : <Navigate to="/auth/login" />} />
        <Route path="/resources" element={user ? <Layout><Resources /></Layout> : <Navigate to="/auth/login" />} />
        <Route path="/faq" element={user ? <Layout><FAQ /></Layout> : <Navigate to="/auth/login" />} />
        <Route path="/insights" element={user ? <Layout><Insights /></Layout> : <Navigate to="/auth/login" />} />
        <Route path="/settings" element={user ? <Layout><Settings /></Layout> : <Navigate to="/auth/login" />} />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;