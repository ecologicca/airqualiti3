import React from 'react';
import TopNavbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children, city, onCityChange }) => {
    return (
        <div className="layout">
            <TopNavbar city={city} onCityChange={onCityChange} />
            <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout; 