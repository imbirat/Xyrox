/**
 * src/api/routes/auth.js — Discord OAuth2 routes
 *
 * Flow:
 *  1. GET /api/auth/discord          → redirect to Discord OAuth
 *  2. GET /api/auth/discord/callback → Discord redirects here
 *  3. GET /api/auth/exchange?token=  → one-time token → session
 *  4. GET /api/auth/user             → check current session
 *  5. POST /api/auth/logout          → destroy session
 *
 * Uses a short-lived in-memory token store to bridge the OAuth redirect
 * with the Vercel dashboard cross-site fetch.
 */

'use strict';

const express       = require('express');
const passport      = require('passport');
const { Strategy }  = require('passport-discord');
const crypto        = require('crypto');
const log           = require('@utils/logger');
const { getConfig } = require('@config/index');

const router       = express.Router();
const cfg          = getConfig();
const isProduction = cfg.env === 'production';

// ─── Pending token store (in-memory, one-time use) ───────────────────────────
const pendingTokens = new Map();

setInterval(() => {
    const now = Date.now();
    let removed = 0;
    for (const [token, data] of pendingTokens.entries()) {
        if (data.expires < now) { pendingTokens.delete(token); removed++; }
    }
    if (removed > 0) log.debug(`Swept ${removed} expired OAuth tokens`);
}, 60_000);

// ─── Passport setup (idempotent) ─────────────────────────────────────────────
let passportConfigured = false;

function ensurePassport() {
    if (passportConfigured) return;
    passportConfigured = true;

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done)  => done(null, obj));

    passport.use(new Strategy({
        clientID:     cfg.bot.clientId,
        clientSecret: cfg.api.clientSecret,
        callbackURL:  cfg.api.oauthCallback,
        scope:        ['identify', 'guilds'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const allGuilds = Array.isArray(profile.guilds) ? profile.guilds : [];

            const manageable = allGuilds.filter((g) => {
                try {
                    const perms  = BigInt(g.permissions);
                    const MANAGE = BigInt(0x20);
                    const ADMIN  = BigInt(0x8);
                    return g.owner || (perms & ADMIN) === ADMIN || (perms & MANAGE) === MANAGE;
                } catch {
                    return g.owner === true;
                }
            });

            log.info('OAuth callback success', {
                user:      profile.username,
                total:     allGuilds.length,
                manageable: manageable.length,
            });

            profile.guilds = manageable;
            return done(null, profile);
        } catch (err) {
            log.error('Discord strategy error', err);
            return done(err);
        }
    }));

    log.success('Passport Discord strategy configured');
}

ensurePassport();

// ─── GET /api/auth/discord ────────────────────────────────────────────────────
router.get('/discord', (req, res, next) => {
    log.info('Initiating Discord OAuth', { ip: req.ip });
    passport.authenticate('discord')(req, res, next);
});

// ─── GET /api/auth/discord/callback ──────────────────────────────────────────
router.get('/discord/callback',
    (req, res, next) => {
        passport.authenticate('discord', {
            failureRedirect: `${cfg.api.dashboardUrl}?error=auth_failed`,
        })(req, res, next);
    },
    (req, res) => {
        try {
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
                expires: Date.now() + 5 * 60 * 1000,
            });

            log.info('Redirecting to dashboard with one-time token', { user: req.user.username });
            return res.redirect(`${cfg.api.dashboardUrl}?token=${token}`);
        } catch (err) {
            log.error('OAuth callback error', err);
            return res.redirect(`${cfg.api.dashboardUrl}?error=server_error`);
        }
    },
);

// ─── GET /api/auth/exchange ───────────────────────────────────────────────────
router.get('/exchange', async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
            return res.status(400).json({ error: 'Invalid or missing token' });
        }

        const data = pendingTokens.get(token);

        if (!data) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        if (data.expires < Date.now()) {
            pendingTokens.delete(token);
            return res.status(401).json({ error: 'Token expired — please log in again' });
        }

        pendingTokens.delete(token); // One-time use

        req.session.user   = data.user;
        req.session.guilds = data.guilds;

        await new Promise((resolve, reject) => {
            req.session.save((err) => (err ? reject(err) : resolve()));
        });

        log.success('Session saved', { user: data.user.username });

        const response = { user: data.user, guilds: data.guilds };
        if (!isProduction) response.debug = { sessionId: req.sessionID };

        return res.json(response);
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/auth/user ───────────────────────────────────────────────────────
router.get('/user', (req, res) => {
    if (req.session?.user) {
        const response = { user: req.session.user, guilds: req.session.guilds || [] };
        if (!isProduction) response.debug = { sessionId: req.sessionID };
        return res.json(response);
    }
    return res.status(401).json({ error: 'Not authenticated' });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res, next) => {
    const username = req.session?.user?.username || 'unknown';
    log.info('Logout', { user: username });

    req.session.destroy((err) => {
        if (err) { log.error('Session destroy error', err); return next(err); }

        res.clearCookie('kythia.sid', {
            path:     '/',
            httpOnly: true,
            secure:   isProduction,
            sameSite: isProduction ? 'none' : 'lax',
        });

        log.success('User logged out', { user: username });
        return res.json({ success: true });
    });
});

module.exports = router;
