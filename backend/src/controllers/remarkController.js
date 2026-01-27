const supabase = require('../config/supabaseClient');

exports.createRemark = async (req, res) => {
    try {
        const { student_id, teacher_id, remark, type } = req.body;
        // type: 'positive', 'negative', 'general'

        if (!student_id || !remark) {
            return res.status(400).json({ error: 'Student and Remark are required' });
        }

        const { data, error } = await supabase
            .from('student_remarks')
            .insert([{ student_id, teacher_id, remark, type: type || 'general' }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentRemarks = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { data, error } = await supabase
            .from('student_remarks')
            .select(`
                *,
                teachers: teacher_id (
                    profiles (full_name)
                )
            `)
            .eq('student_id', student_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
