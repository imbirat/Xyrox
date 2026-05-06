# Xyrox Deployment Guide

## Overview
- **Bot + API** → Railway: `https://xyrox-production.up.railway.app`
- **Dashboard** → Vercel: `https://xyrox.vercel.app`

---

## Part 1 — Deploy Bot to Railway

### Step 1: Push to GitHub
Create a GitHub repo and push the **root** of this project (not the dashboard subfolder).

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/xyrox-bot
git push -u origin main
```

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo
3. Railway auto-detects Node.js via `nixpacks.toml` ✅

### Step 3: Add Environment Variables on Railway
Go to your service → **Variables** tab and add:

| Variable | Value |
|---|---|
| `BOT_TOKEN` | Your Discord bot token |
| `CLIENT_ID` | Your Discord application Client ID |
| `CLIENT_SECRET` | Your Discord application Client Secret |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `DASHBOARD_URL` | `https://xyrox.vercel.app` |
| `API_PORT` | `5000` |
| `SESSION_SECRET` | A long random string (e.g. 64 random chars) |
| `OAUTH_CALLBACK` | `https://xyrox-production.up.railway.app/api/auth/discord/callback` |
| `NODE_ENV` | `production` |

### Step 4: Set Custom Domain on Railway
1. Railway → Settings → **Networking** → Generate Domain
2. Set it to match: `xyrox-production.up.railway.app`

### Step 5: Update Discord OAuth2 Redirect
In the [Discord Developer Portal](https://discord.com/developers/applications):
- Go to your app → **OAuth2**
- Add redirect: `https://xyrox-production.up.railway.app/api/auth/discord/callback`

### Step 6: Deploy slash commands (once)
After the bot is live, run from your local machine:
```bash
BOT_TOKEN=xxx CLIENT_ID=xxx node src/deploy-commands.js
```

---

## Part 2 — Deploy Dashboard to Vercel

### Step 1: Push dashboard to GitHub
The dashboard can be in the same repo or a separate one.
If same repo, Vercel will detect the `dashboard/` subfolder.

### Step 2: Import to Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
2. Select your repo
3. Set **Root Directory** to `dashboard`
4. Framework Preset: **Create React App**

### Step 3: Add Environment Variable on Vercel
In Project Settings → **Environment Variables**:

| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | `https://xyrox-production.up.railway.app` |

> The `dashboard/.env.production` file already sets this, but adding it in the Vercel UI ensures it's always used.

### Step 4: Deploy
Click **Deploy** — Vercel builds with `npm run build` and serves from `build/`.

---

## Verify Everything Works

1. Visit `https://xyrox.vercel.app` → Should show Xyrox Dashboard login page
2. Click **Login with Discord** → Should redirect to Discord OAuth
3. After OAuth → Should redirect back to `https://xyrox.vercel.app` with your guilds
4. Visit `https://xyrox-production.up.railway.app/health` → Should return `{"status":"ok",...}`

---

## Architecture

```
Discord Users
     │
     ▼
[Discord Gateway] ◄──── [Bot on Railway :5000]
                               │
                        [MongoDB Atlas]
                               │
                    [Express API on Railway]
                               ▲
                               │ (API calls with credentials)
                    [Dashboard on Vercel]
                               ▲
                               │
                         Browser Users
```

## Troubleshooting

**CORS errors**: Make sure `DASHBOARD_URL` on Railway is exactly `https://xyrox.vercel.app` (no trailing slash).

**Session not persisting**: The session cookie requires `sameSite: 'none'` and `secure: true` for cross-origin. This is already configured in `src/api/middleware/session.js`.

**OAuth callback mismatch**: The Discord Developer Portal redirect URL must exactly match `OAUTH_CALLBACK` env var on Railway.
