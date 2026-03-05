import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} = process.env;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(null, false, { message: 'Google account has no email.' });
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              name: profile.displayName || 'Google User',
              email,
              password: await (await import('bcrypt')).default.hash(
                Math.random().toString(36).slice(-10),
                10,
              ),
              authProvider: 'google',
              authProviderId: profile.id,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
  console.log('✅ Google OAuth strategy registered successfully.');
} else {
  console.warn(
    '⚠️ Google OAuth strategy NOT registered. Missing env vars:',
    !GOOGLE_CLIENT_ID ? 'GOOGLE_CLIENT_ID' : '',
    !GOOGLE_CLIENT_SECRET ? 'GOOGLE_CLIENT_SECRET' : '',
    !GOOGLE_CALLBACK_URL ? 'GOOGLE_CALLBACK_URL' : '',
  );
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;

