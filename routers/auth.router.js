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
    if (req.user?._id) {
      req.session.userId = req.user._id;
    }
    res.redirect(`${FRONTEND_URL}/dashboard`);
  },
);

export default router;

