const supabase = require('../config/supabaseClient');

// Create Timetable Entry
exports.createTimetableEntry = async (req, res) => {
    try {
        const { class_id, section_id, subject_id, teacher_id, day, period_number, start_time, end_time, room_number } = req.body;

        if (!class_id || !section_id || !subject_id || !teacher_id || !day || !period_number || !start_time || !end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Check for Conflicts
        // A. Class Conflict: Is this class + section busy in this period?
        const { data: classBusy } = await supabase
            .from('timetable')
            .select('id')
            .eq('class_id', class_id)
            .eq('section_id', section_id)
            .eq('day', day)
            .eq('period_number', period_number)
            .eq('period_number', period_number)
            .single();

        if (classBusy) {
            return res.status(409).json({ error: `Class already has a subject in period ${period_number} on ${day}.` });
        }

        // B. Teacher Conflict: Is this teacher busy in this period?
        const { data: teacherBusy } = await supabase
            .from('timetable')
            .select('id')
            .eq('teacher_id', teacher_id)
            .eq('day', day)
            .eq('period_number', period_number)
            .eq('period_number', period_number)
            .single();

        if (teacherBusy) {
            return res.status(409).json({ error: `Teacher is already assigned to another class in period ${period_number} on ${day}.` });
        }

        // 2. Insert Entry
        const { data, error } = await supabase
            .from('timetable')
            .insert([{
                class_id, section_id, subject_id, teacher_id, day, period_number, start_time, end_time, room_number
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);

    } catch (error) {
        console.error('Create Timetable Error:', error);
        if (error.code === '23505') { // Unique Violation from DB
            return res.status(409).json({ error: 'Conflict detected (Duplicate Entry)' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Get Timetable (Filtered)
exports.getTimetable = async (req, res) => {
    try {
        const { class_id, section_id, teacher_id } = req.query;

        let query = supabase
            .from('timetable')
            .select(`
                id, day, period_number, start_time, end_time, room_number,
                subjects (name, code),
                teachers: teacher_id (profile_id, profiles(full_name)),
                classes (name),
                sections (name)
            `)
            .select(`
                id, day, period_number, start_time, end_time, room_number,
                subjects (name, code),
                teachers: teacher_id (profile_id, profiles(full_name)),
                classes (name),
                sections (name)
            `)
            .order('period_number', { ascending: true }); // Then order by Day in client or here? Supabase doesn't sort text days well.

        if (class_id) query = query.eq('class_id', class_id);
        if (section_id) query = query.eq('section_id', section_id);
        if (teacher_id) query = query.eq('teacher_id', teacher_id);

        const { data, error } = await query;
        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Get Timetable Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update and Delete would be similar (omitted for brevity in this step, but standard CRUD)
exports.deleteTimetableEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('timetable')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Timetable entry deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
