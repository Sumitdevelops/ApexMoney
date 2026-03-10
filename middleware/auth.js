export const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        console.warn(`[Auth] 401 on ${req.method} ${req.originalUrl} — sessionID: ${req.sessionID}, hasSession: ${!!req.session}, userId: ${req.session?.userId}`);
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    next();
};
