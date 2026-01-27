const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const supabase = require('./src/config/supabaseClient');

async function debugSync() {
    console.log('--- DEBUGGING SYNC ISSUES ---');

    // 1. Get Student Context
    const { data: student } = await supabase.from('students').select('profile_id, class_id, section_id').limit(1).single();
    if (!student) { console.log('No student found'); return; }

    console.log(`Student ID: ${student.profile_id}`);
    console.log(`Class: ${student.class_id}, Section: ${student.section_id}`);

    // --- ATTENDANCE ---
    console.log('\n--- 1. ATTENDANCE ---');
    const { data: registers } = await supabase
        .from('attendance_registers')
        .select('*')
        .eq('class_id', student.class_id)
        .eq('section_id', student.section_id)
        .order('date', { ascending: false })
        .limit(5);

    console.log(`Last 5 Registers for Class/Section:`);
    console.table(registers);

    if (registers && registers.length > 0) {
        const regIds = registers.map(r => r.id);
        const { data: records } = await supabase
            .from('attendance_records')
            .select('*')
            .in('register_id', regIds)
            .eq('student_id', student.profile_id);

        console.log(`Attendance Records for these registers:`);
        console.table(records);
    }

    // --- FEES ---
    console.log('\n--- 2. FEES ---');
    // A. Expected Fees
    const { data: feeStructure } = await supabase
        .from('class_fee_structures')
        .select('id, amount, fee_types(name)')
        .eq('class_id', student.class_id);

    console.log('Class Fee Structure:');
    if (feeStructure) {
        feeStructure.forEach(f => console.log(`- ID: ${f.id} | ${f.fee_types?.name}: ${f.amount}`));
    }

    // B. Payments/ records
    const { data: payments } = await supabase
        .from('student_fee_payments')
        .select('*')
        .eq('student_id', student.profile_id);

    console.log('Student Fee Payments Table:');
    console.table(payments);
}

debugSync();
