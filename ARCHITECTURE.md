# 🏗️ Kythia SaaS v2.0 — Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       KYTHIA SAAS ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐      ┌───────────────────┐      ┌───────────────┐ │
│  │   Discord   │◄────►│   Kythia Bot      │◄────►│   SQLite /    │ │
│  │   Servers   │      │   (Discord.js)    │      │   MySQL       │ │
│  └─────────────┘      └────────┬──────────┘      └───────────────┘ │
│                                │                                     │
│                                │ Internal (same process)             │
│                                ▼                                     │
│                       ┌───────────────────┐                         │
│                       │  Hono Addon API   │  (port 3001)            │
│                       │  (kythia-core)    │                         │
│                       └────────┬──────────┘                         │
│                                │                                     │
│                                │ Proxied by                         │
│                                ▼                                     │
│                       ┌───────────────────┐                         │
│                       │  Express SaaS API │  (port 3001 shared)     │
│                       │  - OAuth2/Auth    │                         │
│                       │  - Guild routes   │                         │
│                       │  - Addon proxy    │                         │
│                       │  - Socket.IO      │                         │
│                       └────────┬──────────┘                         │
│                                │ HTTPS + Cookies                    │
│                                ▼                                     │
│                       ┌───────────────────┐                         │
│                       │  React Dashboard  │  https://xyrox.qzz.io  │
│                       │  (Vite + React)   │                         │
│                       └───────────────────┘                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Deployment URLs

| Service   | URL |
|-----------|-----|
| Dashboard | https://xyrox.qzz.io |
| API/Bot   | https://xyrox-production.up.railway.app |

## Monorepo Structure

```
kythia-saas/
│
├── src/                          # Backend + bot (deployed to Railway)
│   ├── index.js                  # Bootstrap entry point
│   │
│   ├── bot/
│   │   └── managers/
│   │       └── BotManager.js     # Orchestrates kythia-core + Discord client
│   │
│   ├── api/
│   │   ├── server.js             # Express SaaS API server
│   │   ├── routes/
│   │   │   ├── auth.js           # Discord OAuth2, session exchange
│   │   │   ├── guilds.js         # Guild config, channels, roles, stats
│   │   │   ├── bot.js            # Bot status, invite URL
│   │   │   └── addons.js         # Proxy to Kythia addon Hono API
│   │   └── middleware/
│   │       ├── auth.js           # isAuthenticated, hasGuildAccess
│   │       ├── session.js        # MongoDB-backed session setup
│   │       └── errorHandler.js   # Centralised error handler
│   │
│   ├── config/
│   │   └── index.js              # Unified config from env vars
│   │
│   ├── database/
│   │   └── connection.js         # Sequelize connection manager
│   │
│   └── utils/
│       └── logger/
│           └── index.js          # Structured logger (JSON prod, coloured dev)
│
├── dashboard/                    # Frontend (deployed to Vercel)
│   ├── vercel.json               # Vercel config (xyrox.qzz.io)
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx               # Root: auth, routing, socket.io
│       ├── main.jsx
│       ├── index.css
│       ├── utils/
│       │   └── api.js            # Centralised fetch client → Railway
│       ├── components/
│       │   └── shared/
│       │       ├── Navbar.jsx
│       │       └── Sidebar.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── ServerSelect.jsx
│           ├── AutoMod.jsx
│           ├── Leveling.jsx
│           ├── Welcome.jsx
│           ├── Tickets.jsx
│           ├── ReactionRoles.jsx
│           ├── Giveaway.jsx
│           ├── Economy.jsx
│           ├── Logging.jsx
│           ├── Modules.jsx
│           ├── Settings.jsx
│           └── SendMessage.jsx
│
├── .env.example                  # Environment variable template
├── package.json                  # Root dependencies
├── ecosystem.config.js           # PM2 config
├── railway.json                  # Railway deployment
├── nixpacks.toml                 # Railway build config
├── Dockerfile                    # Container deployment
├── Procfile                      # Process definition
└── install.sh                    # One-command setup

```

## Technology Stack

| Layer       | Technology            | Purpose                                 |
|-------------|-----------------------|-----------------------------------------|
| Bot Core    | Discord.js v14        | Discord API interaction                 |
| Bot Engine  | kythia-core           | Addon system, command loading, DI       |
| Database    | Sequelize + SQLite/MySQL | Relational data (all Kythia models)  |
| Session DB  | MongoDB + connect-mongo | Session persistence across restarts   |
| API Server  | Express.js            | REST API + OAuth2 proxy                |
| Addon API   | Hono                  | Lightweight addon-specific routes      |
| Real-time   | Socket.IO             | Live dashboard updates                 |
| Auth        | Passport.js           | Discord OAuth2                         |
| Frontend    | React 18 + Vite       | SaaS dashboard                         |
| Styling     | Tailwind CSS          | Dashboard design                       |

