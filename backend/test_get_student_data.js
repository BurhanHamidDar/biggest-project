require('dotenv').config(); // Path depends on where run
const { createClient } = require('@supabase/supabase-js');

// Hardcode for debug if env fails or just read process.env
// Assuming running from backend folder
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Checking student data...');
    const { data: students, error } = await supabase
        .from('students')
        .select(`
            profile_id, 
            parent_name, parent_phone, gender, blood_group,
            profiles!profile_id (full_name, email, phone_number)
        `)
        .limit(2);

    if (error) console.error(error);
    else console.log(JSON.stringify(students, null, 2));
}

check();
