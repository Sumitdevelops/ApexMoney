import express from 'express';
import passport from '../config/passport.js';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://apexmoney.netlify.app';

// Guard: return a clear error if Google OAuth is not configured
const requireGoogleOAuth = (req, res, next) => {
  if (!passport._strategy('google')) {
    return res.status(503).json({
      error: 'Google OAuth is not configured. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL environment variables on the server.',
    });
  }
  next();
};

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auth router is loaded' });
});

router.get(
  '/google',
  requireGoogleOAuth,
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/signup/login`,
    session: true,
  }),
  (req, res) => {
    console.log('--- Google OAuth Callback Debug ---');
    console.log('Authenticated User:', req.user?._id || 'None');
    console.log('Session ID:', req.sessionID);

    if (req.user?._id) {
      req.session.userId = req.user._id;
      // Explicitly save the session before redirecting to ensure persistence
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect(`${FRONTEND_URL}/signup/login?error=session_save_failed`);
        }
        console.log('Session saved successfully for userId:', req.user._id);
        res.redirect(`${FRONTEND_URL}/dashboard`);
      });
    } else {
      console.warn('No user found in callback, redirecting to login.');
      res.redirect(`${FRONTEND_URL}/signup/login`);
    }
  },
);

export default router;