## Auth Flow (Vercel ↔ Railway)

```
User clicks "Login with Discord"
        │
        ▼
GET https://xyrox-production.up.railway.app/api/auth/discord
        │
        ▼ (redirect)
Discord OAuth consent screen
        │
        ▼ (callback)
GET /api/auth/discord/callback
→ Filter guilds to manageable only
→ Generate cryptographic one-time token (64-char hex)
→ Store token in memory (5 min TTL)
→ Redirect to https://xyrox.qzz.io?token=<TOKEN>
        │
        ▼ (dashboard JS)
GET /api/auth/exchange?token=<TOKEN>
→ Validate token format + expiry
→ DELETE token (one-time use)
→ Save user + guilds to MongoDB session
→ Set kythia.sid cookie (secure, sameSite=none)
→ Return { user, guilds }
        │
        ▼
Dashboard authenticated ✅
All subsequent requests include kythia.sid cookie
```

## Cookie Configuration

```
Name:     kythia.sid
secure:   true  (production) / false (dev)
sameSite: none  (production) / lax   (dev)
httpOnly: true  (XSS protection)
maxAge:   7 days
```

These settings allow cross-site cookie delivery from Vercel (xyrox.qzz.io) to Railway (xyrox-production.up.railway.app).

## Process Safety

```javascript
process.on('unhandledRejection', (reason) => { log.error(...); });
process.on('uncaughtException',  (err)    => { log.error(...); process.exit(1); });
process.on('SIGTERM',            ()       => { /* graceful shutdown */ });
```

## Kythia Addon Compatibility

All original Kythia addons are preserved exactly:

| Addon         | Feature Flag   | API Route          |
|---------------|----------------|--------------------|
| activity      | activityOn     | /api/addons/activity/:guildId |
| adventure     | —              | (bot-only)         |
| ai            | aiOn           | /api/addons/ai/:guildId |
| automod       | automodOn      | /api/addons/automod/:guildId |
| autoreact     | —              | /api/addons/autoreact/:guildId |
| autoreply     | —              | /api/addons/autoreply/:guildId |
| birthday      | —              | /api/addons/birthday/:guildId |
| economy       | economyOn      | /api/guilds/:guildId/leaderboard?type=economy |
| giveaway      | —              | /api/addons/giveaway/:guildId |
| leveling      | levelingOn     | /api/addons/leveling/:guildId |
| modmail       | —              | /api/addons/modmail/:guildId |
| music         | musicOn        | (bot-only)         |
| reaction-role | —              | /api/addons/reaction-roles/:guildId |
| ticket        | —              | /api/addons/tickets/:guildId |
| welcomer      | welcomeInOn    | /api/addons/welcome/:guildId |
| verification  | —              | (bot-only)         |

The SaaS Express API proxies all addon data requests to Kythia's internal Hono API, adding authentication and guild-access checks in the SaaS layer.

## Deployment Guide

### Railway (Bot + API Backend)

1. Push to GitHub
2. Create new Railway project from GitHub repo
3. Add environment variables from `.env.example`
4. Railway auto-detects `railway.json` and starts

**Required env vars for Railway:**
```
DISCORD_BOT_TOKEN
DISCORD_BOT_CLIENT_ID
DISCORD_CLIENT_SECRET
SESSION_SECRET
DASHBOARD_URL=https://xyrox.qzz.io
OAUTH_CALLBACK=https://xyrox-production.up.railway.app/api/auth/discord/callback
API_ALLOWED_ORIGIN=https://xyrox.qzz.io
MONGODB_URI (optional but recommended)
```

### Vercel (Dashboard)

```bash
cd dashboard
vercel deploy --prod
```

**Required env vars for Vercel:**
```
VITE_API_URL=https://xyrox-production.up.railway.app
VITE_APP_URL=https://xyrox.qzz.io
VITE_CLIENT_ID=<your Discord client ID>
```

### Docker

```bash
docker build -t kythia-saas .
docker run -d \
  --name kythia \
  -p 3001:3001 \
  --env-file .env \
  kythia-saas
```

### PM2 (Self-hosted VPS)

```bash
npm install
cp .env.example .env
# Edit .env
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```
