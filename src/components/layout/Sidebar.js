import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaChartBar, FaBook, FaCog } from 'react-icons/fa';

const Sidebar = () => {
    const location = useLocation();

    return (
        <div className="sidebar">
            <div className="nav-content">
                <Link 
                    to="/dashboard" 
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                    <FaHome />
                    Dashboard
                </Link>
                <Link 
                    to="/profile" 
                    className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                >
                    <FaUser />
                    Profile
                </Link>
                <Link 
                    to="/insights" 
                    className={`nav-link ${location.pathname === '/insights' ? 'active' : ''}`}
                >
                    <FaChartBar />
                    Insights
                </Link>
                <Link 
                    to="/resources" 
                    className={`nav-link ${location.pathname === '/resources' ? 'active' : ''}`}
                >
                    <FaBook />
                    Resources
                </Link>
                <Link 
                    to="/settings" 
                    className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
                >
                    <FaCog />
                    Settings
                </Link>
            </div>
            <div className="healthy-tip">
                <h2>Healthy Tip</h2>
                <p>Use carbon monoxide detectors on every floor of your home.</p>
            </div>
        </div>
    );
};

export default Sidebar; 