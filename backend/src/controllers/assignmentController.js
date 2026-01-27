const supabase = require('../config/supabaseClient');

// --- CLASS TEACHER (HR) ---
exports.assignClassTeacher = async (req, res) => {
    try {
        const { teacher_id, class_id, section_id } = req.body;

        // Upsert logic: If a record exists for this class+section, update the teacher_id
        // academic_year_id is optional for now, we ignore it or set null to avoid complexity unless user asks

        // Check if assignment exists
        const { data: existing, error: fetchError } = await supabase
            .from('class_teachers')
            .select('id')
            .eq('class_id', class_id)
            .eq('section_id', section_id)
            .single();

        let error;
        if (existing) {
            // Update
            const { error: updateError } = await supabase
                .from('class_teachers')
                .update({ teacher_id })
                .eq('id', existing.id);
            error = updateError;
        } else {
            // Insert
            const { error: insertError } = await supabase
                .from('class_teachers')
                .insert([{ teacher_id, class_id, section_id }]);
            error = insertError;
        }

        if (error) throw error;
        res.json({ message: 'Class Teacher assigned successfully' });

    } catch (error) {
        console.error('Assign Class Teacher Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getClassTeachers = async (req, res) => {
    try {
        // Return list of allocations: class_id, section_id, teacher: { full_name }
        const { data, error } = await supabase
            .from('class_teachers')
            .select(`
                id, class_id, section_id,
                teachers (
                    profile_id,
                    profiles (full_name)
                )
            `);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeClassTeacher = async (req, res) => {
    try {
        const { class_id, section_id } = req.query;
        const { error } = await supabase
            .from('class_teachers')
            .delete()
            .eq('class_id', class_id)
            .eq('section_id', section_id);

        if (error) throw error;
        res.json({ message: 'Assignment removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- SUBJECT TEACHER ---
exports.assignSubjectTeacher = async (req, res) => {
    try {
        const { teacher_id, class_id, section_id, subject_id } = req.body;
        // Check for duplicates
        const { data: existing } = await supabase
            .from('subject_teachers')
            .select('id')
            .match({ teacher_id, class_id, section_id, subject_id })
            .single();

        if (existing) return res.json({ message: 'Already assigned' });

        const { error } = await supabase
            .from('subject_teachers')
            .insert([{ teacher_id, class_id, section_id, subject_id }]);

        if (error) throw error;
        res.json({ message: 'Subject Teacher assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSubjectTeachers = async (req, res) => {
    try {
        const { teacher_id, class_id } = req.query;
        let query = supabase.from('subject_teachers')
            .select(`
                id, class_id, section_id, subject_id,
                classes(name), sections(name), subjects(name),
                teachers (
                    profile_id,
                    profiles (full_name)
                )
            `);

        if (teacher_id) query = query.eq('teacher_id', teacher_id);
        if (class_id) query = query.eq('class_id', class_id);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeSubjectTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('subject_teachers').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Assignment removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
