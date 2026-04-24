# 🚀 Xyrox Bot - Quick Start Guide

Get your Xyrox bot up and running in 5 minutes!

## Prerequisites

- Node.js v18+ installed
- MongoDB running (local or cloud)
- Discord account
- Text editor (VS Code recommended)

---

## Step 1: Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Name it "Xyrox" and click **Create**

### Setup Bot

1. Go to **Bot** section in the sidebar
2. Click **"Add Bot"** → **"Yes, do it!"**
3. Under **Token**, click **"Reset Token"** and copy it (you'll need this)
4. Enable these **Privileged Gateway Intents**:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### Setup OAuth2

1. Go to **OAuth2** → **General**
2. Copy your **Client ID**
3. Copy your **Client Secret**
4. Under **Redirects**, add: `http://localhost:5000/auth/discord/callback`

---

## Step 2: Install Xyrox

```bash
# Clone or extract the project
cd xyrox-discord-bot

# Install dependencies
npm install

# Install dashboard dependencies
cd dashboard
npm install
cd ..
```

---

## Step 3: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Bot Configuration
BOT_TOKEN=paste_your_bot_token_here
CLIENT_ID=paste_your_client_id_here
CLIENT_SECRET=paste_your_client_secret_here

# Database
MONGODB_URI=mongodb://localhost:27017/xyrox-bot

# Dashboard
DASHBOARD_URL=http://localhost:3000
API_PORT=5000
SESSION_SECRET=your_random_secret_key_123456

# OAuth
OAUTH_CALLBACK=http://localhost:5000/auth/discord/callback

# Environment
NODE_ENV=development
```

**Generate a random SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Setup MongoDB

### Option A: Local MongoDB

```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# MongoDB will be available at: mongodb://localhost:27017
```

### Option B: MongoDB Atlas (Cloud - Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env`

---

## Step 5: Deploy Slash Commands

```bash
npm run deploy
```

You should see:
```
✅ Loaded: automod
✅ Loaded: ban
✅ Loaded: kick
... (more commands)

🚀 Started refreshing X application (/) commands.
✅ Successfully reloaded X application (/) commands.
```

---

## Step 6: Invite Bot to Your Server

1. Go to https://discord.com/developers/applications
2. Select your application
3. Go to **OAuth2** → **URL Generator**
4. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
5. Select permissions:
   - ✅ Administrator (or specific permissions you need)
6. Copy the generated URL
7. Open it in your browser
8. Select your server and authorize

---

## Step 7: Start the Bot

```bash
# Start the bot
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
✅ Commands loaded successfully
✅ Events loaded successfully
✅ API routes loaded successfully
🚀 API Server running on port 5000
✅ Logged in as Xyrox#1234
🤖 Xyrox Bot is online!
```

---

## Step 8: Start the Dashboard

Open a **new terminal window**:

```bash
npm run dashboard
```

The dashboard will open at: http://localhost:3000

---

## Step 9: Test the Bot

In your Discord server, try these commands:

```
/ping
/help
/serverinfo
/userinfo
```

### Setup AutoMod

```
/automod enable
/automod config
/automod toggle rule:Anti-Spam
```

Or use the dashboard:
1. Open http://localhost:3000
2. Click "Login with Discord"
3. Select your server
4. Go to "AutoMod" page
5. Enable AutoMod and configure rules

---

## Common Issues & Solutions

### Bot is offline
- ✅ Check your `BOT_TOKEN` is correct
- ✅ Make sure MongoDB is running
- ✅ Check console for errors

### Commands not showing
- ✅ Run `npm run deploy` again
- ✅ Wait 5-10 minutes (Discord caching)
- ✅ Try in a different server

### Dashboard won't login
- ✅ Check `CLIENT_ID` and `CLIENT_SECRET`
- ✅ Verify OAuth redirect URL matches
- ✅ Make sure both bot and API are running

### Permission errors
- ✅ Ensure bot has Administrator permission
- ✅ Check bot's role is higher than target roles
- ✅ Verify bot has necessary intents enabled

---

## Next Steps

### Configure AutoMod
1. Go to dashboard → AutoMod
2. Enable the system
3. Configure rules (spam, caps, links, etc.)
4. Set punishment type
5. Add bad words filter

### Setup Logging
1. Go to dashboard → Logging
2. Create a log channel
3. Enable events to track
4. Save configuration

### Create Custom Commands
1. Go to dashboard → Custom Commands
2. Click "Create Command"
3. Set name and response
4. Use variables: `{user}`, `{server}`, `{channel}`
5. Save

### Setup Welcome Messages
1. Go to dashboard → Welcome
2. Choose welcome channel
3. Customize message
4. Add embeds (optional)
5. Enable system

---

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start src/index.js --name xyrox-bot

# Build dashboard
cd dashboard
npm run build

# Serve dashboard
pm2 serve build 3000 --name xyrox-dashboard

# Save PM2 config
pm2 save
pm2 startup
```

### Environment Variables for Production

Update `.env`:
```env
NODE_ENV=production
DASHBOARD_URL=https://yourdomain.com
OAUTH_CALLBACK=https://api.yourdomain.com/auth/discord/callback
```

Update Discord OAuth redirects to match your production URL.

---

## Support & Resources

- 📖 **Full Documentation**: See `README.md`
- 🏗️ **Architecture Guide**: See `ARCHITECTURE.md`
- 💬 **Discord Support**: [Join our server]
- 🐛 **Report Issues**: [GitHub Issues]
- ⭐ **Star the project**: Help others find it!

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `/help` | View all commands |
| `/automod enable` | Enable AutoMod |
| `/antinuke enable` | Enable anti-nuke |
| `/logs setup` | Setup logging |
| `/welcome setup` | Setup welcome messages |

### Dashboard Pages

| Page | URL |
|------|-----|
| Dashboard | http://localhost:3000/ |
| AutoMod | http://localhost:3000/automod |
| Logging | http://localhost:3000/logging |
| Welcome | http://localhost:3000/welcome |
| Settings | http://localhost:3000/settings |

### Default Settings

- **Command Mode**: Slash commands only
- **Prefix**: `?`
- **AutoMod**: Disabled by default
- **Max Warnings**: 3
- **Punishment**: Mute (10 minutes)

---

**🎉 Congratulations! Your Xyrox bot is now running!**

Customize it further through the dashboard or by editing the configuration files.

Happy moderating! 🛡️
