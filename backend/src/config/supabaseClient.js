const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Backend uses Service Role Key for admin tasks

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
