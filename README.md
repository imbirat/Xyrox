# 🤖 Kythia SaaS v2.0

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-purple.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)
![License](https://img.shields.io/badge/license-CC--BY--NC--4.0-orange.svg)

**Production-ready Discord SaaS Bot Platform**

[Dashboard](https://xyrox.qzz.io) • [API](https://xyrox-production.up.railway.app) • [Architecture](./ARCHITECTURE.md)

</div>

---

## Overview

Kythia v2.0 is a full **SaaS monorepo** refactoring of the original Kythia Discord bot. It preserves **100% of original functionality** while transforming the architecture into a scalable, production-grade platform comparable to Carl.gg and Dyno.

### What Changed (Architecture Only)

| Before | After |
|--------|-------|
| Single `index.js` bootstrap | `src/index.js` → `BotManager` → `ApiServer` |
| Mixed responsibilities | `bot/`, `api/`, `services/`, `database/`, `utils/` |
| No centralised error handling | Global `unhandledRejection` + `uncaughtException` |
| No dashboard backend | Full Express SaaS API with Discord OAuth2 |
| Static HTML dashboard | React + Vite SaaS dashboard |
| No structured logging | Production-grade JSON logger |

### What Did NOT Change

- All Kythia addons (activity, adventure, ai, automod, leveling, economy, music, etc.)
- kythia-core dependency and addon system
- Database schema and Sequelize models
- Discord client intents, partials, and cache configuration
- Command system (prefix + slash)
- All permissions and middleware

---

## Quick Start

```bash
# 1. Install
./install.sh

# 2. Configure
nano .env

# 3. Start bot
npm start

# 4. Start dashboard (separate terminal)
cd dashboard && npm run dev
```

---

## Deployment

| Target  | Command |
|---------|---------|
| Railway | `git push` (auto-detected via `railway.json`) |
| Vercel  | `cd dashboard && vercel deploy --prod` |
| Docker  | `docker build -t kythia . && docker run --env-file .env kythia` |
| PM2     | `pm2 start ecosystem.config.js --env production` |

### Dashboard URL
**https://xyrox.qzz.io** (Vercel)

### API URL
**https://xyrox-production.up.railway.app** (Railway)

---

## Environment Variables

See [`.env.example`](./.env.example) for all variables and documentation.

**Minimum required:**
```env
DISCORD_BOT_TOKEN=
DISCORD_BOT_CLIENT_ID=
DISCORD_CLIENT_SECRET=
SESSION_SECRET=
DASHBOARD_URL=https://xyrox.qzz.io
OAUTH_CALLBACK=https://xyrox-production.up.railway.app/api/auth/discord/callback
API_ALLOWED_ORIGIN=https://xyrox.qzz.io
```

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the complete system design, auth flow, and deployment guide.

---

## License

CC-BY-NC-4.0 © kenndeclouv
