require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeachers() {
    console.log('--- Checking Teachers Data ---');

    // Fetch all teachers with profile info
    const { data: teachers, error } = await supabase
        .from('teachers')
        .select('profile_id, dob, joining_date, profiles(full_name)');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (teachers.length === 0) {
        console.log('No teachers found.');
        return;
    }

    console.log(`Found ${teachers.length} teachers:`);
    teachers.forEach(t => {
        const name = t.profiles ? t.profiles.full_name : 'Unknown';
        const dobStatus = t.dob ? `DOB: ${t.dob}` : 'DOB: MISSING (NULL)';
        console.log(`- ${name}: ${dobStatus}`);
    });
}

checkTeachers();
