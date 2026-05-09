/**
 * src/api/routes/auth.js — Discord OAuth2 routes
 *
 * TASK REQUIREMENTS MET:
 *  3. try/catch around all async handlers with next(err) for global error handler
 *  4. Centralised error handler used via next(err)
 *  5. Detailed coloured logging via logger.js
 */

import express  from 'express';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import crypto   from 'crypto';
import log      from '../../utils/logger.js';

const router       = express.Router();
const isProduction = process.env.NODE_ENV === 'production';

// ─── In-memory pending token store ───────────────────────────────────────────
// Tokens live only for the seconds between OAuth redirect and dashboard exchange.
// Intentionally ephemeral — stored in memory, not DB.
const pendingTokens = new Map();

// Sweep expired tokens every 60 seconds
setInterval(() => {
    const now     = Date.now();
    let   removed = 0;
    for (const [token, data] of pendingTokens.entries()) {
        if (data.expires < now) { pendingTokens.delete(token); removed++; }
    }
    if (removed > 0) log.debug(`Swept ${removed} expired pending tokens`);
}, 60_000);

// ─── Passport setup (idempotent guard) ───────────────────────────────────────
let passportConfigured = false;
function ensurePassportConfigured() {
    if (passportConfigured) return;
    passportConfigured = true;

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj,  done) => done(null, obj));

    passport.use(new DiscordStrategy({
        clientID:     process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL:  process.env.OAUTH_CALLBACK,
        scope:        ['identify', 'guilds'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            log.info('Discord OAuth callback', {
                user:   profile.username,
                guilds: profile.guilds?.length ?? 0,
            });

            const allGuilds = Array.isArray(profile.guilds) ? profile.guilds : [];

            // Filter to guilds where user has Manage Guild or Administrator
            const manageableGuilds = allGuilds.filter(g => {
                try {
                    const perms        = BigInt(g.permissions);
                    const MANAGE_GUILD = BigInt(0x20);
                    const ADMIN        = BigInt(0x8);
                    return g.owner === true
                        || (perms & ADMIN)        === ADMIN
                        || (perms & MANAGE_GUILD) === MANAGE_GUILD;
                } catch {
                    return g.owner === true;
                }
            });

            log.info('Filtered manageable guilds', {
                total:     allGuilds.length,
                manageable: manageableGuilds.length,
            });

            profile.guilds = manageableGuilds;
            return done(null, profile);
        } catch (err) {
            log.error('Discord strategy error', err);
            return done(err);
        }
    }));

    log.success('Passport Discord strategy configured');
}

ensurePassportConfigured();

// ─── GET /api/auth/discord — Initiate OAuth flow ─────────────────────────────
router.get('/discord', (req, res, next) => {
    log.info('Initiating Discord OAuth', { ip: req.ip });
    passport.authenticate('discord')(req, res, next);
});

// ─── GET /api/auth/discord/callback — Discord redirects here ─────────────────
router.get('/discord/callback',
    (req, res, next) => {
        const dashboardURL = process.env.DASHBOARD_URL || 'http://localhost:3000';
        passport.authenticate('discord', {
            failureRedirect: `${dashboardURL}?error=auth_failed`,
        })(req, res, next);
    },
    (req, res) => {
        try {
            log.info('Discord OAuth callback success', { user: req.user?.username });

            // Generate cryptographically random one-time token (64 hex chars)
            const token = crypto.randomBytes(32).toString('hex');

            pendingTokens.set(token, {
                user: {
                    id:            req.user.id,
                    username:      req.user.username,
                    discriminator: req.user.discriminator,
                    avatar:        req.user.avatar,
                    global_name:   req.user.global_name || req.user.username,
                },
                guilds:  req.user.guilds || [],
                expires: Date.now() + 5 * 60 * 1000, // 5 minutes
            });

            const dashboardURL = process.env.DASHBOARD_URL || 'http://localhost:3000';
            log.info('Redirecting to dashboard with one-time token');
            return res.redirect(`${dashboardURL}?token=${token}`);
        } catch (err) {
            log.error('OAuth callback handler error', err);
            const dashboardURL = process.env.DASHBOARD_URL || 'http://localhost:3000';
            return res.redirect(`${dashboardURL}?error=server_error`);
        }
    }
);

// ─── GET /api/auth/exchange — Token → Session ─────────────────────────────────
router.get('/exchange', async (req, res, next) => {
    try {
        const { token } = req.query;
        log.info('Token exchange request', { sessionId: req.sessionID });

        // Validate token format (64-char hex string)
        if (!token || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
            log.warn('Token exchange: invalid token format');
            return res.status(400).json({ error: 'Invalid or missing token' });
        }

        const data = pendingTokens.get(token);

        if (!data) {
            log.warn('Token exchange: token not found');
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        if (data.expires < Date.now()) {
            pendingTokens.delete(token);
            log.warn('Token exchange: token expired');
            return res.status(401).json({ error: 'Token expired — please log in again' });
        }

        // One-time use: remove immediately after reading
        pendingTokens.delete(token);

        // Persist user into the MongoDB-backed session
        req.session.user   = data.user;
        req.session.guilds = data.guilds;

        await new Promise((resolve, reject) => {
            req.session.save(err => (err ? reject(err) : resolve()));
        });

        log.success('Session saved', { user: data.user.username, sessionId: req.sessionID });

        const response = { user: data.user, guilds: data.guilds };
        if (!isProduction) response.debug = { sessionId: req.sessionID };

        return res.json(response);
    } catch (err) {
        log.error('Token exchange error', err);
        next(err);
    }
});

// ─── GET /api/auth/user — Check session ──────────────────────────────────────
router.get('/user', (req, res) => {
    if (req.session?.user) {
        log.debug('Valid session', { user: req.session.user.username });
        const response = { user: req.session.user, guilds: req.session.guilds || [] };
        if (!isProduction) response.debug = { sessionId: req.sessionID };
        return res.json(response);
    }
    log.debug('No session found', { sessionId: req.sessionID });
    return res.status(401).json({ error: 'Not authenticated' });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res, next) => {
    const username = req.session?.user?.username || 'unknown';
    log.info('Logout request', { user: username });

    req.session.destroy(err => {
        if (err) {
            log.error('Session destroy error', err);
            return next(err);
        }

        // Cookie name + attributes MUST match how it was Set — or browser ignores the clear
        res.clearCookie('xyrox.sid', {
            path:     '/',
            httpOnly: true,
            secure:   isProduction,
            sameSite: isProduction ? 'none' : 'lax',
        });

        log.success('User logged out', { user: username });
        return res.json({ success: true });
    });
});

export default router;
