import express from 'express';
import crypto from 'crypto';
import passport from '../config/passport.js';
import { User } from '../models/user.model.js';

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
    failureRedirect: `${FRONTEND_URL}/signup/login?error=google_auth_failed`,
    session: false, // Don't rely on session cookies for cross-origin
  }),
  async (req, res) => {
    try {
      if (!req.user?._id) {
        console.warn('No user found in Google OAuth callback');
        return res.redirect(`${FRONTEND_URL}/signup/login?error=no_user`);
      }

      // Generate a one-time token for the frontend to exchange
      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

      // Store token on the user document
      await User.findByIdAndUpdate(req.user._id, {
        oauthToken: token,
        oauthTokenExpires: tokenExpires,
      });

      console.log('Google OAuth: token generated for user', req.user.email);

      // Redirect to frontend with the token in the URL
      res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.redirect(`${FRONTEND_URL}/signup/login?error=server_error`);
    }
  },
);

// Exchange one-time token for user data + session
router.post('/exchange-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Find user with this token that hasn't expired
    const user = await User.findOne({
      oauthToken: token,
      oauthTokenExpires: { $gt: new Date() },
    }).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Clear the token so it can't be reused
    await User.findByIdAndUpdate(user._id, {
      oauthToken: null,
      oauthTokenExpires: null,
    });

    // Set the session for future requests
    req.session.userId = user._id;

    console.log('Token exchanged successfully for user:', user.email);

    return res.status(200).json({ user, message: 'Authenticated successfully' });
  } catch (err) {
    console.error('Token exchange error:', err);
    return res.status(500).json({ message: 'Token exchange failed' });
  }
});

export default router;

