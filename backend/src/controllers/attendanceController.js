const supabase = require('../config/supabaseClient');

// Helper to check if finalized
const checkFinalized = async (date, class_id, section_id) => {
    const { data } = await supabase
        .from('attendance_registers')
        .select('id, status')
        .eq('date', date)
        .eq('class_id', class_id)
        .eq('section_id', section_id)
        .single();
    return data; // returns { id, status } or null
};

// 1. Get Status for Today (App Load)
exports.getAttendanceStatus = async (req, res) => {
    try {
        const { date, class_id, section_id } = req.query;
        if (!date || !class_id || !section_id) return res.status(400).json({ error: 'Missing params' });

        const register = await checkFinalized(date, class_id, section_id);

        if (!register) {
            return res.json({ status: 'not_started', is_finalized: false });
        }

        // Get detailed counts if exists
        const { data: records } = await supabase
            .from('attendance_records')
            .select('status')
            .eq('register_id', register.id);

        const counts = {
            total: records.length,
            present: records.filter(r => r.status === 'present').length,
            absent: records.filter(r => r.status === 'absent').length
        };

        res.json({
            status: register.status, // 'draft' or 'finalized'
            is_finalized: register.status === 'finalized',
            counts,
            register_id: register.id
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 1.5 Get Recent History
exports.getRecentAttendance = async (req, res) => {
    try {
        const { class_id, section_id } = req.query;
        if (!class_id || !section_id) return res.status(400).json({ error: 'Missing params' });

        const { data, error } = await supabase
            .from('attendance_registers')
            .select('id, date, status, marked_by')
            .eq('class_id', class_id)
            .eq('section_id', section_id)
            .order('date', { ascending: false })
            .limit(5);

        if (error) throw error;
        res.json(data);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Mark/Edit Attendance (Draft Mode Only)
exports.markAttendance = async (req, res) => {
    const { date, class_id, section_id, marked_by, records } = req.body;
    try {
        // ... Permission checks (keep existing) ...
        // Skipping brevity ...

        // CHECK IF FINALIZED
        const existing = await checkFinalized(date, class_id, section_id);
        if (existing && existing.status === 'finalized') {
            return res.status(403).json({ error: 'Attendance is already FINALIZED. No edits allowed.' });
        }

        let registerId = existing ? existing.id : null;

        // Create Register if new
        if (!registerId) {
            const { data: newReg, error: createError } = await supabase
                .from('attendance_registers')
                .insert([{ date, class_id, section_id, marked_by, status: 'draft' }]) // Default draft
                .select()
                .single();
            if (createError) throw createError;
            registerId = newReg.id;
        }

        // Upsert Records (Delete old for safety + Insert new)
        await supabase.from('attendance_records').delete().eq('register_id', registerId);

        const upsertData = records.map(r => ({
            register_id: registerId,
            student_id: r.student_id,
            status: r.status,
            remarks: r.remarks
        }));

        const { error: insertError } = await supabase.from('attendance_records').insert(upsertData);
        if (insertError) throw insertError;

        res.json({ message: 'Attendance saved as DRAFT.', register_id: registerId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// 3. Finalize Attendance
exports.finalizeAttendance = async (req, res) => {
    try {
        const { date, class_id, section_id } = req.body;

        const existing = await checkFinalized(date, class_id, section_id);
        if (!existing) return res.status(404).json({ error: 'Attendance not found to finalize.' });

        if (existing.status === 'finalized') {
            return res.status(400).json({ error: 'Already finalized.' });
        }

        // Update status
        const { error } = await supabase
            .from('attendance_registers')
            .update({ status: 'finalized' })
            .eq('id', existing.id);

        if (error) throw error;

        // NOTIFICATION TRIGGER
        try {
            // 1. Check System Settings
            const { data: settings } = await supabase.from('system_settings').select('notifications_attendance').single();
            if (!settings || settings.notifications_attendance !== false) {
                // 2. Fetch Records to notify
                const { data: records } = await supabase
                    .from('attendance_records')
                    .select('student_id, status')
                    .eq('register_id', existing.id);

                if (records && records.length > 0) {
                    // 3. Get All Tokens for students in this register
                    const studentIds = records.map(r => r.student_id);
                    const { data: tokens } = await supabase
                        .from('push_tokens')
                        .select('user_id, token')
                        .in('user_id', studentIds);

                    if (tokens && tokens.length > 0) {
                        const { sendPush } = require('../utils/expoPush');
                        // Group by status? No, individualized.
                        // Can we bulk send? Yes, if same message. But status differs.
                        // Group by status: Present vs Absent
                        const presentIds = new Set(records.filter(r => r.status === 'present').map(r => r.student_id));
                        const absentIds = new Set(records.filter(r => r.status === 'absent').map(r => r.student_id));

                        const presentTokens = tokens.filter(t => presentIds.has(t.user_id)).map(t => t.token);
                        const absentTokens = tokens.filter(t => absentIds.has(t.user_id)).map(t => t.token);

                        const { sendPushList } = require('../utils/expoPush');
                        if (presentTokens.length > 0) {
                            await sendPushList(presentTokens, 'Attendance Update ✅', 'You have been marked PRESENT today.', { type: 'attendance', date });
                        }
                        if (absentTokens.length > 0) {
                            await sendPushList(absentTokens, 'Attendance Update ❌', 'You have been marked ABSENT today.', { type: 'attendance', date });
                        }
                    }
                }
            }
        } catch (notifError) {
            console.error('Notification Error (Attendance):', notifError);
        }

        res.json({ message: 'Attendance FINALIZED successfully.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Get Data 
exports.getAttendance = async (req, res) => {
    // Keep existing logic ...
    // ...
    try {
        const { date, class_id, section_id } = req.query;

        const { data: register, error: regError } = await supabase
            .from('attendance_registers')
            .select('id, marked_by, status') // Include status
            .eq('date', date)
            .eq('class_id', class_id)
            .eq('section_id', section_id)
            .single();

        if (regError && regError.code !== 'PGRST116') throw regError;
        if (!register) return res.json([]);

        // Get Records
        const { data: records } = await supabase
            .from('attendance_records')
            .select(`
                id, student_id, status, remarks,
                students: student_id (
                    admission_no, roll_no, 
                    profiles: profiles!profile_id (full_name, avatar_url)
                )
            `)
            .eq('register_id', register.id);

        // Return enriched with status
        res.json({
            status: register.status,
            is_finalized: register.status === 'finalized',
            records
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentAttendanceReport = async (req, res) => {
    // Keep existing ...
    // Note: Should we only show finalized attendance to students?
    // STRICT RULE: Students only see finalized. 
    // Implementation: Filter where attendance_registers.status = 'finalized'
    try {
        const { student_id, month, year } = req.query;
        const startDate = `${year}-${month}-01`;

        const { data, error } = await supabase
            .from('attendance_records')
            .select(`
                status, remarks,
                attendance_registers!inner (date, status)
            `)
            .eq('student_id', student_id)
            .eq('attendance_registers.status', 'finalized') // Only Finalized
            .gte('attendance_registers.date', startDate)
            .lt('attendance_registers.date', `${year}-${parseInt(month) + 1}-01`);

        if (error) throw error;

        const report = data.map(d => ({
            date: d.attendance_registers.date,
            status: d.status,
            remarks: d.remarks
        }));

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
