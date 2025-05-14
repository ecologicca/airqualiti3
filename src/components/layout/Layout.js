import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../../styles/layout.css';

const Layout = ({ children }) => {
    return (
        <div className="app">
            <Navbar />
            <div className="main-layout">
                <Sidebar />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout; 