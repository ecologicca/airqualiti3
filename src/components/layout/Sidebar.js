import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();

    return (
        <div className="sidebar">
            <div className="nav-content">
                <Link 
                    to="/dashboard" 
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                    Dashboard
                </Link>
                <Link 
                    to="/anxietydashboard" 
                    className={`nav-link ${location.pathname === '/anxietydashboard' ? 'active' : ''}`}
                >
                    Anxiety Dashboard
                </Link>
                <Link 
                    to="/preferences" 
                    className={`nav-link ${location.pathname === '/preferences' ? 'active' : ''}`}
                >
                    Preferences
                </Link>
            </div>
        </div>
    );
};

const styles = {
    sidebar: {
        backgroundColor: '#dff5c1',
        height: '100%',
        padding: '20px 0',
    },
    link: {
        color: '#123522',
        transition: 'all 0.3s ease',
        padding: '10px 20px',
    }
};

// Add this CSS to your global styles or create a new CSS file
const cssToAdd = `
.active-link {
    background-color: #123522 !important;
    color: #dff5c1 !important;
}

.nav-link:hover {
    background-color: #123522 !important;
    color: #dff5c1 !important;
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = cssToAdd;
document.head.appendChild(styleSheet);

export default Sidebar; 