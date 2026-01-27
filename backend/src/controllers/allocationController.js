const supabase = require('../config/supabaseClient');

// 1. Assign Class Teacher (HR)
exports.assignClassTeacher = async (req, res) => {
    try {
        const { teacher_id, class_id, section_id, academic_year_id } = req.body;

        if (!teacher_id || !class_id || !section_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('class_teachers')
            .upsert([{
                teacher_id, class_id, section_id, academic_year_id
            }], { onConflict: 'class_id, section_id, academic_year_id' })
            .select();

        if (error) throw error;
        res.json({ message: 'Class Teacher assigned successfully', data });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Assign Subject Teacher
exports.assignSubjectTeacher = async (req, res) => {
    try {
        const { teacher_id, subject_id, class_id, section_id, academic_year_id } = req.body;

        if (!teacher_id || !subject_id || !class_id || !section_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('subject_teachers')
            .insert([{
                teacher_id, subject_id, class_id, section_id, academic_year_id
            }])
            .select();

        if (error) throw error;
        res.json({ message: 'Subject Teacher assigned successfully', data });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Get Allocations (for a Class)
exports.getClassAllocations = async (req, res) => {
    try {
        const { class_id, section_id } = req.query;

        if (!class_id || !section_id) return res.status(400).json({ error: 'Class and Section required' });

        const { data: hr, error: hrError } = await supabase
            .from('class_teachers')
            .select('teachers(profiles(full_name))')
            .eq('class_id', class_id)
            .eq('section_id', section_id)
            .maybeSingle();

        const { data: subjects, error: subError } = await supabase
            .from('subject_teachers')
            .select('subjects(name), teachers(profiles(full_name))')
            .eq('class_id', class_id)
            .eq('section_id', section_id);

        if (hrError || subError) throw hrError || subError;

        res.json({
            class_teacher: hr?.teachers?.profiles?.full_name || 'Not Assigned',
            subject_teachers: subjects.map(s => ({
                subject: s.subjects.name,
                teacher: s.teachers.profiles.full_name
            }))
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Remove Allocation
exports.removeSubjectTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('subject_teachers').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Allocation removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
