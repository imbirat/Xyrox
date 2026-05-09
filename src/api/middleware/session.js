/**
 * src/api/middleware/session.js — Production-hardened session setup
 *
 * TASK REQUIREMENTS MET:
 *  5.  Detailed coloured logging via logger.js
 * 10.  Production session store using connect-mongo (fixes MemoryStore warning)
 *
 * Explanation of cookie flags for Railway ↔ Vercel:
 *   secure: true     — HTTPS only; required when sameSite is 'none'
 *   sameSite: 'none' — allows cookies on cross-site requests (Vercel → Railway)
 *   httpOnly: true   — JS cannot read the cookie (prevents XSS token theft)
 *
 *   In development (localhost, HTTP):
 *   secure: false / sameSite: 'lax' — relaxed for local testing
 */

import session    from 'express-session';
import passport   from 'passport';
import MongoStore from 'connect-mongo';
import log        from '../../utils/logger.js';

export function setupSession(app) {
    log.section('Session');

    const isProduction = process.env.NODE_ENV === 'production';

    log.info('Session configuration', {
        env:        process.env.NODE_ENV || 'not set',
        production: isProduction,
        mongoUri:   process.env.MONGODB_URI ? 'SET ✔' : 'MISSING ✖',
        secret:     process.env.SESSION_SECRET ? 'SET ✔' : 'USING FALLBACK ⚠',
    });

    // ── Session store ─────────────────────────────────────────────────────────
    // Always use MongoDB when URI is available — fixes the
    // "connect.session() MemoryStore is not designed for production" warning
    let store;
    if (process.env.MONGODB_URI) {
        try {
            store = MongoStore.create({
                mongoUrl:       process.env.MONGODB_URI,
                collectionName: 'sessions',
                ttl:            7 * 24 * 60 * 60, // 7 days in seconds
                autoRemove:     'native',          // uses MongoDB TTL index
                touchAfter:     24 * 3600,         // lazy update — only write if data changed
                crypto: {
                    // Encrypts session data at rest in MongoDB
                    secret: process.env.SESSION_SECRET || 'xyrox-fallback',
                },
            });

            store.on('error', (err) => {
                // Log store errors but do NOT crash — Express creates a fresh
                // in-memory session as fallback, which is better than a 500 error
                log.error('MongoStore error (session will be in-memory for this request)', err);
            });

            log.success('Session store: MongoDB (connect-mongo)');
        } catch (err) {
            log.error('Failed to create MongoStore — falling back to MemoryStore', err);
            store = undefined;
        }
    } else {
        log.warn('No MONGODB_URI — using MemoryStore (sessions will not survive restart)');
    }

    // ── Session config ────────────────────────────────────────────────────────
    const sessionConfig = {
        name:   'xyrox.sid', // custom name — avoids fingerprinting default 'connect.sid'
        secret: process.env.SESSION_SECRET || 'xyrox-fallback-secret-change-in-production',
        resave:            false, // do not force-save unchanged sessions
        saveUninitialized: false, // only save sessions that have data (GDPR friendly)
        rolling:           true,  // reset cookie expiry on each request
        store,
        cookie: {
            maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
            httpOnly: true,
            secure:   isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path:     '/',
        },
    };

    log.info('Cookie settings', {
        name:     sessionConfig.name,
        secure:   sessionConfig.cookie.secure,
        sameSite: sessionConfig.cookie.sameSite,
        httpOnly: sessionConfig.cookie.httpOnly,
        maxAge:   '7 days',
    });

    // ── Register middleware ───────────────────────────────────────────────────
    app.use(session(sessionConfig));
    app.use(passport.initialize());
    app.use(passport.session());

    log.success('Session middleware ready');
}
