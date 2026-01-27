'use client';

import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="container-fluid">
            <div className="row">
                {/* Sidebar Column */}
                <div className="col-md-3 col-lg-2 d-md-block bg-dark sidebar collapse" style={{ minHeight: '100vh' }}>
                    <Sidebar />
                </div>

                {/* Main Content Column */}
                <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                    <Navbar />
                    <div className="pt-3">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
