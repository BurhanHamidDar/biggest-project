"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import {
    FaTachometerAlt, FaChalkboardTeacher, FaUserGraduate,
    FaBook, FaClipboardList, FaBullhorn, FaCalendarAlt,
    FaStickyNote, FaMarker, FaBus, FaCog, FaSignOutAlt
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';

const Sidebar = () => {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Dashboard', path: '/', icon: <FaTachometerAlt /> },
        { name: 'Teachers', path: '/teachers', icon: <FaChalkboardTeacher /> },
        { name: 'Students', path: '/students', icon: <FaUserGraduate /> },
        { name: 'Classes', path: '/classes', icon: <FaBook /> },
        { name: 'Subjects', path: '/subjects', icon: <FaBook /> },
        { name: 'Attendance', path: '/attendance', icon: <FaClipboardList /> },
        { name: 'Timetable', path: '/timetable', icon: <FaCalendarAlt /> },
        { name: 'Notice Board', path: '/notices', icon: <FaBullhorn /> },
        { name: 'Syllabus', path: '/syllabus', icon: <FaStickyNote /> },
        { name: 'Exams & Results', path: '/exams', icon: <FaMarker /> },
        { name: 'Transport', path: '/transport', icon: <FaBus /> },
        { name: 'Settings', path: '/settings', icon: <FaCog /> },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login'; // Force reload to clear any state
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>School Admin</h3>
            </div>
            <Nav className="flex-column">
                {menuItems.map((item, index) => (
                    <Nav.Link
                        key={index}
                        as={Link}
                        href={item.path}
                        active={pathname === item.path}
                        className="d-flex align-items-center mb-2 text-white-50 hover-text-white"
                    >
                        {item.icon}
                        <span className="ms-2">{item.name}</span>
                    </Nav.Link>
                ))}
                <div className="mt-auto">
                    <Nav.Link className="text-danger pointer" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                        <FaSignOutAlt /> <span className="ms-2">Logout</span>
                    </Nav.Link>
                </div>
            </Nav>
        </div>
    );
};

export default Sidebar;
