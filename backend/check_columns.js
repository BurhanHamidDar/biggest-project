require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('students')
        .select('profile_id, gender, blood_group, parent_name, parent_phone, profiles(full_name)')
        .limit(3);

    if (error) console.error(error);
    else {
        data.forEach(s => {
            console.log(`Student: ${s.profiles?.full_name}`);
            console.log(`  Gender: ${s.gender}`);
            console.log(`  Blood: ${s.blood_group}`);
            console.log(`  Parent: ${s.parent_name}`);
            console.log(`  Phone: ${s.parent_phone}`);
        });
    }
}
check();
