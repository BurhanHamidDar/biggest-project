require('dotenv').config({ path: './src/.env' }); // Adjusted for backend root execution context if needed, or just standard
const supabase = require('./src/config/supabaseClient');

async function checkExams() {
    console.log('--- CHECKING EXAMS ---');
    const { data: exams, error } = await supabase
        .from('exams')
        .select('id, name, is_published, start_date');

    if (error) {
        console.error('Error fetching exams:', error);
        return;
    }

    console.log(`Found ${exams.length} exams:`);
    exams.forEach(e => console.log(`- [${e.is_published ? 'PUBLISHED' : 'DRAFT'}] ${e.name} (ID: ${e.id})`));

    console.log('\n--- CHECKING MARKSHEETS ---');
    const { data: sheets, error: sErr } = await supabase
        .from('student_marksheets')
        .select('student_id, exam_id, file_url');

    if (sErr) {
        console.error('Error fetching marksheets:', sErr);
    } else {
        console.log(`Found ${sheets.length} marksheets:`);
        sheets.forEach(s => console.log(`- Student: ${s.student_id} | Exam: ${s.exam_id} | URL: ${s.file_url}`));
    }
}

checkExams();
