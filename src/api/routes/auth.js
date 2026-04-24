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
        if (data.expires < now) {
            pendingTokens.delete(token);
            console.log('🗑️ Expired token cleaned up');
        }
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
        console.log('📝 Discord OAuth successful for user:', profile.username);
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const guilds = await response.json();
        const manageableGuilds = Array.isArray(guilds)
            ? guilds.filter(g => (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20))
            : [];
        console.log('🏰 Found', manageableGuilds.length, 'manageable guilds');
        profile.guilds = manageableGuilds;
        return done(null, profile);
    } catch (err) {
        console.error('❌ Error fetching guilds:', err);
        profile.guilds = [];
        return done(null, profile);
    }
}));

// Step 1: Redirect to Discord OAuth
router.get('/discord', (req, res, next) => {
    console.log('🚀 Initiating Discord OAuth...');
    passport.authenticate('discord')(req, res, next);
});

// Step 2: Discord callback — generate a short-lived token and pass it to dashboard in URL
router.get('/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: `${process.env.DASHBOARD_URL || 'https://xyrox.vercel.app'}?error=auth_failed`
    }),
    (req, res) => {
        console.log('✅ Discord callback received for:', req.user.username);
        
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

        console.log('🎟️ Generated token:', token.substring(0, 10) + '...');
        console.log('📦 Stored tokens count:', pendingTokens.size);

        // Pass token to dashboard in URL — dashboard exchanges it for session
        const dashboardURL = process.env.DASHBOARD_URL || 'https://xyrox.vercel.app';
        console.log('↩️ Redirecting to dashboard with token');
        res.redirect(`${dashboardURL}?token=${token}`);
    }
);

// Step 3: Dashboard calls this with the token to exchange it for user data
router.get('/exchange', (req, res) => {
    const { token } = req.query;
    
    console.log('🔄 Exchange request received');
    console.log('🎟️ Token:', token ? token.substring(0, 10) + '...' : 'NONE');
    console.log('📦 Available tokens:', pendingTokens.size);
    console.log('🍪 Session ID:', req.sessionID);
    console.log('📋 Request origin:', req.get('origin'));
    console.log('🔐 Cookies:', req.headers.cookie);

    if (!token) {
        console.log('❌ No token provided');
        return res.status(400).json({ error: 'No token provided' });
    }

    const data = pendingTokens.get(token);

    if (!data) {
        console.log('❌ Token not found in store');
        console.log('📦 Current tokens:', Array.from(pendingTokens.keys()).map(t => t.substring(0, 10)));
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (data.expires < Date.now()) {
        console.log('❌ Token expired');
        pendingTokens.delete(token);
        return res.status(401).json({ error: 'Token expired' });
    }

    // Token is valid — delete it (one-time use) and save user to session
    pendingTokens.delete(token);
    console.log('✅ Token valid, deleting from store');
    
    req.session.user = data.user;
    req.session.guilds = data.guilds;
    
    console.log('💾 Saving session for user:', data.user.username);

    req.session.save((err) => {
        if (err) {
            console.error('❌ Session save error:', err);
            return res.status(500).json({ error: 'Session save failed', details: err.message });
        }
        console.log('✅ Session saved successfully');
        console.log('🍪 Session ID after save:', req.sessionID);
        console.log('👤 Session user:', req.session.user.username);
        
        // Send response with explicit headers
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.json({ 
            user: data.user, 
            guilds: data.guilds,
            sessionId: req.sessionID,
            debug: {
                sessionSaved: true,
                cookieSet: true
            }
        });
    });
});

// Step 4: Dashboard calls this on every load to check if still logged in
router.get('/user', (req, res) => {
    console.log('🔍 User check request');
    console.log('🍪 Session ID:', req.sessionID);
    console.log('👤 Session user:', req.session?.user?.username || 'NONE');
    console.log('📋 Session data exists:', !!req.session);
    console.log('🔐 Cookies:', req.headers.cookie);
    
    if (req.session && req.session.user) {
        console.log('✅ Valid session found for:', req.session.user.username);
        return res.json({
            user: req.session.user,
            guilds: req.session.guilds || [],
            debug: {
                sessionId: req.sessionID,
                sessionValid: true
            }
        });
    }
    
    console.log('❌ No valid session found');
    return res.status(401).json({ 
        error: 'Not authenticated',
        debug: {
            sessionId: req.sessionID,
            sessionExists: !!req.session,
            hasUser: !!req.session?.user
        }
    });
});

router.post('/logout', (req, res) => {
    console.log('👋 Logout request for:', req.session?.user?.username || 'unknown');
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        console.log('✅ Session destroyed');
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

export default router;
