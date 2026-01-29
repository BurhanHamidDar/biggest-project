import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iolxbsyhbnxmgeuwghbb.supabase.co';
const supabaseAnonKey = 'sb_publishable_e8XcMtBowXZOgvB5g6TmZg_Bky63rkj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
