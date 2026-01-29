import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { AppState, Platform } from 'react-native'; // Removed Native Alert
import api, { setupInterceptors } from '../lib/api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAlert } from './AlertContext'; // Added

// Define the shape of the context
interface AuthContextType {
    user: any | null;
    profile: any | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signOut: () => Promise<void>;
    systemSettings: any | null;
    maintenanceMode: { blocked: boolean; message: string; type?: 'maintenance' | 'disabled' } | null;
    checkSystemSettings: () => Promise<any>;
    triggerMaintenanceMode: (message: string) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// API URL - needs to be configured
// For physical device, localhost won't work. Needs Ngrok or local IP.
// For now we assume the user will set valid API_URL in env.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper for Push Registration (Top Level)
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

        if (!projectId) {
            console.log('Project ID not found. Is app.json configured?');
            // return; // Don't return, let it try without it (sometimes works in dev) or hard fail in catch
        }

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
    const [loading, setLoading] = useState(true);
    const [systemSettings, setSystemSettings] = useState<any | null>(null);
    const { showAlert } = useAlert(); // Access Alert System

    const [maintenanceMode, setMaintenanceMode] = useState<{ blocked: boolean; message: string; type: 'maintenance' | 'disabled' } | null>(null);

    // Check System Settings (Service)
    const checkSystemSettings = async () => {
        try {
            const res = await api.get('/settings/public');
            setSystemSettings(res.data);

            if (res.data?.app_blocked) {
                setMaintenanceMode({
                    blocked: true,
                    message: res.data.maintenance_message,
                    type: 'maintenance'
                });
            } else {
                setMaintenanceMode(null);
            }
            return res.data;
        } catch (e) {
            console.log('Failed to fetch settings', e);
            return null;
        }
    };

    const triggerMaintenanceMode = (message: string, type: 'maintenance' | 'disabled' = 'maintenance') => {
        setMaintenanceMode({ blocked: true, message, type });
    };


    // ... (other imports remain, but I only replace the block I target)

    useEffect(() => {
        // Setup Interceptor
        const cleanupInterceptor = setupInterceptors((msg: string, type: 'maintenance' | 'disabled') => {
            triggerMaintenanceMode(msg, type);
        });

        checkSystemSettings();

        // 1. Get Initial Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                fetchProfile(session.user.id);
                registerPushToken();
            } else {
                setLoading(false); // No session, stop loading
            }
        });

        // 2. Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log(`Auth Event: ${_event}`);
            if (session) {
                if (!user || user.id !== session.user.id) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                }
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
            cleanupInterceptor();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            // Fetch Profile + Check Disabled Status
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Check Disabled Status
            const { data: disabledEntry } = await supabase
                .from('disabled_accounts')
                .select('reason')
                .eq('user_id', userId)
                .single();

            if (disabledEntry) {
                triggerMaintenanceMode(`Your account is disabled. Reason: ${disabledEntry.reason}. Contact administration.`, 'disabled');
                await supabase.auth.signOut();
                setUser(null);
                setProfile(null);
                return;
            }

            // Security Checks
            if (data.role !== 'teacher') {
                showAlert({
                    type: 'block',
                    title: 'Access Denied',
                    message: 'This app is only for Teachers.'
                });
                await supabase.auth.signOut();
                setUser(null);
                setProfile(null);
                return;
            }

            // Fetch teacher specific details (department/subject)
            if (data.role === 'teacher') {
                const { data: teacherData, error: teacherError } = await supabase
                    .from('teachers')
                    .select('department')
                    .eq('profile_id', userId)
                    .single();

                if (!teacherError && teacherData) {
                    data.department = teacherData.department;
                }
            }

            setProfile(data);
        } catch (error) {
            console.error('Fetch Profile Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const registerPushToken = async () => {
        try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    await api.post('/notifications/register', {
                        token,
                        device_name: Device.modelName
                    }, {
                        headers: { Authorization: `Bearer ${session.access_token}` }
                    });
                    // DEBUG ALERT
                    // alert('Push Token Registered!'); 
                }
            }
        } catch (error: any) {
            console.log('Push Register Error:', error);
            // alert('Push Error: ' + error.message);
        }
    };

    const signIn = async (email: string, pass: string) => {
        setLoading(true);
        // 1. Check Maintenance Mode
        const settings = await checkSystemSettings();
        if (settings?.app_blocked) { // Ensure consistent property name
            showAlert({ type: 'block', title: 'Maintenance', message: settings.maintenance_message || 'System under maintenance' });
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error) {
            showAlert({ type: 'error', title: 'Login Failed', message: error.message });
            setLoading(false);
        } else {
            // Success
            registerPushToken();
        }
    };

    // Also call on session restore if user exists
    useEffect(() => {
        if (user) {
            registerPushToken();
        }
    }, [user]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.log("Error signing out from Supabase:", error);
        } finally {
            // Force local cleanup
            setUser(null);
            setProfile(null);
            setLoading(false);
            setMaintenanceMode(null); // Clear maintenance state
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            signIn,
            signOut,
            systemSettings,
            maintenanceMode,
            checkSystemSettings,
            triggerMaintenanceMode
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
