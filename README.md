# 🤖 Xyrox Discord SaaS Bot

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**A production-ready Discord bot + dashboard SaaS inspired by Carl-bot + Dyno**

[Features](#-features) • [Installation](#-installation) • [Configuration](#-configuration) • [Dashboard](#-dashboard) • [Commands](#-commands)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [Commands](#-commands)
- [Dashboard](#-dashboard)
- [AutoMod System](#-automod-system)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Overview

Xyrox is a **production-ready Discord bot** with a comprehensive web dashboard, designed to provide server moderation, automation, and management features comparable to industry leaders like Carl-bot and Dyno.

### Key Highlights

✅ **Full AutoMod System** - Spam, caps, links, invites, mentions, bad words  
✅ **Anti-Nuke Protection** - Prevent mass bans, kicks, and channel deletions  
✅ **Flexible Command System** - Slash commands, prefix commands, or both  
✅ **Web Dashboard** - Carl.gg-style real-time configuration  
✅ **Logging System** - Track all server events  
✅ **Reaction Roles** - Emoji, button, and select menu support  
✅ **Custom Commands** - Create dynamic server-specific commands  
✅ **Ticket System** - Support ticket management  
✅ **Welcome/Leave System** - Customizable greetings  

---

## ✨ Features

### 🛡️ Auto Moderation System

The AutoMod system provides comprehensive automatic moderation with configurable rules:

| Feature | Description |
|---------|-------------|
| **Anti-Spam** | Detects repeated messages in short timeframes |
| **Anti-Caps** | Removes messages with excessive capital letters (configurable %) |
| **Anti-Links** | Blocks unauthorized URLs with whitelist support |
| **Anti-Invites** | Prevents Discord invite links (whitelist available) |
| **Anti-Mention Spam** | Limits user/role mentions per message |
| **Anti-Bad Words** | Custom profanity filter per server |

**Punishment System:**
- Configurable warnings (default: 3)
- Actions: Mute, Kick, or Ban
- Automatic escalation
- Dashboard-controlled settings

### 🚨 Anti-Nuke System

Protect your server from malicious attacks:

- Mass ban/kick detection
- Channel deletion prevention
- Role abuse monitoring
- Whitelist trusted users
- Automatic rollback actions
- Configurable thresholds

### 📝 Logging System

Track all server activities:

- Message edits/deletions
- Member joins/leaves
- Bans/kicks/timeouts
- Role updates
- Channel changes
- Customizable log channel

### 🎭 Reaction Roles

Multiple implementation types:

- **Emoji Reactions** - Traditional emoji-based roles
- **Button Roles** - Modern Discord buttons
- **Select Menus** - Dropdown role selection

### 🤖 Custom Commands

Create server-specific commands with:

- Variable support (`{user}`, `{server}`, `{channel}`)
- Embed support
- Auto-delete trigger messages
- Rich formatting options

### 🎟️ Ticket System

Complete support ticket solution:

- Ticket panels with buttons
- Auto-create categories
- Support role assignment
- Transcript generation
- Close/archive tickets

### 👋 Welcome/Leave System

Customizable member greetings:

- Welcome messages with embeds
- Leave notifications
- Placeholder variables
- DM new members option
- Image support

---

## 🛠️ Tech Stack

### Backend
- **Discord.js v14** - Discord API wrapper
- **Node.js** - Runtime environment
- **Express** - API server
- **MongoDB/Mongoose** - Database
- **Socket.io** - Real-time communication
- **Passport.js** - OAuth authentication

### Frontend (Dashboard)
- **React 18** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client

---

## 📦 Installation

### Prerequisites

- Node.js v18.0.0 or higher
- MongoDB (local or Atlas)
- Discord Bot Token
- Discord Application (for OAuth)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/xyrox-discord-bot.git
cd xyrox-discord-bot
```

### Step 2: Install Dependencies

```bash
# Install bot dependencies
npm install

# Install dashboard dependencies
cd dashboard
npm install
cd ..
```

### Step 3: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Bot Configuration
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id
CLIENT_SECRET=your_bot_client_secret

# Database
MONGODB_URI=mongodb://localhost:27017/xyrox-bot

# Dashboard
DASHBOARD_URL=http://localhost:3000
API_PORT=5000
SESSION_SECRET=your_random_session_secret

# OAuth
OAUTH_CALLBACK=http://localhost:5000/auth/discord/callback

# Environment
NODE_ENV=development
```

### Step 4: Setup Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to **Bot** section:
   - Click "Add Bot"
   - Copy the token → `BOT_TOKEN`
   - Enable all **Privileged Gateway Intents**
4. Go to **OAuth2** section:
   - Copy Client ID → `CLIENT_ID`
   - Copy Client Secret → `CLIENT_SECRET`
   - Add redirect URL: `http://localhost:5000/auth/discord/callback`

### Step 5: Deploy Slash Commands

```bash
npm run deploy
```

### Step 6: Start the Bot

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Step 7: Start the Dashboard

```bash
# In a separate terminal
npm run dashboard
```

The dashboard will be available at `http://localhost:3000`

---

## ⚙️ Configuration

### Command Mode System

Each server can configure how commands are executed:

| Mode | Description |
|------|-------------|
| `slash` | Slash commands only (/) - **DEFAULT** |
| `prefix` | Prefix commands only (?) |
| `both` | Hybrid mode - both slash and prefix |

**Configure via:**
- Dashboard Settings page
- `/settings` command
- Database directly

### Database Schema

The Guild schema (`src/models/Guild.js`) contains:

```javascript
{
  guildId: String,
  commandMode: 'slash' | 'prefix' | 'both',
  prefix: String (default: '?'),
  
  automod: { /* AutoMod settings */ },
  antinuke: { /* Anti-nuke settings */ },
  logs: { /* Logging settings */ },
  welcome: { /* Welcome system */ },
  leave: { /* Leave system */ },
  reactionRoles: [ /* Reaction roles */ ],
  customCommands: [ /* Custom commands */ ],
  tickets: { /* Ticket system */ },
  warnings: [ /* User warnings */ ]
}
```

---

## 🏗️ Architecture

### Project Structure

```
xyrox-discord-bot/
├── src/
│   ├── index.js                 # Main bot entry point
│   ├── deploy-commands.js       # Slash command deployment
│   │
│   ├── commands/                # Command handlers
│   │   ├── moderation/         # Moderation commands
│   │   ├── utility/            # Utility commands
│   │   ├── fun/                # Fun commands
│   │   └── admin/              # Admin commands
│   │
│   ├── events/                  # Discord.js event handlers
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   ├── messageCreate.js
│   │   └── ...
│   │
│   ├── models/                  # MongoDB schemas
│   │   └── Guild.js
│   │
│   ├── middleware/              # Custom middleware
│   │   └── commandHandler.js   # Command validation & AutoMod
│   │
│   ├── handlers/                # Feature handlers
│   │   ├── ticketHandler.js
│   │   ├── reactionRoleHandler.js
│   │   └── ...
│   │
│   └── api/                     # Express API
│       ├── routes/
│       │   ├── auth.js
│       │   ├── guilds.js
│       │   └── ...
│       └── middleware/
│
├── dashboard/                   # React dashboard
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Sidebar.js
│   │   │   └── ...
│   │   └── pages/
│   │       ├── Dashboard.js
│   │       ├── AutoMod.js
│   │       ├── Logging.js
│   │       └── ...
│   └── package.json
│
├── package.json
├── .env.example
└── README.md
```

### Command Execution Flow

```
User Input
    ↓
Command Mode Validation (middleware)
    ↓
Permission Check
    ↓
Cooldown Check
    ↓
AutoMod Check (for messages)
    ↓
Execute Command
    ↓
Emit to Dashboard (Socket.io)
```

### AutoMod Processing Flow

```
Message Received
    ↓
Check if AutoMod Enabled
    ↓
Check Ignored Roles/Channels
    ↓
Run Rule Checks:
  - Anti-Spam
  - Anti-Caps
  - Anti-Links
  - Anti-Invites
  - Anti-Mention Spam
  - Anti-Bad Words
    ↓
Violations Found?
    ↓
Delete Message
    ↓
Add Warning to Database
    ↓
Check Warning Count
    ↓
Apply Punishment if Needed:
  - Mute (timeout)
  - Kick
  - Ban
```

---

## 🎮 Commands

### Moderation Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/automod enable` | Enable AutoMod system | Administrator |
| `/automod disable` | Disable AutoMod system | Administrator |
| `/automod config` | View AutoMod configuration | Administrator |
| `/automod toggle` | Toggle specific AutoMod rule | Administrator |
| `/automod punishment` | Set punishment type | Administrator |
| `/automod addword` | Add word to bad words filter | Administrator |
| `/automod removeword` | Remove word from filter | Administrator |
| `/ban` | Ban a user | Ban Members |
| `/unban` | Unban a user | Ban Members |
| `/kick` | Kick a user | Kick Members |
| `/timeout` | Timeout a user | Moderate Members |
| `/warn` | Warn a user | Moderate Members |
| `/warnings` | View user warnings | Moderate Members |
| `/clear` | Clear messages | Manage Messages |
| `/lock` | Lock a channel | Manage Channels |
| `/unlock` | Unlock a channel | Manage Channels |
| `/slowmode` | Set slowmode | Manage Channels |

### Anti-Nuke Commands

| Command | Description |
|---------|-------------|
| `/antinuke enable` | Enable anti-nuke protection |
| `/antinuke disable` | Disable anti-nuke protection |
| `/antinuke config` | Configure anti-nuke settings |
| `/whitelist add` | Add user to whitelist |
| `/whitelist remove` | Remove user from whitelist |

### Logging Commands

| Command | Description |
|---------|-------------|
| `/logs setup` | Setup logging system |
| `/logs disable` | Disable logging |
| `/logs channel` | Set logging channel |

### Reaction Role Commands

| Command | Description |
|---------|-------------|
| `/reactionrole create` | Create a reaction role |
| `/reactionrole add` | Add role to reaction role |
| `/reactionrole remove` | Remove role from reaction role |
| `/reactionrole delete` | Delete a reaction role |

### Custom Command Commands

| Command | Description |
|---------|-------------|
| `/customcommand create` | Create a custom command |
| `/customcommand delete` | Delete a custom command |
| `/customcommand edit` | Edit a custom command |
| `/customcommand list` | List all custom commands |

### Welcome System Commands

| Command | Description |
|---------|-------------|
| `/welcome setup` | Setup welcome system |
| `/welcome message` | Edit welcome message |
| `/leave setup` | Setup leave system |

### Ticket System Commands

| Command | Description |
|---------|-------------|
| `/ticket setup` | Setup ticket system |
| `/ticket close` | Close a ticket |
| `/ticket panel` | Create ticket panel |
| `/ticket transcript` | Generate transcript |

### Utility Commands

| Command | Description |
|---------|-------------|
| `/ping` | Check bot latency |
| `/help` | View all commands |
| `/userinfo` | Get user information |
| `/serverinfo` | Get server information |
| `/avatar` | Get user avatar |
| `/botinfo` | Get bot information |
| `/invite` | Get bot invite link |

### Fun Commands

| Command | Description |
|---------|-------------|
| `/meme` | Get a random meme |
| `/joke` | Get a random joke |
| `/8ball` | Ask the magic 8ball |
| `/coinflip` | Flip a coin |
| `/roll` | Roll a dice |

---

## 🌐 Dashboard

### Features

The web dashboard provides:

- **Discord OAuth Login** - Secure authentication
- **Server Selector** - Manage multiple servers
- **Real-time Sync** - Socket.io updates
- **AutoMod Panel** - Full AutoMod configuration
- **Logging Panel** - Configure event logging
- **Reaction Roles Editor** - Visual role manager
- **Custom Commands Editor** - Create/edit commands
- **Welcome System Editor** - Message customization
- **Anti-Nuke Panel** - Security settings
- **Statistics** - Server analytics

### Dashboard Pages

| Page | Description |
|------|-------------|
| `/` | Dashboard overview |
| `/automod` | AutoMod configuration |
| `/logging` | Logging settings |
| `/welcome` | Welcome/leave messages |
| `/reaction-roles` | Reaction role manager |
| `/custom-commands` | Custom command editor |
| `/tickets` | Ticket system setup |
| `/settings` | Server settings |

### Real-time Updates

Socket.io enables:
- Instant config updates
- Live command execution feedback
- Real-time statistics
- Synchronized state across dashboard and bot

---

## 🛡️ AutoMod System

### Configuration Options

```javascript
{
  enabled: Boolean,              // Master toggle
  
  // Rules
  antiSpam: Boolean,
  antiCaps: Boolean,
  antiLinks: Boolean,
  antiInvites: Boolean,
  antiMentionSpam: Boolean,
  antiBadWords: Boolean,
  
  // Thresholds
  spamThreshold: Number,         // Messages in timeframe
  spamTimeframe: Number,         // Milliseconds
  capsPercentage: Number,        // % of caps (0-100)
  maxMentions: Number,           // Max mentions per message
  
  // Filters
  badWords: [String],            // Custom word list
  whitelistedLinks: [String],    // Allowed domains
  whitelistedInvites: [String],  // Allowed invites
  
  // Punishment
  maxWarnings: Number,           // Warnings before punishment
  punishment: 'mute' | 'kick' | 'ban',
  muteDuration: Number,          // Timeout duration (ms)
  
  // Exclusions
  ignoredRoles: [String],        // Role IDs to ignore
  ignoredChannels: [String]      // Channel IDs to ignore
}
```

### Example Configuration

```javascript
{
  automod: {
    enabled: true,
    antiSpam: true,
    antiCaps: true,
    antiLinks: true,
    antiInvites: true,
    antiMentionSpam: true,
    antiBadWords: true,
    
    spamThreshold: 5,
    spamTimeframe: 5000,
    capsPercentage: 70,
    maxMentions: 5,
    
    badWords: ['badword1', 'badword2'],
    whitelistedLinks: ['youtube.com', 'twitch.tv'],
    
    maxWarnings: 3,
    punishment: 'mute',
    muteDuration: 600000  // 10 minutes
  }
}
```

---

## 📡 API Documentation

### Authentication

All API routes require Discord OAuth authentication.

### Endpoints

#### Get Guild Config
```http
GET /api/guilds/:guildId/config
```

**Response:**
```json
{
  "guildId": "123456789",
  "commandMode": "slash",
  "automod": { ... },
  "logs": { ... },
  ...
}
```

#### Update Guild Config
```http
PATCH /api/guilds/:guildId/config
Content-Type: application/json

{
  "automod": {
    "enabled": true,
    "punishment": "mute"
  }
}
```

#### Get Guild Stats
```http
GET /api/guilds/:guildId/stats
```

**Response:**
```json
{
  "totalWarnings": 15,
  "customCommands": 8,
  "reactionRoles": 3,
  "automodEnabled": true,
  "logsEnabled": true,
  "welcomeEnabled": true
}
```

---

## 🚀 Deployment

### Production Setup

1. **Set Environment to Production**
```env
NODE_ENV=production
DASHBOARD_URL=https://yourdomain.com
OAUTH_CALLBACK=https://api.yourdomain.com/auth/discord/callback
```

2. **Use Process Manager**
```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start src/index.js --name xyrox-bot

# Start dashboard (build first)
cd dashboard
npm run build
pm2 serve build 3000 --name xyrox-dashboard
```

3. **Setup Reverse Proxy (Nginx)**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Setup SSL with Let's Encrypt**
```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Database Backup

```bash
# MongoDB backup
mongodump --db xyrox-bot --out /backup/xyrox-$(date +%Y%m%d)
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [Carl-bot](https://carl.gg/) and [Dyno](https://dyno.gg/)
- Built with [Discord.js](https://discord.js.org/)
- Dashboard inspired by Carl.gg's design

---

## 📞 Support

- **Discord Server:** [Join here](https://discord.gg/xyrox)
- **Documentation:** [docs.xyrox.bot](https://docs.xyrox.bot)
- **Issues:** [GitHub Issues](https://github.com/yourusername/xyrox-discord-bot/issues)

---

<div align="center">

**Made with ❤️ by the Xyrox Team**

⭐ Star this repository if you find it helpful!

</div>
