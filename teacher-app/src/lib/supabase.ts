import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Access Environment Variables (Hardcoded for now as per Expo best practices for dev, or use process.env if setup)
// Since we don't have .env setup here yet, I will use the known credentials from previous context or ask user.
// Wait, I should maintain consistency. Let's use the ones from the admin panel if available or placeholders.
// Actually, I have access to backend config via file view, but usually we put these in .env.
// For now, I will use placeholders and ask user to fill, or check if I can read them.

// retrieving values from admin panel context if possible... 
// I'll check admin panel next config or just use the ones I know if I viewed them.
// I haven't viewed .env explicitly recently.
// I will assume the user has them or I will read them from `admin-panel/.env.local` if I can.
// Better: I'll use the ones I saw in `backend/src/config/supabaseClient.js` logic? No that's backend.
// Let's read `admin-panel/.env.local` to match.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
