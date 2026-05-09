# 🚀 Migration Plan: Kythia v1 → SaaS v2.0

## Overview

This is a **structural-only** migration. Zero bot functionality changes.
All Kythia addons, commands, events, and logic run exactly as before.

---

## Phase 1 — File Mapping (What moved where)

| Original File | v2.0 Location | Notes |
|---------------|---------------|-------|
| `index.js` | `src/index.js` | Bootstrap only, logic moved to BotManager |
| `src/client.js` | `src/bot/managers/BotManager.js` | Wrapped in class |
| `kythia.config.js` | `src/config/index.js` | Reads from env vars |
| `example.env` | `.env.example` | Added SaaS-specific vars |
| `addons/api/server.js` | Preserved + proxied via `src/api/routes/addons.js` | Hono server untouched |
| `addons/*/` | `addons/*/` | **All addons preserved as-is** |
| `sharding.js` | `src/bot/sharding.js` | Minor path update |

---

## Phase 2 — New Files Added

These are net-new files that add the SaaS layer. Nothing was deleted.

```
src/index.js                         ← new bootstrap
src/bot/managers/BotManager.js       ← wraps kythia-core boot
src/api/server.js                    ← Express SaaS API
src/api/routes/auth.js               ← Discord OAuth2
src/api/routes/guilds.js             ← Guild CRUD
src/api/routes/bot.js                ← Bot status
src/api/routes/addons.js             ← Addon proxy
src/api/middleware/auth.js           ← isAuthenticated, hasGuildAccess
src/api/middleware/session.js        ← MongoDB sessions
src/api/middleware/errorHandler.js   ← Centralised errors
src/config/index.js                  ← Unified config
src/database/connection.js           ← DB connection manager
src/utils/logger/index.js            ← Structured logger
dashboard/                           ← Full React SaaS dashboard
ecosystem.config.js                  ← PM2 config
Dockerfile                           ← Container support
```

---

## Phase 3 — Step-by-Step Migration

### Step 1: Backup

```bash
cp -r kythia-main kythia-backup
```

### Step 2: Copy SaaS structure

```bash
# Copy new src/ files
cp -r kythia-saas/src ./src-new

# Copy new config files
cp kythia-saas/.env.example .env.example
cp kythia-saas/package.json package.json
cp kythia-saas/ecosystem.config.js ecosystem.config.js
cp kythia-saas/railway.json railway.json
cp kythia-saas/nixpacks.toml nixpacks.toml
cp kythia-saas/Dockerfile Dockerfile
cp kythia-saas/Procfile Procfile
cp kythia-saas/install.sh install.sh
```

### Step 3: Copy dashboard

```bash
cp -r kythia-saas/dashboard ./dashboard
```

### Step 4: Update environment variables

Your existing `.env` still works. Add the new SaaS-specific vars:

```env
# Add these to your existing .env
SESSION_SECRET=<generate a long random string>
DASHBOARD_URL=https://xyrox.qzz.io
OAUTH_CALLBACK=https://xyrox-production.up.railway.app/api/auth/discord/callback
API_ALLOWED_ORIGIN=https://xyrox.qzz.io,http://localhost:3000
MONGODB_URI=<optional, for session persistence>
```

### Step 5: Install new dependencies

```bash
npm install
cd dashboard && npm install && cd ..
```

### Step 6: Test locally

```bash
# Start bot + API
npm run dev

# Start dashboard (separate terminal)
cd dashboard && npm run dev
```

### Step 7: Verify all addons load

Check the console output for:
```
[OK]     Bot system online { tag: 'Kythia#0000' }
[OK]     API server listening on port 3001
[OK]     ✅ Kythia is fully operational
```

### Step 8: Test OAuth flow

1. Open http://localhost:3000
2. Click "Login with Discord"
3. Authorize
4. Should redirect back to dashboard with your guild list

---

## Phase 4 — Production Deployment

### Railway (Bot + API)

```bash
# In Discord Developer Portal:
# Add OAuth2 redirect: https://xyrox-production.up.railway.app/api/auth/discord/callback

# Railway env vars (minimum):
DISCORD_BOT_TOKEN=...
DISCORD_BOT_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
SESSION_SECRET=...
DASHBOARD_URL=https://xyrox.qzz.io
OAUTH_CALLBACK=https://xyrox-production.up.railway.app/api/auth/discord/callback
API_ALLOWED_ORIGIN=https://xyrox.qzz.io
ACCEPT_TOS=true
DATA_COLLECTION=true
```

### Vercel (Dashboard)

```bash
cd dashboard
vercel deploy --prod

# Vercel env vars:
VITE_API_URL=https://xyrox-production.up.railway.app
VITE_APP_URL=https://xyrox.qzz.io
VITE_CLIENT_ID=<your Discord client ID>
```

---

## Phase 5 — Verification Checklist

- [ ] Bot comes online in Discord
- [ ] All addons load (check Railway logs)
- [ ] Dashboard accessible at https://xyrox.qzz.io
- [ ] Discord OAuth login works
- [ ] Guild list shows with hasBot flag
- [ ] Guild config loads in dashboard
- [ ] Config changes save and persist
- [ ] Socket.IO reconnect banner works
- [ ] Logout clears session cookie

---

## Rollback Plan

If anything breaks, the original Kythia codebase is completely intact.
The SaaS rewrite only adds files — nothing was deleted or modified in the original addon system.

```bash
# Rollback to original
node index.js  # original entry point still works if kythia.config.js is present
```
