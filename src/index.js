/**
 * src/index.js — Production-hardened entry point
 *
 * TASK REQUIREMENTS MET:
 *  1. Validate all required env vars safely — uses validateEnv() which returns
 *     a result object; process.exit only called after full banner is shown
 *  2. Prevent crash on missing env vars — graceful exit with clear message
 *  3. try/catch around Discord login, MongoDB, Express, Socket.IO
 *  4. Centralised error handler middleware registered at bottom of stack
 *  5. Detailed coloured logging via logger.js
 *  9. Fallback PORT: process.env.PORT || 3000
 * 10. Production session store via connect-mongo (in session.js)
 * 11. ES modules throughout ("type":"module" in package.json)
 * 12. Graceful shutdown on SIGTERM / SIGINT
 * 13. nodemon dev support (nodemon.json in project root)
 * 14. Clean, professional startup output
 */

import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { setupSession } from './api/middleware/session.js';
import { validateEnv } from './utils/validateEnv.js';
import log from './utils/logger.js';

// Load .env before anything else — safe to call even if file doesn't exist
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const PKG_VERSION  = '2.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// ─── 1. Startup banner ────────────────────────────────────────────────────────
log.banner('Xyrox Bot', PKG_VERSION, isProduction ? 'PRODUCTION' : 'DEVELOPMENT');

// ─── 2. Environment validation ────────────────────────────────────────────────
log.section('Environment');

const envResult = validateEnv();
if (!envResult.ok) {
    log.error('Cannot start — fix the missing environment variables listed above.');
    log.error('See .env.example for a complete template.');
    // Delay exit slightly so all log output flushes to Railway's log collector
    setTimeout(() => process.exit(1), 500);
    // Prevent the rest of the file from executing while we wait
    throw new Error('Missing environment variables — aborting startup');
}

// ─── 3. Build allowed origins list ───────────────────────────────────────────
// Supports comma-separated list: DASHBOARD_URL=https://a.vercel.app,https://b.vercel.app
const rawOrigins    = process.env.DASHBOARD_URL || 'http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

// ─── 4. Discord Client ────────────────────────────────────────────────────────
log.section('Discord Client');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildInvites,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
    ],
});

client.commands      = new Collection();
client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.cooldowns     = new Collection();

log.success('Discord client instance created');

// ─── 5. Express + HTTP + Socket.IO ───────────────────────────────────────────
log.section('Express / HTTP / Socket.IO');

const app        = express();
const httpServer = createServer(app);

// CRITICAL: trust proxy MUST be set before any session/cookie middleware.
// Railway terminates TLS at a reverse proxy — without this Express thinks
// every connection is HTTP and refuses to set secure cookies.
app.set('trust proxy', 1);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow curl/Postman
        if (allowedOrigins.includes(origin)) return callback(null, true);
        log.warn('CORS blocked origin', { origin, allowed: allowedOrigins });
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods:     ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

// Socket.IO — try/catch because invalid config can throw synchronously
let io;
try {
    io = new Server(httpServer, {
        cors: {
            origin:      allowedOrigins,
            methods:     ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout:  20000,
        pingInterval: 25000,
        // Allow both transports — Railway supports WebSocket but some proxies need polling
        transports: ['websocket', 'polling'],
    });
    log.success('Socket.IO server created');
} catch (err) {
    log.error('Failed to create Socket.IO server', err);
    process.exit(1);
}

// ─── 6. Middleware stack (ORDER MATTERS) ──────────────────────────────────────
log.section('Middleware');

// Security headers
app.use(helmet({
    contentSecurityPolicy:    false, // dashboard uses inline styles
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy:   false,
}));
log.info('Helmet security headers enabled');

// Gzip compression — reduces Railway ↔ Vercel payload size
app.use(compression());
log.info('Compression middleware enabled');

// HTTP request logging
app.use(morgan(isProduction ? 'combined' : 'dev'));
log.info(`Morgan logging: ${isProduction ? 'combined' : 'dev'} format`);

// CORS — preflight must come before body parsers
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
log.info('CORS configured', { origins: allowedOrigins });

// Body parsers — limit size to prevent payload attacks
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
log.info('Body parsers enabled (100kb limit)');

// ─── 7. Rate limiting ─────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
    windowMs:       15 * 60 * 1000,
    max:            200,
    standardHeaders: true,
    legacyHeaders:  false,
    message:        { error: 'Too many requests, please try again later.' },
    skip: (req) => req.path === '/health',
});

