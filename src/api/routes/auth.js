import express from 'express';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';

const router = express.Router();

// Serialize/Deserialize — store the full profile so guilds survive restarts
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.OAUTH_CALLBACK,
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const guilds = await response.json();

        // Filter guilds where user has MANAGE_GUILD permission (0x20)
        const manageableGuilds = Array.isArray(guilds)
            ? guilds.filter(g => (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20))
            : [];

        profile.guilds = manageableGuilds;
        return done(null, profile);
    } catch (err) {
        console.error('Error fetching guilds in strategy:', err);
        profile.guilds = [];
        return done(null, profile);
    }
}));

// Step 1: Redirect user to Discord OAuth
router.get('/discord', passport.authenticate('discord'));

// Step 2: Discord redirects back here after user approves
router.get('/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: `${process.env.DASHBOARD_URL || 'https://xyrox.vercel.app'}?error=auth_failed`
    }),
    (req, res) => {
        // Login succeeded — session is saved, redirect to dashboard
        // ?login=1 signals the React app to re-fetch the user immediately
        const dashboardURL = process.env.DASHBOARD_URL || 'https://xyrox.vercel.app';
        res.redirect(`${dashboardURL}?login=1`);
    }
);

// Step 3: Dashboard calls this to check if user is logged in
router.get('/user', (req, res) => {
    // req.isAuthenticated() checks the session cookie
    if (req.isAuthenticated() && req.user) {
        return res.json({
            user: {
                id: req.user.id,
                username: req.user.username,
                discriminator: req.user.discriminator,
                avatar: req.user.avatar
            },
            guilds: req.user.guilds || []
        });
    }
    // Not authenticated — return 401 (dashboard will show login page)
    return res.status(401).json({ error: 'Not authenticated' });
});

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.json({ success: true });
        });
    });
});

export default router;
