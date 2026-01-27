const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const supabase = require('./src/config/supabaseClient');

async function checkAttendance() {
    console.log('--- CHECKING ATTENDANCE RECORDS ---');

    // 1. Get First Student
    const { data: student } = await supabase.from('students').select('profile_id, class_id, section_id').limit(1).single();
    if (!student) { console.log('No student found'); return; }

    console.log('Student ID:', student.profile_id);

    // 2. Check Registers for Today (UTC vs Local check)
    const today = new Date().toISOString().split('T')[0];
    console.log('Checking Date (UTC):', today);

    const { data: registers } = await supabase
        .from('attendance_registers')
        .select('*')
        .eq('class_id', student.class_id)
        .eq('section_id', student.section_id);

    console.log('Registers Found:', registers?.length || 0);
    if (registers) console.table(registers);

    // 3. Check Records
    if (registers && registers.length > 0) {
        const regIds = registers.map(r => r.id);
        const { data: records } = await supabase
            .from('attendance_records')
            .select('*')
            .in('register_id', regIds)
            .eq('student_id', student.profile_id);

        console.log('Records Found:', records?.length || 0);
        if (records) console.table(records);
    }
}

checkAttendance();
