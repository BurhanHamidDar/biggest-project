const supabase = require('../config/supabaseClient');

// --- SYSTEM SETTINGS ---

exports.getSettings = async (req, res) => {
    try {
        // Fetch the singleton row
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .limit(1)
            .single();

        if (error) throw error;

        // If table empty (shouldn't happen due to init script, but safe fallback)
        if (!data) return res.json({});

        res.json(data);
    } catch (error) {
        console.error('Get Settings Error:', error);
        // Fallback for public/maintenance check if DB fails? 
        res.status(500).json({ error: error.message });
    }
};

exports.getPublicSettings = async (req, res) => {
    try {
        // Limited data for Login/Splash screens
        const { data, error } = await supabase
            .from('system_settings')
            .select('app_blocked, maintenance_message, force_password_change')
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body;

        // We assume only 1 row exists, so we update "all" or ID based.
        // Better to get the ID first or update where true.
        // But since it's a singleton, we can just update the first row we find or known ID.
        // Let's assume we fetch the ID first to be safe, or just update `id IS NOT NULL`.

        // Actually, easiest is to get the ID from the existing row
        const { data: current } = await supabase.from('system_settings').select('id').single();

        if (!current) {
            // Create if missing
            const { data, error } = await supabase.from('system_settings').insert([updates]).select().single();
            if (error) throw error;
            return res.json(data);
        }

        const { data, error } = await supabase
            .from('system_settings')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', current.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// --- DISABLED ACCOUNTS ---

exports.getDisabledAccounts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('disabled_accounts')
            .select(`
                *,
                profiles!user_id (full_name, email, role, avatar_url),
                admin:profiles!disabled_by (full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Get Disabled Accounts Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.disableAccount = async (req, res) => {
    try {
        const { user_id, reason } = req.body;
        const disabled_by = req.user.id;

        if (!user_id || !reason) {
            return res.status(400).json({ error: 'User ID and Reason are required' });
        }

        // Prevent disabling yourself
        if (user_id === disabled_by) {
            return res.status(400).json({ error: 'You cannot disable your own account' });
        }

        const { data, error } = await supabase
            .from('disabled_accounts')
            .insert([{ user_id, reason, disabled_by }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') return res.status(400).json({ error: 'User is already disabled' });
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Disable Account Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.enableAccount = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const { error } = await supabase
            .from('disabled_accounts')
            .delete()
            .eq('user_id', user_id);

        if (error) throw error;

        res.json({ message: 'Account enabled successfully' });
    } catch (error) {
        console.error('Enable Account Error:', error);
        res.status(500).json({ error: error.message });
    }
};
