/**
 * src/api/middleware/session.js — Production-hardened session setup
 *
 * Cookie flags for Vercel dashboard ↔ Railway API cross-site auth:
 *   secure: true     — HTTPS only (required when sameSite='none')
 *   sameSite: 'none' — allows cookies on cross-site requests
 *   httpOnly: true   — JS cannot read the cookie (XSS protection)
 *
 * Session name: 'kythia.sid' (avoids fingerprinting default 'connect.sid')
 */

'use strict';

const session    = require('express-session');
const passport   = require('passport');
const MongoStore = require('connect-mongo');
const log        = require('@utils/logger');
const { getConfig } = require('@config/index');

function setupSession(app) {
    log.section('Session');

    const cfg          = getConfig();
    const isProduction = cfg.env === 'production';

    log.info('Session configuration', {
        env:        cfg.env,
        production: isProduction,
        mongoUri:   cfg.db.mongoUri ? 'SET ✔' : 'MISSING (using MemoryStore) ⚠',
        secret:     cfg.api.sessionSecret !== 'kythia-session-secret-change-in-production' ? 'SET ✔' : 'USING FALLBACK ⚠',
    });

    // ── Session store ────────────────────────────────────────────────────────
    let store;
    if (cfg.db.mongoUri) {
        try {
            store = MongoStore.create({
                mongoUrl:       cfg.db.mongoUri,
                collectionName: 'sessions',
                ttl:            7 * 24 * 60 * 60,
                autoRemove:     'native',
                touchAfter:     24 * 3600,
                crypto: {
                    secret: cfg.api.sessionSecret,
                },
            });

            store.on('error', (err) => {
                log.error('MongoStore error (falling back to in-memory for this request)', err);
            });

            log.success('Session store: MongoDB (connect-mongo)');
        } catch (err) {
            log.error('Failed to create MongoStore — using MemoryStore', err);
            store = undefined;
        }
    } else {
        log.warn('No MONGODB_URI — sessions will not survive restart');
    }

    // ── Session config ───────────────────────────────────────────────────────
    app.use(session({
        name:              'kythia.sid',
        secret:            cfg.api.sessionSecret,
        resave:            false,
        saveUninitialized: false,
        rolling:           true,
        store,
        cookie: {
            maxAge:   7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure:   isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path:     '/',
        },
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    log.success('Session middleware ready');
}

module.exports = { setupSession };