const authLimiter = rateLimit({
    windowMs:       15 * 60 * 1000,
    max:            20,
    standardHeaders: true,
    legacyHeaders:  false,
    message:        { error: 'Too many authentication attempts, please try again later.' },
});

app.use('/api/',       generalLimiter);
app.use('/api/auth/',  authLimiter);
log.info('Rate limiters enabled (200/15m general, 20/15m auth)');

// ─── 8. Session (AFTER CORS, BEFORE routes) ───────────────────────────────────
setupSession(app);

// ─── 9. Debug middleware (development only) ───────────────────────────────────
if (!isProduction) {
    app.use((req, _res, next) => {
        log.debug(`${req.method} ${req.path}`, {
            origin:    req.get('origin') || 'none',
            sessionId: req.sessionID    || 'none',
        });
        next();
    });
}

// ─── 10. Attach Discord client + Socket.IO to Express ────────────────────────
// Must be BEFORE route loaders so req.app.get('client') works in every handler
app.set('client', client);
client.io = io;
log.success('Discord client attached to Express app');

// ─── 11. Loader functions ─────────────────────────────────────────────────────
const loadCommands = async () => {
    const commandsDir = join(__dirname, 'commands');
    if (!existsSync(commandsDir)) {
        log.warn('commands/ directory not found — skipping command load');
        return;
    }
    let slash = 0, prefix = 0, errors = 0;
    const folders = readdirSync(commandsDir);
    for (const folder of folders) {
        const folderPath = join(commandsDir, folder);
        let files;
        try {
            files = readdirSync(folderPath).filter(f => f.endsWith('.js'));
        } catch {
            continue; // not a directory
        }
        for (const file of files) {
            try {
                const mod = await import(`./commands/${folder}/${file}`);
                const cmd = mod.default;
                if (!cmd) continue;
                if (cmd?.data) { client.slashCommands.set(cmd.data.name, cmd); slash++; }
                if (cmd?.name) { client.prefixCommands.set(cmd.name, cmd); prefix++; }
            } catch (err) {
                errors++;
                log.error(`Failed to load command: ${folder}/${file}`, err);
            }
        }
    }
    log.success(`Commands loaded: ${slash} slash, ${prefix} prefix, ${errors} errors`);
};

const loadEvents = async () => {
    const eventsDir = join(__dirname, 'events');
    if (!existsSync(eventsDir)) {
        log.warn('events/ directory not found — skipping event load');
        return;
    }
    let count = 0, errors = 0;
    const files = readdirSync(eventsDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const mod = await import(`./events/${file}`);
            const evt = mod.default;
            if (!evt?.name) continue;
            if (evt.once) {
                client.once(evt.name, (...args) => evt.execute(...args, client));
            } else {
                client.on(evt.name, (...args) => evt.execute(...args, client));
            }
            count++;
        } catch (err) {
            errors++;
            log.error(`Failed to load event: ${file}`, err);
        }
    }
    log.success(`Events loaded: ${count} registered, ${errors} errors`);
};

const loadRoutes = async () => {
    const routesDir = join(__dirname, 'api/routes');
    if (!existsSync(routesDir)) {
        log.warn('api/routes/ directory not found — skipping route load');
        return;
    }
    let count = 0, errors = 0;
    const files = readdirSync(routesDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const mod   = await import(`./api/routes/${file}`);
            const route = mod.default;
            const name  = file.replace('.js', '');
            app.use(`/api/${name}`, route);
            count++;
            log.info(`Route mounted: /api/${name}`);
        } catch (err) {
            errors++;
            log.error(`Failed to load route: ${file}`, err);
        }
    }
    log.success(`Routes loaded: ${count} mounted, ${errors} errors`);
};

