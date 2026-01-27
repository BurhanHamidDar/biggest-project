const supabase = require('../config/supabaseClient');

// Get Inbox Messages
exports.getInbox = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { type } = req.query; // 'all', 'notice', 'alert'

        // 1. Fetch Personal Inbox (Handle missing table gracefully)
        let inboxData = [];
        try {
            let inboxQuery = supabase
                .from('inbox')
                .select('*')
                .eq('user_id', user_id);

            if (type && type !== 'all') {
                if (type === 'notice') inboxQuery = inboxQuery.eq('type', 'notice');
                else if (type === 'alert') inboxQuery = inboxQuery.neq('type', 'notice');
            }

            const { data, error } = await inboxQuery;

            if (error) {
                // Ignore "relation does not exist" error (PGRST205) to allow notices to load
                if (error.code !== 'PGRST205') {
                    console.error('Inbox Fetch Error:', error);
                } else {
                    console.warn('Inbox table missing - skipping personal alerts.');
                }
            } else {
                inboxData = data || [];
            }
        } catch (err) {
            console.warn('Inbox table access failed, proceeding with notices only:', err.message);
        }

        // 2. Fetch Global Notices
        // We fetch ALL notices to match Dashboard behavior
        let noticesData = [];
        if (!type || type === 'all' || type === 'notice') {
            const { data: notices, error: noticeError } = await supabase
                .from('notices')
                .select('*')
                .order('created_at', { ascending: false });

            if (noticeError) console.error('Notice Fetch Error:', noticeError);

            if (notices) {
                // Robust Filtering: Handle array, string, or null/empty formats
                const relevantNotices = notices.filter(n => {
                    const roles = n.target_role;

                    // If no target specified, assume public/all
                    if (!roles || roles.length === 0) return true;

                    // Check if roles is array
                    if (Array.isArray(roles)) {
                        return roles.includes('teacher') || roles.includes('all') || roles.includes('teachers');
                    }

                    // Check if roles is string
                    if (typeof roles === 'string') {
                        const lowerRoles = roles.toLowerCase();
                        return lowerRoles.includes('teacher') || lowerRoles.includes('all');
                    }

                    return false;
                });

                // Map to Inbox Format
                noticesData = relevantNotices.map(n => ({
                    id: `notice_${n.id}`, // Virtual ID
                    real_id: n.id,
                    type: 'notice',
                    title: n.title,
                    message: n.content, // Map content to message
                    is_read: true, // Notices are considered 'read' or 'info only'
                    created_at: n.created_at,
                    is_virtual: true
                }));
            }
        }

        // 3. Merge and Sort
        const combined = [...inboxData, ...noticesData].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

        res.json(combined);

    } catch (error) {
        console.error('Get Inbox Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Mark as Read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Skip virtual notices (fetched from notices table)
        if (id && id.startsWith('notice_')) {
            return res.json({ message: 'Notice read (locally)' });
        }

        const { data, error } = await supabase
            .from('inbox')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', user_id) // Security check
            .select();

        if (error) throw error;
        res.json({ message: 'Marked as read', data });

    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Mark All as Read
exports.markAllAsRead = async (req, res) => {
    try {
        const user_id = req.user.id;

        const { error } = await supabase
            .from('inbox')
            .update({ is_read: true })
            .eq('user_id', user_id);

        if (error) throw error;
        res.json({ message: 'All marked as read' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Internal Helper to Create Message (to be used by other controllers)
exports.createInboxMessage = async (userId, type, title, message) => {
    try {
        const { error } = await supabase
            .from('inbox')
            .insert([{
                user_id: userId,
                type,
                title,
                message
            }]);

        if (error) console.error('Error creating inbox message:', error);
    } catch (err) {
        console.error('Error creating inbox message:', err);
    }
};
