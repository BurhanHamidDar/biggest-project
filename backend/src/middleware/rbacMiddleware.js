/**
 * Restrict access to specific roles.
 * Usage: router.delete('/:id', authMiddleware, restrictTo('admin'), controller.delete);
 */
exports.restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is set by authMiddleware
        // Debug Log
        // console.log(`[RBAC] User Role: ${req.user?.role}, Allowed: ${allowedRoles}, Path: ${req.originalUrl}`);

        if (!req.user || !allowedRoles.includes(req.user.role)) {
            console.warn(`[RBAC] Access Denied. User Role: ${req.user?.role}, Required: ${allowedRoles}`);
            return res.status(403).json({ error: 'You do not have permission to perform this action' });
        }
        next();
    };
};
