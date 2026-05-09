/**
 * src/config/index.js — Centralised configuration loader
 *
 * Reads environment variables and produces a typed config object.
 * All other modules import from here — no direct process.env access.
 *
 * Mirrors the original kythia.config.js structure to maintain
 * full backwards compatibility with Kythia's addon system.
 */

'use strict';

let _config = null;

function getConfig() {
    if (_config) return _config;

    _config = {
        env:     process.env.NODE_ENV || 'local',
        version: require('../../package.json').version,

        // ── Legal ──────────────────────────────────────────────────────────
        legal: {
            acceptTOS:      process.env.ACCEPT_TOS      === 'true',
            dataCollection: process.env.DATA_COLLECTION === 'true',
        },

        // ── Bot ────────────────────────────────────────────────────────────
        bot: {
            token:    process.env.DISCORD_BOT_TOKEN,
            clientId: process.env.DISCORD_BOT_CLIENT_ID,
            prefix:   process.env.BOT_PREFIX   || '!',
            status:   process.env.BOT_STATUS   || 'online',
            activity: process.env.BOT_ACTIVITY || 'Kythia v2',
            shards:   process.env.SHARD_COUNT  || 'auto',
        },

        // ── Owner ──────────────────────────────────────────────────────────
        owner: {
            id:   process.env.OWNER_ID   || '',
            team: (process.env.OWNER_TEAM || '').split(',').filter(Boolean),
        },

        // ── Database ───────────────────────────────────────────────────────
        db: {
            driver:   process.env.DB_DRIVER   || 'sqlite',
            host:     process.env.DB_HOST     || '127.0.0.1',
            port:     parseInt(process.env.DB_PORT || '3306', 10),
            name:     process.env.DB_NAME     || 'kythia.sqlite',
            username: process.env.DB_USER     || 'root',
            password: process.env.DB_PASS     || '',
            mongoUri: process.env.MONGODB_URI || '',
            redis: {
                host:     process.env.REDIS_HOST     || '127.0.0.1',
                port:     parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
                db:       parseInt(process.env.REDIS_DB   || '0',    10),
            },
        },

        // ── API Server ─────────────────────────────────────────────────────
        api: {
            port:          parseInt(process.env.API_PORT   || '3001', 10),
            secret:        process.env.API_SECRET          || '',
            sessionSecret: process.env.SESSION_SECRET      || 'kythia-session-secret-change-in-production',
            allowedOrigin: process.env.API_ALLOWED_ORIGIN  || 'http://localhost:3000',
            dashboardUrl:  process.env.DASHBOARD_URL       || 'http://localhost:3000',

            // OAuth2
            oauthCallback: process.env.OAUTH_CALLBACK      || 'http://localhost:3001/api/auth/discord/callback',
            clientSecret:  process.env.DISCORD_CLIENT_SECRET || '',
        },

        // ── Addons ─────────────────────────────────────────────────────────
        addons: {
            api: {
                port:          parseInt(process.env.API_PORT   || '3001', 10),
                secret:        process.env.API_SECRET          || '',
                allowedOrigin: process.env.API_ALLOWED_ORIGIN  || '',
            },
            ai: {
                geminiApiKey: process.env.GEMINI_API_KEY || '',
            },
            music: {
                nodes: (process.env.LAVALINK_NODES || '').split(',').filter(Boolean),
            },
            topgg: {
                token: process.env.TOPGG_TOKEN || '',
            },
            sentry: {
                dsn: process.env.SENTRY_DSN || '',
            },
        },

        // ── Features ───────────────────────────────────────────────────────
        features: {
            activityTracking: process.env.FEATURE_ACTIVITY  !== 'false',
            leveling:         process.env.FEATURE_LEVELING  !== 'false',
            economy:          process.env.FEATURE_ECONOMY   !== 'false',
            music:            process.env.FEATURE_MUSIC     !== 'false',
            ai:               process.env.FEATURE_AI        !== 'false',
        },
    };

    return _config;
}

module.exports = { getConfig };
