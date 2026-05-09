/**
 * ============================================================
 * 🚀 Kythia SaaS Platform — Main Entry Point
 * ============================================================
 * @file src/index.js
 * @version 2.0.0
 *
 * Boot order:
 *  1. Load env variables
 *  2. Register module aliases
 *  3. Attach global safety handlers
 *  4. Connect database layer
 *  5. Start bot client
 *  6. Start API server
 * ============================================================
 */

require('@dotenvx/dotenvx').config({ quiet: true });
require('module-alias/register');

const log           = require('@utils/logger');
const { connectDB } = require('@database/connection');
const BotManager    = require('@bot/managers/BotManager');
const ApiServer     = require('@api/server');

// ─── Global Process Safety Handlers ──────────────────────────────────────────

process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Promise Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack:  reason instanceof Error ? reason.stack  : undefined,
    });
});

process.on('uncaughtException', (err) => {
    log.error('Uncaught Exception — process will exit', {
        message: err.message,
        stack:   err.stack,
    });
    process.exit(1);
});

process.on('SIGTERM', async () => {
    log.info('SIGTERM received — shutting down gracefully');
    process.exit(0);
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
    log.section('Kythia SaaS v2.0.0');

    // 1. Database
    await connectDB();

    // 2. Discord bot
    const bot = new BotManager();
    await bot.start();

    // 3. API server (only on shard 0 or non-sharded)
    const api = new ApiServer(bot.client);
    await api.listen();

    log.success('✅ Kythia is fully operational');
}

bootstrap().catch((err) => {
    log.error('🔥 FATAL: Bootstrap failed', { message: err.message, stack: err.stack });
    process.exit(1);
});
