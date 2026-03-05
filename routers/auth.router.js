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

// Endpoint to verify if OAuth session was successful
router.get('/verify-session', (req, res) => {
  console.log('--- Verify Session Endpoint ---');
  console.log('Session ID:', req.sessionID);
  console.log('Session userId:', req.session.userId);
  
  if (req.session.userId) {
    return res.json({
      authenticated: true,
      message: 'Session verified from OAuth'
    });
  }
  
  return res.status(401).json({
    authenticated: false,
    message: 'No session found'
  });
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
    console.log('Authenticated:', !!req.user);
    console.log('User ID:', req.user?._id || 'None');
    console.log('User Email:', req.user?.email || 'None');
    console.log('Session ID:', req.sessionID);
    console.log('Session Content:', JSON.stringify(req.session));

    if (req.user?._id) {
      req.session.userId = req.user._id;
      req.session.userEmail = req.user.email;
      
      // Explicitly save the session before redirecting to ensure persistence
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect(`${FRONTEND_URL}/signup/login?error=session_save_failed`);
        }
        
        console.log('✅ Session saved successfully');
        console.log('Session ID being sent with redirect:', req.sessionID);
        
        // Redirect to dashboard - the session cookie will be included in the response
        res.redirect(`${FRONTEND_URL}/dashboard`);
      });
    } else {
      console.warn('❌ No user found in callback');
      res.redirect(`${FRONTEND_URL}/signup/login?error=no_user`);
    }
  },
);

export default router;

