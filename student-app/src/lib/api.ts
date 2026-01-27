import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

let maintenanceTrigger: ((msg: string, type: 'maintenance' | 'disabled') => void) | null = null;

export const setupInterceptors = (triggerFn: (msg: string, type: 'maintenance' | 'disabled') => void) => {
    maintenanceTrigger = triggerFn;
    return () => {
        maintenanceTrigger = null;
    };
};

api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;
            if (status === 503 && data?.blocked) {
                if (maintenanceTrigger) maintenanceTrigger(data.message, 'maintenance');
            } else if (status === 403 && data?.error === 'Account Disabled') {
                if (maintenanceTrigger) maintenanceTrigger(data.message, 'disabled');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
