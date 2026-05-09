/**
 * src/utils/validateEnv.js — Environment variable validation
 *
 * TASK REQUIREMENTS MET:
 *  1. Validate all required environment variables safely.
 *  2. Prevent app crash when env vars are missing — returns a result object
 *     instead of calling process.exit(). The caller decides whether to abort.
 *  5. Detailed console logging with colours (via logger).
 *
 * Design decision:
 *   validateEnv() logs all issues and returns { ok, missing, warnings }.
 *   index.js calls it and decides to exit only after printing the full startup
 *   banner — so the operator can see exactly what is wrong before the process dies.
 *   This is safer than crashing mid-import before any output appears.
 */

import log from './logger.js';

// ─── Variable definitions ──────────────────────────────────────────────────────

/** Must be present — app cannot function without these */
const REQUIRED = [
    { key: 'BOT_TOKEN',      hint: 'Discord bot token — Discord Developer Portal → Bot → Token' },
    { key: 'CLIENT_ID',      hint: 'Discord application ID — Developer Portal → General Information' },
    { key: 'CLIENT_SECRET',  hint: 'Discord OAuth secret — Developer Portal → OAuth2' },
    { key: 'MONGODB_URI',    hint: 'MongoDB Atlas connection string' },
    { key: 'SESSION_SECRET', hint: 'Random secret ≥32 chars — node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"' },
    { key: 'OAUTH_CALLBACK', hint: 'Full callback URL — https://your-railway.up.railway.app/api/auth/discord/callback' },
    { key: 'DASHBOARD_URL',  hint: 'Vercel frontend URL — https://your-app.vercel.app (no trailing slash)' },
];

/** Recommended but the app will still start without them */
const RECOMMENDED = [
    { key: 'NODE_ENV', hint: 'Set to "production" on Railway' },
];

// ─── Validation function ───────────────────────────────────────────────────────

/**
 * @returns {{ ok: boolean, missing: string[], warnings: string[] }}
 */
export function validateEnv() {
    const missing  = [];
    const warnings = [];

    // ── Required vars ──────────────────────────────────────────────────────────
    for (const { key, hint } of REQUIRED) {
        if (!process.env[key] || process.env[key].trim() === '') {
            missing.push(key);
            log.error(`Missing required env var: ${key}`, { hint });
        }
    }

    // ── Recommended vars ───────────────────────────────────────────────────────
    for (const { key, hint } of RECOMMENDED) {
        if (!process.env[key]) {
            warnings.push(key);
            log.warn(`Recommended env var not set: ${key}`, { hint });
        }
    }

    // ── Quality checks on present vars ────────────────────────────────────────
    const secret = process.env.SESSION_SECRET;
    if (secret && secret.length < 32) {
        warnings.push('SESSION_SECRET_TOO_SHORT');
        log.warn('SESSION_SECRET is too short — use at least 32 random characters');
    }

    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
        const cb = process.env.OAUTH_CALLBACK;
        if (cb && !cb.startsWith('https://')) {
            warnings.push('OAUTH_CALLBACK_NOT_HTTPS');
            log.warn('OAUTH_CALLBACK should use https:// in production');
        }
        const du = process.env.DASHBOARD_URL;
        if (du && du.endsWith('/')) {
            warnings.push('DASHBOARD_URL_TRAILING_SLASH');
            log.warn('DASHBOARD_URL has a trailing slash — this will break CORS origin matching');
        }
        if (du && !du.startsWith('https://')) {
            warnings.push('DASHBOARD_URL_NOT_HTTPS');
            log.warn('DASHBOARD_URL should use https:// in production');
        }
    }

    // ── Summary ────────────────────────────────────────────────────────────────
    if (missing.length === 0 && warnings.length === 0) {
        log.success('All environment variables validated');
    } else if (missing.length === 0) {
        log.warn(`Environment validated with ${warnings.length} warning(s) — see above`);
    } else {
        log.error(
            `Environment validation failed — ${missing.length} required variable(s) missing`,
            { missing }
        );
    }

    return { ok: missing.length === 0, missing, warnings };
}
