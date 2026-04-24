import express from 'express';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import crypto from 'crypto';

const router = express.Router();

// In-memory token store: token -> { user, guilds, expires }
// Tokens are short-lived (5 min) — just long enough to pass to the dashboard
const pendingTokens = new Map();

// Clean up expired tokens every minute
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of pendingTokens.entries()) {
        if (data.expires < now) pendingTokens.delete(token);
    }
}, 60_000);

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
        const manageableGuilds = Array.isArray(guilds)
            ? guilds.filter(g => (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20))
            : [];
        profile.guilds = manageableGuilds;
        return done(null, profile);
    } catch (err) {
        console.error('Error fetching guilds:', err);
        profile.guilds = [];
        return done(null, profile);
    }
}));

// Step 1: Redirect to Discord OAuth
router.get('/discord', passport.authenticate('discord'));

// Step 2: Discord callback — generate a short-lived token and pass it to dashboard in URL
router.get('/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: `${process.env.DASHBOARD_URL || 'https://xyrox.vercel.app'}?error=auth_failed`
    }),
    (req, res) => {
        // Generate a random one-time token
        const token = crypto.randomBytes(32).toString('hex');

        // Store user data against token (expires in 5 minutes)
        pendingTokens.set(token, {
            user: {
                id: req.user.id,
                username: req.user.username,
                discriminator: req.user.discriminator,
                avatar: req.user.avatar
            },
            guilds: req.user.guilds || [],
            expires: Date.now() + 5 * 60 * 1000
        });

        // Pass token to dashboard in URL — dashboard exchanges it for session
        const dashboardURL = process.env.DASHBOARD_URL || 'https://xyrox.vercel.app';
        res.redirect(`${dashboardURL}?token=${token}`);
    }
);

// Step 3: Dashboard calls this with the token to exchange it for user data
router.get('/exchange', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'No token provided' });
    }

    const data = pendingTokens.get(token);

    if (!data) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (data.expires < Date.now()) {
        pendingTokens.delete(token);
        return res.status(401).json({ error: 'Token expired' });
    }

    // Token is valid — delete it (one-time use) and save user to session
    pendingTokens.delete(token);
    req.session.user = data.user;
    req.session.guilds = data.guilds;

    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Session save failed' });
        }
        return res.json({ user: data.user, guilds: data.guilds });
    });
});

// Step 4: Dashboard calls this on every load to check if still logged in
router.get('/user', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({
            user: req.session.user,
            guilds: req.session.guilds || []
        });
    }
    return res.status(401).json({ error: 'Not authenticated' });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

export default router;
