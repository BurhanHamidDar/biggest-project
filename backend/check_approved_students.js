const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const supabase = require('./src/config/supabaseClient');

async function checkDetails() {
    console.log('--- CHECKING WHO HAS APPROVED MARKSHEETS (Sequential) ---');

    // 1. Get marksheets
    const { data: sheets, error } = await supabase
        .from('student_marksheets')
        .select('student_id, exam_id, file_url, created_at'); // Get ALL records to be safe

    if (error) {
        console.error('Error fetching sheets:', error);
        return;
    }

    if (!sheets || sheets.length === 0) {
        console.log('No marksheets found at all.');
        return;
    }

    // 2. Expand details
    for (let i = 0; i < sheets.length; i++) {
        const s = sheets[i];

        // Get Student Name
        const { data: student } = await supabase
            .from('students')
            .select('profile_id, admission_no')
            .eq('profile_id', s.student_id)
            .single();

        let name = 'Unknown Student';
        let email = 'Unknown Email';

        if (student) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', student.profile_id)
                .single();

            if (profile) {
                name = profile.full_name;
                email = profile.email;
            }
        }

        // Get Exam Name and Status
        const { data: exam } = await supabase
            .from('exams')
            .select('name, is_published')
            .eq('id', s.exam_id)
            .single();

        const examName = exam?.name || 'Unknown Exam';
        const isPublished = exam?.is_published;

        console.log(`${i + 1}. Student: ${name} (${email})`);
        console.log(`   ID: ${s.student_id}`);
        console.log(`   Exam: ${examName} (Published: ${isPublished})`);
        console.log(`   Status: ${s.file_url}`);
        console.log('-----------------------------------');
    }
}

checkDetails();
