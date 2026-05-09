# Xyrox — Deployment Guide v2

---

## What Was Fixed (This Session)

| # | Issue | File | Impact |
|---|-------|------|--------|
| 1 | Malformed `{src` folder in project root | Deleted | Caused Railway build failures — unresolvable path |
| 2 | `validateEnv()` called `process.exit(1)` mid-import | `validateEnv.js` | Process crashed before any output — impossible to debug |
| 3 | No structured logger — plain `console.log` | New `logger.js` | Unreadable Railway logs; no timestamps or severity |
| 4 | No centralised error handler middleware | New `errorHandler.js` | Unhandled errors hung requests or leaked stack traces |
| 5 | `useNavigate` imported but never used in App.js | `App.js` | React build warning; lint failure in strict mode |
| 6 | `nodemon` in deps but no `nodemon.json` config | New `nodemon.json` | `npm run dev` worked but watched wrong dirs |
| 7 | No `nixpacks.toml` — Railway guessed Node version | New `nixpacks.toml` | Intermittent deploys with wrong Node version |
| 8 | PORT fallback was `5000` not `3000` | `index.js` | Railway uses 3000 as default — mismatch caused 503s |
| 9 | Socket.IO config could throw without try/catch | `index.js` | Uncaught sync error crashed process before HTTP started |
| 10 | MemoryStore session warning in production | `session.js` | Console flooded with Express warnings; sessions lost on restart |

---

## Previous Session Fixes (Still Present)

| Issue | File |
|-------|------|
| `export default router` mid-file — channels/roles dead | `guilds.js` |
| `clearCookie('connect.sid')` — wrong name, logout broken | `auth.js` |
| `trust proxy` set after CORS — secure cookies rejected | `index.js` |
| `<BrowserRouter>` inside App() — route resets on auth change | `index.js` / `App.js` |
| Rate limiting imported but never applied | `index.js` |
| No compression middleware | `index.js` |
| Socket.IO `update-config` unauthenticated | `index.js` |
| No global error handler | `index.js` |
| MongoDB operator injection in PATCH /config | `guilds.js` |
| Socket.IO connected before auth | `App.js` |
| `vercel.json` using deprecated v1 routes format | `vercel.json` |
| No env var validation | `validateEnv.js` |
| MongoDB not production-hardened | `index.js` |
| Scattered fetch() calls missing credentials:include | `api.js` |

---

## File Map

```
Xyrox-fixed/
├── .env.example                        ← Copy to .env and fill in
├── .gitignore                          ← Prevents .env and node_modules commits
├── nodemon.json                        ← Dev server config (npm run dev)
├── nixpacks.toml                       ← Pins Node 20 on Railway
├── package.json                        ← Backend deps + scripts
├── railway.json                        ← Railway deploy config
├── DEPLOYMENT.md                       ← This file
│
├── src/
│   ├── index.js                        ← Main entry point — all boot logic
│   ├── utils/
│   │   ├── logger.js                   ← Coloured structured logger
│   │   └── validateEnv.js             ← Env validation (returns result, no crash)
│   └── api/
│       ├── middleware/
│       │   ├── session.js              ← MongoDB session store
│       │   └── errorHandler.js        ← Centralised Express error handler
│       └── routes/
│           ├── auth.js                 ← Discord OAuth routes
│           └── guilds.js              ← Guild API routes
│
└── dashboard/
    ├── vercel.json                     ← Vercel v2 config with rewrites
    ├── package.json                    ← Frontend deps
    └── src/
        ├── index.js                    ← Stable BrowserRouter root
        ├── App.js                      ← Main React app (no useNavigate import)
        └── utils/
            └── api.js                  ← Centralised fetch utility
```

---

## Railway Deployment

### 1. Environment Variables
Set these in Railway → Project → Variables:

