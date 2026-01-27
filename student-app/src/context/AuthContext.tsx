import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import api, { setupInterceptors } from '../lib/api';

import { useAlert } from './AlertContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface AuthContextType {
    user: any | null;
    profile: any | null;
    studentData: any | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signOut: () => Promise<void>;
    maintenanceMode: { blocked: boolean; message: string; type?: 'maintenance' | 'disabled' } | null;
    checkSystemSettings: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Helper for Push Registration
async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return;
        }

        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ||
            Constants?.easConfig?.projectId;

        try {
            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;
        } catch (e) {
            console.log('Error getting token:', e);
        }
    }

    return token;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [studentData, setStudentData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useAlert();

    const [maintenanceMode, setMaintenanceMode] = useState<{ blocked: boolean; message: string; type?: 'maintenance' | 'disabled' } | null>(null);

    const registerPushToken = async () => {
        try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    await api.post('/notifications/register', {
                        token,
                        device_name: Device.manufacturer ? `${Device.manufacturer} ${Device.modelName}` : Device.modelName
                    }, {
                        headers: { Authorization: `Bearer ${session.access_token}` }
                    });
                }
            }
        } catch (error) {
            console.log('Push Register Error:', error);
        }
    };

    // System check for blocked apps/maintenance
    const checkSystemSettings = async () => {
        try {
            const res = await api.get('/settings/public');
            if (res.data?.app_blocked) {
                setMaintenanceMode({
                    blocked: true,
                    message: res.data.maintenance_message,
                    type: 'maintenance'
                });
                return false;
            } else {
                setMaintenanceMode(null);
                return true;
            }
        } catch (e) {
            return true; // Proceed if check fails (optimistic)
        }
    };

    const fetchProfile = async (userId: string) => {
        try {
            // 1. Fetch Profile
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (error) throw error;

            // 2. Check Disabled
            const { data: disabledEntry } = await supabase.from('disabled_accounts').select('reason').eq('user_id', userId).single();
            if (disabledEntry) {
                setMaintenanceMode({
                    blocked: true,
                    message: disabledEntry.reason,
                    type: 'disabled'
                });
                await supabase.auth.signOut();
                setUser(null);
                setProfile(null);
                return;
            }

            // 3. Role Check
            if (data.role !== 'student') {
                showAlert({ type: 'block', title: 'Access Denied', message: 'Student App only.' });
                await supabase.auth.signOut();
                setUser(null);
                return;
            }

            // 4. Fetch Student Specific Data
            const { data: sData } = await supabase.from('students').select('*').eq('profile_id', userId).single();
            setStudentData(sData);
            setProfile(data);

        } catch (error) {
            console.error(error);
            showAlert({ type: 'error', title: 'Profile Error', message: 'Could not load profile.' });
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, pass: string) => {
        setLoading(true);
        const proceed = await checkSystemSettings();
        if (!proceed) {
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            showAlert({ type: 'error', title: 'Login Failed', message: error.message });
            setLoading(false);
        } else {
            // Success
            registerPushToken();
        }
        // fetchProfile will be triggered by onAuthStateChange
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setStudentData(null);
        setMaintenanceMode(null); // Clear maintenance state
    };

    useEffect(() => {
        // Setup API Interceptors
        checkSystemSettings();

        // Setup API Interceptors
        const cleanupInterceptor = setupInterceptors((msg, type) => {
            if (type === 'disabled') {
                setMaintenanceMode({
                    blocked: true,
                    message: msg,
                    type: 'disabled'
                });
            }
        });

        // Auth Listener
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                if (!user || user.id !== session.user.id) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                    registerPushToken(); // Ensure token is refreshed/registered on session restore
                }
            } else {
                setUser(null);
                setProfile(null);
                setStudentData(null);
                setLoading(false);
            }
        });

        // Safety Timeout
        const safetyTimeout = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn('Auth check timed out - forcing app entry');
                    return false;
                }
                return prev;
            });
        }, 5000);

        return () => {
            clearTimeout(safetyTimeout);
            authListener.subscription.unsubscribe();
            cleanupInterceptor();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, studentData, loading, signIn, signOut, maintenanceMode, checkSystemSettings }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