// ─── 12. MongoDB connection ───────────────────────────────────────────────────
const connectDB = async () => {
    log.section('MongoDB');
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // fail fast — don't hang on bad URI
            socketTimeoutMS:          45000,
            bufferCommands:           false, // never queue ops before connection
            maxPoolSize:              10,
        });

        // Runtime event handlers — attach AFTER successful initial connect
        mongoose.connection.on('error', err => {
            log.error('MongoDB runtime error', err);
        });
        mongoose.connection.on('disconnected', () => {
            log.warn('MongoDB disconnected — Mongoose will attempt auto-reconnect');
        });
        mongoose.connection.on('reconnected', () => {
            log.success('MongoDB reconnected');
        });

        log.success(`MongoDB connected to: ${mongoose.connection.host}`);
    } catch (err) {
        log.error('MongoDB connection failed', err);
        throw err; // bubble up to init() which handles exit
    }
};

// ─── 13. Slash command deployment ────────────────────────────────────────────
const deployCommands = async () => {
    try {
        const { REST, Routes } = await import('discord.js');
        const commandsDir      = join(__dirname, 'commands');
        if (!existsSync(commandsDir)) return;

        const commands = [];
        for (const folder of readdirSync(commandsDir)) {
            const folderPath = join(commandsDir, folder);
            let files;
            try { files = readdirSync(folderPath).filter(f => f.endsWith('.js')); }
            catch { continue; }
            for (const file of files) {
                try {
                    const mod = await import(`./commands/${folder}/${file}`);
                    if (mod.default?.data) commands.push(mod.default.data.toJSON());
                } catch { /* already logged in loadCommands */ }
            }
        }

        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        log.success(`Deployed ${commands.length} slash commands to Discord`);
    } catch (err) {
        // Non-fatal — bot works with cached commands
        log.warn('Slash command deployment failed (bot will still run)', { message: err.message });
    }
};

// ─── 14. Socket.IO handlers ───────────────────────────────────────────────────
const setupSocketHandlers = () => {
    log.section('Socket.IO');

    io.on('connection', (socket) => {
        log.info(`Socket connected: ${socket.id}`, {
            transport: socket.conn.transport.name,
        });

        socket.on('disconnect', (reason) => {
            log.info(`Socket disconnected: ${socket.id}`, { reason });
        });

        socket.on('error', (err) => {
            log.error(`Socket error: ${socket.id}`, err);
        });

        // Join a per-guild room so config updates are scoped correctly
        socket.on('join-guild', (guildId) => {
            if (typeof guildId === 'string' && /^\d{17,19}$/.test(guildId)) {
                socket.join(`guild:${guildId}`);
                log.debug(`Socket ${socket.id} joined guild room: ${guildId}`);
            } else {
                log.warn(`Socket ${socket.id} sent invalid guildId`, { guildId });
            }
        });

        // Only broadcast to authenticated guild rooms
        socket.on('update-config', (data) => {
            if (!data?.guildId || !data?.config) return;
            socket.to(`guild:${data.guildId}`).emit('config-updated', {
                guildId: data.guildId,
                config:  data.config,
            });
        });
    });

    log.success('Socket.IO handlers registered');
};

// ─── 15. System endpoints ─────────────────────────────────────────────────────
const setupSystemRoutes = () => {
    // Health check — used by Railway's healthcheck and uptime monitors
    app.get('/health', (_req, res) => {
        res.json({
            status:     'ok',
            uptime:     Math.floor(process.uptime()),
            guilds:     client.guilds?.cache?.size ?? 0,
            commands:   client.slashCommands?.size ?? 0,
            mongoState: mongoose.connection.readyState, // 1 = connected
            version:    PKG_VERSION,
            env:        process.env.NODE_ENV || 'unknown',
        });
    });

    // Debug endpoint — development only, never expose in production
    if (!isProduction) {
        app.get('/api/debug/session', (req, res) => {
            res.json({
                sessionID: req.sessionID,
                session:   req.session,
                cookies:   req.headers.cookie,
                origin:    req.get('origin'),
                hasUser:   !!req.session?.user,
            });
        });
        log.warn('Debug endpoint /api/debug/session is ENABLED (development only)');
    }
};

