import express from 'express';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import crypto from 'crypto';

const router = express.Router();

// Token store: one-time tokens for OAuth → Dashboard handoff
// Format: token -> { user, guilds, expires }
const authTokens = new Map();

// Cleanup expired tokens every 2 minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of authTokens.entries()) {
        if (data.expires < now) {
            authTokens.delete(token);
        }
    }
}, 120000);

// Passport serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Discord OAuth Strategy
passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.OAUTH_CALLBACK,
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Fetch user's guilds
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch guilds:', response.status);
            profile.guilds = [];
            return done(null, profile);
        }

        const guilds = await response.json();
        
        // Filter guilds where user has MANAGE_GUILD permission (0x20)
        const manageableGuilds = Array.isArray(guilds)
            ? guilds.filter(guild => {
                try {
                    return (BigInt(guild.permissions) & BigInt(0x20)) === BigInt(0x20);
                } catch {
                    return false;
                }
            })
            : [];

        profile.guilds = manageableGuilds;
        return done(null, profile);
        
    } catch (error) {
        console.error('Error in Discord strategy:', error);
        profile.guilds = [];
        return done(null, profile);
    }
}));

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Step 1: User clicks "Login" → redirect to Discord OAuth
router.get('/discord', passport.authenticate('discord'));

// Step 2: Discord redirects back after approval
router.get('/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: `${process.env.DASHBOARD_URL || 'https://xyrox.vercel.app'}?error=auth_failed`
    }),
    (req, res) => {
        try {
            // Generate a cryptographically secure one-time token
            const token = crypto.randomBytes(32).toString('hex');

            // Store user data against this token (expires in 5 minutes)
            authTokens.set(token, {
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    discriminator: req.user.discriminator,
                    avatar: req.user.avatar,
                    global_name: req.user.global_name || req.user.username
                },
                guilds: req.user.guilds || [],
                expires: Date.now() + 5 * 60 * 1000
            });

            // Redirect to dashboard with token in URL
            const dashboardURL = process.env.DASHBOARD_URL || 'https://xyrox.vercel.app';
            res.redirect(`${dashboardURL}?token=${token}`);
            
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect(`${process.env.DASHBOARD_URL || 'https://xyrox.vercel.app'}?error=server_error`);
        }
    }
);

// Step 3: Dashboard exchanges one-time token for user data + session
router.get('/exchange', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'No token provided' });
    }

    const data = authTokens.get(token);

    if (!data) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (data.expires < Date.now()) {
        authTokens.delete(token);
        return res.status(401).json({ error: 'Token expired' });
    }

    // Token is valid — consume it (one-time use only)
    authTokens.delete(token);

    // Save user to session
    req.session.user = data.user;
    req.session.guilds = data.guilds;

    // Force session save before responding
    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Failed to create session' });
        }
        
        return res.json({
            user: data.user,
            guilds: data.guilds
        });
    });
});

// Step 4: Check if user is logged in (used on page load/refresh)
router.get('/user', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({
            user: req.session.user,
            guilds: req.session.guilds || []
        });
    }
    
    return res.status(401).json({ error: 'Not authenticated' });
});

// Logout endpoint
router.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.clearCookie('connect.sid');
            return res.json({ success: true });
        });
    } else {
        res.json({ success: true });
    }
});

// Health check
router.get('/status', (req, res) => {
    res.json({
        authenticated: !!(req.session && req.session.user),
        tokenCount: authTokens.size
    });
});

export default router;
