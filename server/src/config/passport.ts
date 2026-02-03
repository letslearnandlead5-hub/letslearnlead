import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';

export const configurePassport = () => {
    // Only configure Google OAuth if credentials are provided
    if (process.env.GOOGLE_CLIENT_ID && 
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' &&
        process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret') {
        
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        // Extract email from Google profile
                        const email = profile.emails?.[0]?.value;
                        if (!email) {
                            return done(new Error('No email found in Google profile'), undefined);
                        }

                        // Check if user already exists
                        let user = await User.findOne({ email });

                        if (user) {
                            // User exists, return the user
                            return done(null, user);
                        }

                        // Create new user
                        user = await User.create({
                            name: profile.displayName,
                            email: email,
                            password: Math.random().toString(36).slice(-8), // Random password (user won't need it)
                            role: 'student',
                            profilePicture: profile.photos?.[0]?.value,
                        });

                        // Create welcome notification for new users
                        const { Notification } = await import('../models/Notification');
                        await Notification.create({
                            userId: user._id,
                            title: 'Welcome to Let\'s L-earn and Lead!',
                            message: 'Start your learning journey by exploring our courses and enrolling in the ones that interest you.',
                            type: 'info',
                        });

                        return done(null, user);
                    } catch (error) {
                        return done(error as Error, undefined);
                    }
                }
            )
        );
        console.log('✅ Google OAuth configured');
    } else {
        console.log('⚠️  Google OAuth not configured - Google login will be disabled');
    }
};