| Variable | Value |
|----------|-------|
| `BOT_TOKEN` | Discord bot token |
| `CLIENT_ID` | Discord application ID |
| `CLIENT_SECRET` | Discord OAuth secret |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | 48+ random bytes (see below) |
| `OAUTH_CALLBACK` | `https://YOUR-RAILWAY-DOMAIN/api/auth/discord/callback` |
| `DASHBOARD_URL` | `https://YOUR-VERCEL-DOMAIN` (no trailing slash) |
| `NODE_ENV` | `production` |

Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Discord Developer Portal
Add this redirect URI exactly (no trailing slash, no typos):
```
https://YOUR-RAILWAY-DOMAIN/api/auth/discord/callback
```

### 3. Deploy Steps
```bash
# Push to GitHub, then in Railway:
# 1. New Project → Deploy from GitHub
# 2. Set all environment variables
# 3. Watch deploy logs for:
#    ✔ [OK]   All environment variables validated
#    ✔ [OK]   MongoDB connected to: cluster.mongodb.net
#    ✔ [OK]   HTTP server listening on port XXXX
#    ✔ [OK]   Discord bot logged in as: Xyrox#0000
```

### 4. Verify
```bash
curl https://YOUR-RAILWAY-DOMAIN/health
# Expected: {"status":"ok","uptime":N,"guilds":N,"mongoState":1,...}
```

---

## Vercel Deployment

### 1. Environment Variables
Set in Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://YOUR-RAILWAY-DOMAIN` (no trailing slash) |
| `REACT_APP_CLIENT_ID` | Your Discord application ID |

### 2. Project Settings
- Framework Preset: **Create React App** (auto-detected via vercel.json)
- Root Directory: `dashboard` (if monorepo)
- Build Command: `npm run build`
- Output Directory: `build`

### 3. Why vercel.json rewrites matter
The `"source": "/(.*)" → "/index.html"` rewrite is what makes React Router work on
page refresh. Without it, refreshing `/automod` returns Vercel's own 404 page.

---

## Startup Checklist

### Pre-deploy
- [ ] Discord application created at discord.com/developers/applications
- [ ] Bot created and added to the application
- [ ] All 7 required env vars set in Railway
- [ ] `OAUTH_CALLBACK` in Railway matches Discord portal redirect URL exactly
- [ ] `DASHBOARD_URL` in Railway matches Vercel URL exactly (no trailing slash)
- [ ] MongoDB Atlas network: IP `0.0.0.0/0` allowed (or specific Railway IPs)
- [ ] `REACT_APP_API_URL` set in Vercel

### Post-deploy verification
- [ ] `GET /health` → `{ "status": "ok", "mongoState": 1 }`
- [ ] Vercel URL loads landing page
- [ ] "Login with Discord" redirects to Discord OAuth
- [ ] After approval → redirected back to dashboard (not a loop)
- [ ] Guild list shows ✔ on servers where bot is present
- [ ] Selecting a guild loads the config dashboard
- [ ] Making a setting change → PATCH succeeds (check Network tab)
- [ ] Page refresh on /automod → stays on /automod (not blank)
- [ ] Logout → landing page, session cleared

---

## Debugging

### Startup crashes immediately
Check Railway logs for the red `✖ [ERROR]` lines from `validateEnv.js`.
Every missing variable is listed with a hint for where to find it.

### CORS errors in browser
- `DASHBOARD_URL` must exactly match the request Origin header
- No trailing slash on `DASHBOARD_URL`
- Supports comma-separated list for multiple origins

### Session not persisting / login loop
1. Check Railway logs: `🍪 Cookie config: { secure: true, sameSite: 'none' }`
2. Browser DevTools → Application → Cookies → `xyrox.sid` must be present
3. Cookie missing = `trust proxy` not set (it is — verify you deployed the fix)
4. Check `SESSION_SECRET` and MongoDB connection are both working

### 404 on page refresh (e.g. /automod)
- `vercel.json` `rewrites` rule must be present — redeploy Vercel after updating

### "Bot not ready" on channels/roles endpoints
- Bot takes ~5s to connect after server start
- Check `/health` → `guilds` count should be > 0

### MemoryStore warning in logs
- Set `MONGODB_URI` in Railway and redeploy — MongoStore kicks in automatically

### `{src` folder appearing in git
- Already in `.gitignore`
- If it appeared before: `git rm -r --cached "{src"` then commit
