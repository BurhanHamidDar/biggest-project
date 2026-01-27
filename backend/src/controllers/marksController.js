const supabase = require('../config/supabaseClient');

// 1. Create Test (Init Draft)
exports.createTest = async (req, res) => {
    try {
        const { class_id, section_id, subject_id, teacher_id, title, max_marks, test_date, records } = req.body;

        if (!title || !max_marks || !records) return res.status(400).json({ error: 'Missing data' });

        // SECURITY: Verify Teacher Assignment
        if (teacher_id) {
            const { data: assignment } = await supabase
                .from('subject_teachers')
                .select('id')
                .eq('teacher_id', teacher_id)
                .eq('class_id', class_id)
                .eq('section_id', section_id)
                .eq('subject_id', subject_id)
                .maybeSingle();

            const { data: hr } = await supabase
                .from('class_teachers')
                .select('id')
                .eq('teacher_id', teacher_id)
                .eq('class_id', class_id)
                .eq('section_id', section_id)
                .maybeSingle();

            if (!assignment && !hr) {
                return res.status(403).json({ error: 'Permission Denied: You are not assigned to this class/subject.' });
            }
        }

        // A. Insert Test Metadata (Draft default)
        const { data: test, error: tErr } = await supabase
            .from('class_tests')
            .insert([{
                class_id, section_id, subject_id, teacher_id,
                title, max_marks, test_date, status: 'draft'
            }])
            .select()
            .single();

        if (tErr) throw tErr;

        // B. Insert Marks
        const marksData = records.map(r => ({
            test_id: test.id,
            student_id: r.student_id,
            marks_obtained: r.marks_obtained
        }));

        const { error: mErr } = await supabase.from('class_test_marks').insert(marksData);
        if (mErr) {
            // Rollback test creation? 
            await supabase.from('class_tests').delete().eq('id', test.id);
            throw mErr;
        }

        res.status(201).json({ message: 'Test created (Saved as Draft)', test_id: test.id });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Get Tests History
exports.getTests = async (req, res) => {
    try {
        const { class_id, section_id, subject_id, teacher_id } = req.query;
        // Logic: Teachers see their tests OR tests for their class/subject.
        // Usually filtering by class+subject is enough.

        let query = supabase
            .from('class_tests')
            .select('*')
            .order('test_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (class_id) query = query.eq('class_id', class_id);
        if (section_id) query = query.eq('section_id', section_id);
        if (subject_id) query = query.eq('subject_id', subject_id);
        // if (teacher_id) query = query.eq('teacher_id', teacher_id); // Optional filter

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Get Test Details (with Marks)
exports.getTestDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: test, error: tErr } = await supabase.from('class_tests').select('*').eq('id', id).single();
        if (tErr || !test) return res.status(404).json({ error: 'Test not found' });

        const { data: marks, error: mErr } = await supabase
            .from('class_test_marks')
            .select(`
                student_id, marks_obtained,
                students: student_id (
                    admission_no,
                    profiles: profiles!profile_id (full_name)
                )
            `)
            .eq('test_id', id);

        if (mErr) throw mErr;

        res.json({ test, marks });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Update Marks (Draft Only)
exports.updateTest = async (req, res) => {
    try {
        const { id } = req.params; // Test ID
        const { records, finalize } = req.body; // Can update marks and optionally finalize

        // Check Status
        const { data: test } = await supabase.from('class_tests').select('status').eq('id', id).single();
        if (test.status === 'finalized') {
            return res.status(403).json({ error: 'Test is finalized. No edits allowed.' });
        }

        // Update Marks
        if (records) {
            // Bulk upsert logic using test_id + student_id conflict?
            // Since we defined UNIQUE(test_id, student_id), upsert works.
            const upsertData = records.map(r => ({
                test_id: id,
                student_id: r.student_id,
                marks_obtained: r.marks_obtained
            }));

            const { error: mErr } = await supabase
                .from('class_test_marks')
                .upsert(upsertData, { onConflict: 'test_id, student_id' });

            if (mErr) throw mErr;
        }

        // Finalize if requested
        if (finalize) {
            const { error: fErr } = await supabase
                .from('class_tests')
                .update({ status: 'finalized' })
                .eq('id', id);
            if (fErr) throw fErr;

            // NOTIFICATION TRIGGER
            try {
                const { data: settings } = await supabase.from('system_settings').select('notifications_marks').single();
                if (!settings || settings.notifications_marks !== false) {
                    // Send to all students in this class/section?
                    // Better: Send to students who have marks in this test? Or just the class?
                    // Let's send to valid students of the class/section to announce "Results Available".

                    const { data: testInfo } = await supabase.from('class_tests').select('title, class_id, section_id').eq('id', id).single();
                    if (testInfo) {
                        const { data: students } = await supabase.from('students').select('profile_id').eq('class_id', testInfo.class_id).eq('section_id', testInfo.section_id);
                        if (students && students.length > 0) {
                            const studentIds = students.map(s => s.profile_id);
                            const { data: tokens } = await supabase.from('push_tokens').select('token').in('user_id', studentIds);

                            if (tokens && tokens.length > 0) {
                                const tokenList = tokens.map(t => t.token);
                                const { sendPushList } = require('../utils/expoPush');
                                await sendPushList(tokenList, 'Test Results 📝', `Results for "${testInfo.title}" are now available.`, { test_id: id });
                            }
                        }
                    }
                }
            } catch (notifError) {
                console.error('Notification Error (Test):', notifError);
            }
        }

        res.json({ message: finalize ? 'Test Finalized.' : 'Test Updated.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Delete Test (Draft Only)
exports.deleteTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: test } = await supabase.from('class_tests').select('status').eq('id', id).single();
        if (test.status === 'finalized') {
            return res.status(403).json({ error: 'Cannot delete finalized test.' });
        }

        await supabase.from('class_tests').delete().eq('id', id);
        res.json({ message: 'Test deleted.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
