/**
 * src/api/server.js — Express SaaS API Server
 *
 * Architecture: route → controller → service
 *
 * Features:
 *  - Discord OAuth2 via Passport
 *  - MongoDB-backed session store (connect-mongo)
 *  - Socket.io for real-time dashboard updates
 *  - Helmet, CORS, rate-limiting, compression
 *  - Centralised error handler
 *  - WebSocket-ready structure
 */

'use strict';

const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const compression    = require('compression');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');
const http           = require('http');
const { Server }     = require('socket.io');

const log                = require('@utils/logger');
const { getConfig }      = require('@config/index');
const { setupSession }   = require('./middleware/session');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRouter         = require('./routes/auth');
const guildsRouter       = require('./routes/guilds');
const botRouter          = require('./routes/bot');
const addonRouter        = require('./routes/addons');

class ApiServer {
    /**
     * @param {import('discord.js').Client} client
     */
    constructor(client) {
        this.client = client;
        this.config = getConfig();
        this.app    = express();
        this.server = http.createServer(this.app);
        this.io     = null;
    }

    _setupMiddleware() {
        const cfg = this.config;
        const isProduction = cfg.env === 'production';

        // ── Security ────────────────────────────────────────────────────────
        this.app.use(helmet({
            crossOriginResourcePolicy: { policy: 'cross-origin' },
        }));

        // ── CORS — Vercel dashboard ↔ Railway API ───────────────────────────
        const allowedOrigins = cfg.api.allowedOrigin
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean);

        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error(`CORS: origin ${origin} not allowed`));
                }
            },
            credentials:    true,
            methods:        ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
        }));

        // ── Body parsing & compression ──────────────────────────────────────
        this.app.use(express.json({ limit: '1mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
        this.app.use(compression());

        // ── Request logging ─────────────────────────────────────────────────
        if (!isProduction) {
            this.app.use(morgan('dev'));
        }

        // ── Global rate limiter ─────────────────────────────────────────────
        this.app.use('/api/', rateLimit({
            windowMs: 60 * 1000,
            max:      120,
            standardHeaders: true,
            legacyHeaders:   false,
            message:  { error: 'Too many requests. Please slow down.' },
        }));

        // ── Trust Railway/Vercel proxy ──────────────────────────────────────
        if (isProduction) this.app.set('trust proxy', 1);
    }

    _setupRoutes() {
        // Make Discord client available to route handlers
        this.app.set('client', this.client);

        // ── Health check ────────────────────────────────────────────────────
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Kythia API v2.0 🚀',
                status:  'operational',
                guilds:  this.client?.guilds?.cache.size || 0,
                uptime:  process.uptime(),
            });
        });

        // ── Route modules ───────────────────────────────────────────────────
        this.app.use('/api/auth',   authRouter);
        this.app.use('/api/guilds', guildsRouter);
        this.app.use('/api/bot',    botRouter);
        this.app.use('/api/addons', addonRouter);

        // ── 404 + error handler (must be last) ─────────────────────────────
        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
    }

    _setupWebSocket() {
        const cfg       = this.config;
        const origins   = cfg.api.allowedOrigin.split(',').map((o) => o.trim()).filter(Boolean);

        this.io = new Server(this.server, {
            cors: {
                origin:      origins.length > 0 ? origins : '*',
                methods:     ['GET', 'POST'],
                credentials: true,
            },
        });

        this.io.on('connection', (socket) => {
            log.debug('WebSocket connected', { id: socket.id });

            socket.on('join_guild', (guildId) => {
                socket.join(guildId);
                log.debug('Socket joined guild room', { socketId: socket.id, guildId });
            });

            socket.on('leave_guild', (guildId) => {
                socket.leave(guildId);
            });

            socket.on('disconnect', () => {
                log.debug('WebSocket disconnected', { id: socket.id });
            });
        });

        // Expose io on the express app so routes can broadcast
        this.app.set('io', this.io);

        log.success('WebSocket server ready');
    }

    async listen() {
        log.section('API Server');

        setupSession(this.app);
        this._setupMiddleware();
        this._setupRoutes();
        this._setupWebSocket();

        const port = this.config.api.port;

        return new Promise((resolve) => {
            this.server.listen(port, () => {
                log.success(`API server listening on port ${port}`);
                resolve();
            });
        });
    }
}

module.exports = ApiServer;
