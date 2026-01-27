const supabase = require('../config/supabaseClient');

const authMiddleware = async (req, res, next) => {
    try {
        // Allow CORS Preflight
        if (req.method === 'OPTIONS') {
            return next();
        }

        // --- PUBLIC ROUTES EXEMPTION ---
        // Add paths here that don't need authentication
        const publicPaths = ['/api/settings/public', '/api/health', '/api/transport/bus-live'];
        if (publicPaths.includes(req.path)) {
            return next();
        }
        // -------------------------------

        const authHeader = req.headers.authorization;
        // console.log(`[Auth] Method: ${req.method}, Path: ${req.path}`);

        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Fetch valid profile and role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[Auth] Profile Fetch Error:', profileError.message);
            // If profile is missing, we might still want to proceed but as a 'student' or restricted role
            // But for admin actions, this will cause 403.
        } else if (profile) {
            console.log(`[Auth] User ID: ${user.id}, Profile Found: YES, Role: ${profile.role}`);
        } else {
            console.warn(`[Auth] User ID: ${user.id} has NO PROFILE entry in 'profiles' table! Defaulting to 'student'.`);
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: profile?.role || 'student'
        };

        // --- GLOBAL SETTINGS ENFORCEMENT ---

        try {
            // 1. Check for Maintenance Mode (App Blocked)
            const { data: settings, error: settingsError } = await supabase.from('system_settings').select('app_blocked, maintenance_message').single();

            if (!settingsError && settings?.app_blocked && req.user.role !== 'admin') {
                return res.status(503).json({
                    blocked: true,
                    message: settings.maintenance_message || "System is under maintenance"
                });
            }

            // 2. Check for Disabled Account
            const { data: disabledEntry, error: disabledError } = await supabase.from('disabled_accounts').select('reason').eq('user_id', req.user.id).single();

            if (!disabledError && disabledEntry) {
                return res.status(403).json({
                    error: 'Account Disabled',
                    message: `Your account is disabled. Reason: ${disabledEntry.reason}. Contact administration.`
                });
            }
        } catch (settingsErr) {
            console.warn('[AuthMiddleware] Settings check failed (ignoring):', settingsErr.message);
            // We ignore errors here so we don't block the app if settings table is missing/broken
        }

        // -----------------------------------

        next();

    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(500).json({ error: 'Server error during auth' });
    }
};

module.exports = authMiddleware;
