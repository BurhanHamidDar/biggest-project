
// ... (imports)
import axios from 'axios';
import { supabase } from './supabase';

const API_URL = 'https://biggest-project-1.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
});

// Request Interceptor (Auth Token)
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// Response Interceptor (Maintenance Mode)
// We need a way to trigger the Context from here. 
// Since axios is outside React Context, we can use a singleton or event emitter.
// OR we can export a setup function to be called inside AuthContext.

export const setupInterceptors = (triggerMaintenance: (msg: string, type: 'maintenance' | 'disabled') => void) => {
    const id = api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response) {
                const { status, data } = error.response;
                if (status === 503 && data?.blocked) {
                    triggerMaintenance(data.message, 'maintenance');
                } else if (status === 403 && data?.error === 'Account Disabled') {
                    // Extract just the reason if possible, or pass the full message.
                    // The backend sends: { error: 'Account Disabled', message: 'Your account is disabled. Reason: [reason]...' }
                    // We'll pass the full message for now, or we can try to parse it. 
                    // Let's pass the message as is.
                    triggerMaintenance(data.message, 'disabled');
                }
            }
            return Promise.reject(error);
        }
    );
    return () => api.interceptors.response.eject(id);
};

export default api;
