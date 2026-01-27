const supabase = require('../config/supabaseClient');

exports.createNotice = async (req, res) => {
    try {
        const { title, content, audience, importance } = req.body;

        // Map 'audience' to 'target_role' array
        let target_role = [];
        if (audience === 'teachers') target_role = ['teacher'];
        else if (audience === 'students') target_role = ['student'];
        // else if 'all' or 'parents', we might leave it empty or add all. 
        // For now, let's assume empty target_role means everyone or specific logic updates.
        else if (audience === 'all') target_role = ['teacher', 'student'];

        const { data, error } = await supabase
            .from('notices')
            .insert([{ title, content, target_role, importance: importance || 'low' }])
            .select();

        if (error) throw error;

        // NOTIFICATION TRIGGER
        try {
            const { data: settings } = await supabase.from('system_settings').select('notifications_notices').single();
            if (!settings || settings.notifications_notices !== false) {
                // Determine Target User IDs
                // target_role is array: ['student'], ['teacher'], or both.
                let query = supabase.from('profiles').select('id');

                // If specific target roles
                if (target_role && target_role.length > 0) {
                    query = query.in('role', target_role);
                }
                // If empty, maybe no one? Or everyone? Assuming target_role is required.

                const { data: users } = await query;

                if (users && users.length > 0) {
                    const userIds = users.map(u => u.id);
                    const { data: tokens } = await supabase.from('push_tokens').select('token').in('user_id', userIds);

                    if (tokens && tokens.length > 0) {
                        const tokenList = tokens.map(t => t.token);
                        const { sendPushList } = require('../utils/expoPush');
                        await sendPushList(tokenList, `Notice: ${title} 📢`, 'Tap to view new notice.', { notice_id: data[0].id });
                    }
                }
            }
        } catch (notifError) {
            console.error('Notification Error (Notice):', notifError);
        }
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Create Notice Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getNotices = async (req, res) => {
    try {
        const { role } = req.query; // e.g. 'student' or 'teacher'

        let query = supabase
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false });

        if (role) {
            // Filter where target_role array contains the user's role
            // Supabase/Postgres array containment operator: cs (contains)
            query = query.cs('target_role', `{${role}}`);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('notices').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
