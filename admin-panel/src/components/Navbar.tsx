"use client";
import React from 'react';
import { Form, Dropdown, Image } from 'react-bootstrap';
import { FaSearch, FaUser } from 'react-icons/fa';

const Navbar = () => {
    return (
        <div className="top-navbar d-flex justify-content-between align-items-center">


            <div className="user-profile d-flex align-items-center gap-3">
                <div className="language-selector text-muted small cursor-pointer">
                    EN
                </div>
                <Dropdown align="end">
                    <Dropdown.Toggle variant="transparent" className="p-0 border-0 text-white d-flex align-items-center gap-2 after-none" id="dropdown-profile">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                            <FaUser className="small" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>Admin</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Super Admin</div>
                        </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu variant="dark">
                        <Dropdown.Item href="/profile">My Profile</Dropdown.Item>
                        <Dropdown.Item href="/settings">Settings</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item href="/logout" className="text-danger">Logout</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
};

export default Navbar;
