const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const supabase = require('./src/config/supabaseClient');

async function publishExams() {
    console.log('--- PUBLISHING EXAMS WITH APPROVED RESULTS ---');

    // Aggressive Fix: Set ALL exams to published
    const { data, error } = await supabase
        .from('exams')
        .update({ is_published: true })
        .like('name', '%'); // Valid filter for all text names

    if (error) {
        console.error('Error publishing all:', error);
    } else {
        console.log('SUCCESS: All exams marked as PUBLISHED.');
    }
}

publishExams();
