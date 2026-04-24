import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupSession } from './api/middleware/session.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Discord Client
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
        Partials.GuildMember
    ]
});

// Collections
client.commands = new Collection();
client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.cooldowns = new Collection();

// Initialize Express + Socket.io
const app = express();
const httpServer = createServer(app);

// Build allowed origins list (supports comma-separated)
const rawOrigins = process.env.DASHBOARD_URL || 'http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

console.log('🌍 Allowed CORS origins:', allowedOrigins);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) {
            console.log('✅ CORS: No origin (allowing)');
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            console.log('✅ CORS: Origin allowed:', origin);
            return callback(null, true);
        }
        
        console.warn('❌ CORS blocked origin:', origin);
        console.warn('   Allowed origins:', allowedOrigins);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware - ORDER MATTERS!
app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false 
}));
app.use(morgan('dev'));

// Handle OPTIONS preflight for all routes
app.options('*', cors(corsOptions));

// Apply CORS to all routes
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup session — MUST come AFTER CORS but BEFORE routes
setupSession(app);

// Debug middleware - log all incoming requests
app.use((req, res, next) => {
    console.log(`\n📨 ${req.method} ${req.path}`);
    console.log('   Origin:', req.get('origin') || 'none');
    console.log('   Cookies:', req.headers.cookie || 'none');
    console.log('   Session ID:', req.sessionID || 'none');
    next();
});

// Store io instance on client
client.io = io;

// Load Command Handlers
const loadCommands = async () => {
    const commandFolders = readdirSync(join(__dirname, 'commands'));
    
    for (const folder of commandFolders) {
        const commandFiles = readdirSync(join(__dirname, 'commands', folder))
            .filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = await import(`./commands/${folder}/${file}`);
            const cmd = command.default;
            
            if (cmd.data) {
                client.slashCommands.set(cmd.data.name, cmd);
            }
            if (cmd.name) {
                client.prefixCommands.set(cmd.name, cmd);
            }
        }
    }
    console.log(`✅ Commands loaded: ${client.slashCommands.size} slash commands`);
};

// Load Event Handlers
const loadEvents = async () => {
    const eventFiles = readdirSync(join(__dirname, 'events'))
        .filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const event = await import(`./events/${file}`);
        const evt = event.default;
        
        if (evt.once) {
            client.once(evt.name, (...args) => evt.execute(...args, client));
        } else {
            client.on(evt.name, (...args) => evt.execute(...args, client));
        }
    }
    console.log('✅ Events loaded successfully');
};

// Load API Routes
const loadRoutes = async () => {
    const routeFiles = readdirSync(join(__dirname, 'api/routes'))
        .filter(file => file.endsWith('.js'));
    
    for (const file of routeFiles) {
        const route = await import(`./api/routes/${file}`);
        const routeName = file.replace('.js', '');
        app.use(`/api/${routeName}`, route.default);
    }
    console.log('✅ API routes loaded successfully');
};

// Connect to Database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Auto-deploy slash commands to Discord
const deployCommands = async () => {
    try {
        const { REST, Routes } = await import('discord.js');
        const commands = [];

        const commandFolders = readdirSync(join(__dirname, 'commands'));
        for (const folder of commandFolders) {
            const commandFiles = readdirSync(join(__dirname, 'commands', folder))
                .filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = await import(`./commands/${folder}/${file}`);
                if (command.default?.data) {
                    commands.push(command.default.data.toJSON());
                }
            }
        }

        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log(`✅ Deployed ${commands.length} slash commands to Discord`);
    } catch (error) {
        console.error('❌ Failed to deploy slash commands:', error.message);
    }
};

// Socket.io Connection Handler
io.on('connection', (socket) => {
    console.log('📡 Dashboard connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('📡 Dashboard disconnected:', socket.id);
    });
    
    socket.on('update-config', async (data) => {
        const { guildId, config: cfg } = data;
        io.emit('config-updated', { guildId, config: cfg });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        guilds: client.guilds.cache.size,
        commands: client.slashCommands.size
    });
});

// Test endpoint for debugging sessions
app.get('/api/debug/session', (req, res) => {
    res.json({
        sessionID: req.sessionID,
        session: req.session,
        cookies: req.headers.cookie,
        origin: req.get('origin'),
        hasUser: !!req.session?.user
    });
});

// Initialize Bot
const init = async () => {
    try {
        await connectDB();
        await loadCommands();
        await loadEvents();
        await loadRoutes();
        
        const PORT = process.env.PORT || process.env.API_PORT || 5000;
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 API Server running on port ${PORT}`);
            console.log(`🌍 CORS enabled for: ${allowedOrigins.join(', ')}`);
        });
        
        await client.login(process.env.BOT_TOKEN);
        
        // Deploy slash commands after login so CLIENT_ID is confirmed valid
        await deployCommands();
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        process.exit(1);
    }
};

init();

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

export default client;
