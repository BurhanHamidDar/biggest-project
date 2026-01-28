"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Spinner } from 'react-bootstrap';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (pathname === '/login') {
                // If on login page, just stop loading and show content
                setLoading(false);
                if (session) {
                    router.push('/'); // Already logged in? Go to dashboard
                }
                return;
            }

            if (!session) {
                // Not logged in and not on login page
                router.replace('/login');
            } else {
                // Verify Role for Session Persistence
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
                    await supabase.auth.signOut();
                    router.replace('/login');
                    return;
                }

                setAuthenticated(true);
            }
            setLoading(false);
        };

        checkAuth();
    }, [pathname, router]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white">
                <Spinner animation="border" />
            </div>
        );
    }

    if (pathname === '/login') {
        return <>{children}</>;
    }

    if (!authenticated) {
        return null; // Don't render anything while redirecting
    }

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="main-wrapper flex-grow-1">
                <Navbar />
                <div className="content-container">
                    {children}
                </div>
            </div>
        </div>
    );
}
