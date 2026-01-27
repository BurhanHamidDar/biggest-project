require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS for debugging

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Environment Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('--- Debugging Teachers Table ---');

    // 1. Check teacher records
    const { data: teachers, error } = await supabase
        .from('teachers')
        .select('profile_id, dob, joining_date, department, profiles(full_name, email)');

    if (error) {
        console.error('Error fetching teachers:', error);
    } else {
        console.log(`Total Teachers: ${teachers.length}`);
        teachers.forEach((t, index) => {
            // @ts-ignore
            const name = t.profiles?.full_name || 'N/A';
            console.log(`#${index + 1}: [${name}] DOB: ${t.dob} | Joined: ${t.joining_date}`);
        });
    }

    // 2. Check columns (indirectly via data keys)
    if (teachers && teachers.length > 0) {
        console.log('Columns found:', Object.keys(teachers[0]));
    } else {
        console.log('No teachers found to inspect columns.');
    }
}

debug();
