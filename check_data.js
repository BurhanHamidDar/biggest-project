require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Checking student data...');
    const { data: students, error } = await supabase
        .from('students')
        .select(`
            profile_id, admission_no, roll_no, class_id, section_id, dob, parent_name, parent_phone, gender, blood_group,
            profiles!profile_id (full_name, avatar_url, address, email, phone_number),
            classes: class_id (name),
            sections: section_id (name)
        `)
        .limit(1);

    if (error) console.error(error);
    else console.log(JSON.stringify(students, null, 2));
}

check();