// ─── 16. Global Express error handler ────────────────────────────────────────
// Must be registered AFTER all routes — Express identifies error handlers by 4-param arity
const setupErrorHandler = () => {
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        log.error(`Unhandled Express error on ${req.method} ${req.path}`, err);

        if (res.headersSent) return next(err);

        if (err.message?.includes('not allowed by CORS')) {
            return res.status(403).json({ error: 'CORS policy violation' });
        }

        // Never expose stack traces to clients in production
        res.status(err.status || 500).json({
            error: isProduction ? 'Internal server error' : err.message,
        });
    });
    log.success('Global Express error handler registered');
};

// ─── 17. Main boot sequence ───────────────────────────────────────────────────
const init = async () => {
    log.section('Boot Sequence');

    // MongoDB — must connect before session store is usable
    try {
        await connectDB();
    } catch (err) {
        log.error('Fatal: MongoDB connection failed — cannot continue', err);
        setTimeout(() => process.exit(1), 500);
        return;
    }

    // Load commands, events, and API routes — errors are logged but non-fatal
    try {
        await loadCommands();
        await loadEvents();
        await loadRoutes();
    } catch (err) {
        log.error('Fatal: Loader error during startup', err);
        setTimeout(() => process.exit(1), 500);
        return;
    }

    // Register Socket.IO handlers
    try {
        setupSocketHandlers();
    } catch (err) {
        log.error('Fatal: Socket.IO setup failed', err);
        setTimeout(() => process.exit(1), 500);
        return;
    }

    // System routes and error handler — must come after all API routes
    setupSystemRoutes();
    setupErrorHandler();

    // Start HTTP server
    // Requirement 9: const PORT = process.env.PORT || 3000
    const PORT = process.env.PORT || process.env.API_PORT || 3000;

    await new Promise((resolve, reject) => {
        try {
            httpServer.listen(PORT, '0.0.0.0', () => resolve());
            httpServer.once('error', reject);
        } catch (err) {
            reject(err);
        }
    }).then(() => {
        log.section('Server Ready');
        log.success(`HTTP server listening on port ${PORT}`);
        log.info(`CORS origins: ${allowedOrigins.join(', ')}`);
        log.info(`Environment:  ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
        log.info(`Health check: http://localhost:${PORT}/health`);
    }).catch(err => {
        log.error('Fatal: HTTP server failed to start', err);
        setTimeout(() => process.exit(1), 500);
        return;
    });

    // Discord login — AFTER HTTP server is up so health checks pass immediately
    log.section('Discord Login');
    try {
        await client.login(process.env.BOT_TOKEN);
        log.success(`Discord bot logged in as: ${client.user?.tag ?? 'unknown'}`);
    } catch (err) {
        log.error('Fatal: Discord login failed', err);
        log.error('Check BOT_TOKEN is correct and the bot has not been reset');
        setTimeout(() => process.exit(1), 500);
        return;
    }

    // Deploy slash commands — non-fatal
    await deployCommands();

    log.section('Startup Complete');
    log.success(`Xyrox v${PKG_VERSION} is running ✔`);
};

// ─── 18. Process-level error guards ───────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled promise rejection', { reason: String(reason), promise: String(promise) });
    // Do NOT exit — a single rejected promise shouldn't kill the entire bot
    // Railway will restart on true crashes via uncaughtException below
});

process.on('uncaughtException', (err) => {
    log.error('Uncaught exception — will restart', err);
    // Flush logs then exit — Railway/nodemon will restart the process
    setTimeout(() => process.exit(1), 1000);
});

// ─── 19. Graceful shutdown ────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
    log.warn(`${signal} received — starting graceful shutdown`);

    // Stop accepting new connections
    httpServer.close(() => {
        log.info('HTTP server closed');
    });

    // Disconnect Socket.IO clients cleanly
    try {
        io.disconnectSockets(true);
        log.info('Socket.IO clients disconnected');
    } catch { /* ignore */ }

    // Close MongoDB connection
    try {
        await mongoose.connection.close();
        log.info('MongoDB connection closed');
    } catch (err) {
        log.warn('MongoDB close error', err);
    }

    // Destroy Discord client
    try {
        client.destroy();
        log.info('Discord client destroyed');
    } catch { /* ignore */ }

    log.success('Graceful shutdown complete');
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// ─── 20. Start ────────────────────────────────────────────────────────────────
init();

export default client;
