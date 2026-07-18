import passport from 'passport'
import { Strategy as GoogleStrategy, Profile as googleProfile, VerifyCallback } from 'passport-google-oauth20'
import { Strategy as GitHubStrategy, Profile as ghProfile } from 'passport-github2'
import User from '../models/user'

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    callbackURL: `${process.env.BASE_URL}/api/auth/github/callback`,
    scope: ['user:email', 'read:user'],
    userAgent: 'library-api'
},
    async (accessToken: string, refreshToken: string, profile: ghProfile, cb: Function) => {
        try {
            console.log(profile);
            console.log(profile.emails);
            let user = await User.findOne({ GitHubId: profile.id });
            if (user) return cb(null, { userId: user._id.toString(), isAdmin: user.isAdmin });
            const email = profile.emails?.[0]?.value;
            if (!email) return cb(new Error('No email returned from GitHub'));

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                await User.findByIdAndUpdate(existingUser._id, {
                    $addToSet: { authProviders: 'github' },
                    GitHubId: profile.id
                });

                return cb(null, { userId: existingUser._id.toString(), isAdmin: existingUser.isAdmin });
            }

            let username = profile.username ?? email.split('@')[0] as string;

            while (await User.exists({ username })) {
                username += Math.floor(Math.random() * 10000);
            }

            const firstName = profile.name?.givenName ?? profile.displayName?.split(' ')[0] ?? username;
            const lastName = profile.name?.familyName ?? profile.displayName?.split(' ').slice(1).join(' ') ?? '';

            user = await User.create({
                GitHubId: profile.id,
                username,
                email,
                firstName,
                lastName,
                isAdmin: false,
                authProviders: ['github']
            });
            cb(null, { userId: user._id.toString(), isAdmin: user.isAdmin });
        } catch (err) {
            console.log(err);
            cb(err);
        }
    }
));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
    scope: ['profile', 'email']
},
    async (accessToken: string, refreshToken: string, profile: googleProfile, cb: VerifyCallback) => {
        try {
            let user = await User.findOne({ GoogleId: profile.id });
            if (user) return cb(null, { userId: user._id.toString(), isAdmin: user.isAdmin });

            const email = profile.emails?.[0]?.value;
            if (!email) return cb(new Error('No email returned from Google'));

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                await User.findByIdAndUpdate(existingUser._id, {
                    $addToSet: { authProviders: 'google' },
                    GoogleId: profile.id
                });

                return cb(null, { userId: existingUser._id.toString(), isAdmin: existingUser.isAdmin });
            }

            let username = email.split('@')[0] as string;

            while (await User.exists({ username })) {
                username += Math.floor(Math.random() * 10000);
            }

            const firstName = profile.name?.givenName ?? profile.displayName?.split(' ')[0] ?? username;
            const lastName = profile.name?.familyName ?? profile.displayName?.split(' ').slice(1).join(' ') ?? '';

            user = await User.create({
                GoogleId: profile.id,
                username,
                email,
                firstName,
                lastName,
                isAdmin: false,
                authProviders: ['google']
            });
            cb(null, { userId: user._id.toString(), isAdmin: user.isAdmin });
        } catch (err) {
            cb(err);
        }
    }
));
