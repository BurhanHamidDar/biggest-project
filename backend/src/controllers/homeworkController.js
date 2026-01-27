const supabase = require('../config/supabaseClient');

exports.createHomework = async (req, res) => {
    try {
        const { class_id, section_id, subject_id, teacher_id, title, description, due_date, attachment_url } = req.body;

        if (!class_id || !section_id || !subject_id || !title || !due_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // AUTO-DELETE: Cleanup homework older than 30 days
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { error: cleanupError } = await supabase
                .from('homework')
                .delete()
                .lt('created_at', thirtyDaysAgo.toISOString());

            if (cleanupError) console.error('Homework Cleanup Error:', cleanupError);
        } catch (cleanupErr) {
            console.error('Homework Cleanup Failed:', cleanupErr);
        }

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

            // Also check Class Teacher (HR) override?
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

        const { data, error } = await supabase
            .from('homework')
            .insert([{ class_id, section_id, subject_id, teacher_id, title, description, due_date, attachment_url }])
            .select()
            .single();

        if (error) throw error;

        // NOTIFICATION TRIGGER
        try {
            // 1. Check System Settings
            const { data: settings } = await supabase.from('system_settings').select('notifications_homework').single();
            // Default true if missing
            if (!settings || settings.notifications_homework !== false) {

                // 2. Get Students of Class+Section
                const { data: students } = await supabase
                    .from('students')
                    .select('profile_id')
                    .eq('class_id', class_id)
                    .eq('section_id', section_id);

                if (students && students.length > 0) {
                    const studentIds = students.map(s => s.profile_id);

                    // 3. Get Tokens
                    const { data: tokens } = await supabase
                        .from('push_tokens')
                        .select('token')
                        .in('user_id', studentIds);

                    if (tokens && tokens.length > 0) {
                        const tokenList = tokens.map(t => t.token);
                        const { sendPushList } = require('../utils/expoPush'); // Lazy load

                        await sendPushList(
                            tokenList,
                            'Homework Added 📚',
                            `New homework "${title}" has been posted.`,
                            { homework_id: data.id }
                        );
                    }
                }
            }
        } catch (notifError) {
            console.error('Notification Error (Homework):', notifError);
            // Don't fail the request, just log
        }

        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getHomework = async (req, res) => {
    try {
        const { class_id, section_id, teacher_id, subject_id } = req.query;
        let query = supabase.from('homework').select(`
            *,
            subjects (name),
            classes (name),
            sections (name),
            teachers ( profiles (full_name) )
        `).order('created_at', { ascending: false });

        if (class_id) query = query.eq('class_id', class_id);
        if (section_id) query = query.eq('section_id', section_id);
        if (subject_id) query = query.eq('subject_id', subject_id);
        if (teacher_id) query = query.eq('teacher_id', teacher_id);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteHomework = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('homework').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Homework deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
