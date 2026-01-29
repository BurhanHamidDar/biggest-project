const supabase = require('../config/supabaseClient');
const { sendPush, sendPushList } = require('../utils/expoPush');

// Register Token
exports.registerToken = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { token, device_name } = req.body;

        if (!token) return res.status(400).json({ error: 'Token is required' });

        // Upsert Token
        const { data, error } = await supabase
            .from('push_tokens')
            .upsert([{
                user_id,
                token,
                device_name,
                updated_at: new Date()
            }], { onConflict: 'user_id, token' }) // Unique composite key
            .select()
            .single();

        if (error) throw error;
        console.log(`[Notification] Token registered for User ${user_id}: ${token.substring(0, 20)}...`);
        res.json({ message: 'Token registered', data });

    } catch (error) {
        console.error('Register Token Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Send Test Notification (Admin/Debug)
exports.sendTestNotification = async (req, res) => {
    try {
        const { user_id, title, body } = req.body;

        // Get Token
        const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token')
            .eq('user_id', user_id);

        if (!tokens || tokens.length === 0) return res.status(404).json({ error: 'No tokens for user' });

        const tokenList = tokens.map(t => t.token);
        await sendPushList(tokenList, title || 'Test Notification', body || 'This is a test message.');

        res.json({ message: `Sent to ${tokenList.length} devices.` });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send Notification to a specific user (internal or external use)
exports.sendNotificationToUser = async (user_id, title, body, data = {}) => {
    try {
        // Get Token
        const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token')
            .eq('user_id', user_id);

        if (!tokens || tokens.length === 0) {
            console.log(`No tokens found for user ${user_id}`);
            return false;
        }

        const tokenList = tokens.map(t => t.token);
        await sendPushList(tokenList, title, body, data);
        return true;

    } catch (error) {
        console.error('Send Notification Error:', error);
        return false;
    }
};
