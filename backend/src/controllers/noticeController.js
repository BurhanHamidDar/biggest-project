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

        // Validate Importance
        const validImportance = ['low', 'medium', 'high', 'urgent'];
        let finalImportance = importance || 'low';
        if (finalImportance === 'normal') finalImportance = 'medium'; // Fix for Admin Panel sending 'normal'
        if (!validImportance.includes(finalImportance)) finalImportance = 'low';

        const { data, error } = await supabase
            .from('notices')
            .insert([{ title, content, target_role, importance: finalImportance }])
            .select();

        if (error) throw error;

        // NOTIFICATION TRIGGER
        try {
            console.log(`[Notification] Checking settings for Notice ID: ${data[0].id}`);
            const { data: settings } = await supabase.from('system_settings').select('notifications_notices').single();

            if (!settings || settings.notifications_notices !== false) {
                // Determine Target User IDs
                let query = supabase.from('profiles').select('id, role');

                // If specific target roles
                if (target_role && target_role.length > 0) {
                    query = query.in('role', target_role);
                }

                const { data: users } = await query;
                console.log(`[Notification] Found ${users ? users.length : 0} target users for roles: ${target_role}`);

                if (users && users.length > 0) {
                    const userIds = users.map(u => u.id);
                    const { data: tokens } = await supabase.from('push_tokens').select('token').in('user_id', userIds);

                    console.log(`[Notification] Found ${tokens ? tokens.length : 0} push tokens.`);

                    if (tokens && tokens.length > 0) {
                        const tokenList = tokens.map(t => t.token);
                        const { sendPushList } = require('../utils/expoPush');
                        await sendPushList(tokenList, `Notice: ${title} 📢`, 'Tap to view new notice.', { notice_id: data[0].id });
                    }
                }
            } else {
                console.log('[Notification] Notice notifications are DISABLED in settings.');
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
