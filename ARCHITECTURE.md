# 🏗️ Xyrox Bot - Architecture Documentation

## Table of Contents
- [System Overview](#system-overview)
- [Command System](#command-system)
- [AutoMod System](#automod-system)
- [Real-time Communication](#real-time-communication)
- [Security](#security)
- [Performance](#performance)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        XYROX ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Discord    │◄────►│  Discord Bot │◄────►│  MongoDB  │ │
│  │   Servers    │      │  (Discord.js)│      │ Database  │ │
│  └──────────────┘      └──────┬───────┘      └───────────┘ │
│                               │                              │
│                               │ Socket.io                    │
│                               ▼                              │
│                      ┌─────────────────┐                     │
│                      │  Express API    │                     │
│                      │  Server         │                     │
│                      └────────┬────────┘                     │
│                               │                              │
│                               │ HTTP/WebSocket               │
│                               ▼                              │
│                      ┌─────────────────┐                     │
│                      │ React Dashboard │                     │
│                      │  (Frontend)     │                     │
│                      └─────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Bot Core | Discord.js v14 | Discord API interaction |
| Runtime | Node.js 18+ | JavaScript execution |
| Database | MongoDB + Mongoose | Data persistence |
| API Server | Express.js | REST API endpoints |
| Real-time | Socket.io | Live dashboard updates |
| Frontend | React 18 | Dashboard UI |
| Styling | Tailwind CSS | Dashboard design |
| Auth | Passport.js | OAuth authentication |

---

## Command System

### Hybrid Command Architecture

The bot supports three command modes per guild:

1. **Slash Only** (`/` commands) - Default
2. **Prefix Only** (`?` commands)
3. **Both** (Hybrid mode)

### Command Execution Flow

```
User Input
    │
    ├─── Slash Command (/ban)
    │       │
    │       ├── interactionCreate Event
    │       │       │
    │       │       ├── Fetch Guild Config
    │       │       │
    │       │       ├── Validate Command Mode
    │       │       │    (check if slash allowed)
    │       │       │
    │       │       ├── Permission Check
    │       │       │
    │       │       ├── Cooldown Check
    │       │       │
    │       │       └── Execute Command
    │       │
    │       └── Response to User
    │
    └─── Prefix Command (?ban)
            │
            ├── messageCreate Event
            │       │
            │       ├── AutoMod Check First
            │       │    (spam, caps, links, etc.)
            │       │
            │       ├── Fetch Guild Config
            │       │
            │       ├── Validate Command Mode
            │       │    (check if prefix allowed)
            │       │
            │       ├── Parse Command & Args
            │       │
            │       ├── Permission Check
            │       │
            │       └── Execute Command
            │
            └── Response to User
```

### Command Structure

```javascript
// Example Command File: src/commands/moderation/ban.js
export default {
    // Slash command data
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user')
        .addUserOption(...)
        .addStringOption(...),
    
    // Prefix command support
    name: 'ban',
    aliases: ['b', 'banish'],
    
    // Permissions required
    permissions: [PermissionFlagsBits.BanMembers],
    
    // Cooldown in seconds
    cooldown: 3,
    
    // Execution function
    async execute(interaction) {
        // Command logic
    }
};
```

### Command Mode Validation

**Middleware:** `src/middleware/commandHandler.js`

```javascript
export async function validateCommandMode(interaction, isSlash) {
    const guildConfig = await getGuildConfig(guildId);
    const mode = guildConfig.commandMode;
    
    // Validation rules
    if (mode === 'slash' && !isSlash) return false;
    if (mode === 'prefix' && isSlash) return false;
    if (mode === 'both') return true;
    
    return true;
}
```

### Guild Config Caching

To optimize performance, guild configs are cached:

```javascript
const guildCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

export async function getGuildConfig(guildId) {
    // Check cache first
    const cached = guildCache.get(guildId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    // Fetch from database
    let guildConfig = await Guild.findOne({ guildId });
    
    // Update cache
    guildCache.set(guildId, {
        data: guildConfig,
        timestamp: Date.now()
    });
    
    return guildConfig;
}
```

**Cache Invalidation:**
- On config update via dashboard
- On config update via commands
- After 5 minutes (TTL)

---

## AutoMod System

### AutoMod Pipeline

```
Message Received (messageCreate event)
    │
    ├── Bot Message? → Skip
    │
    ├── DM? → Skip
    │
    ├── Fetch Guild Config
    │
    ├── AutoMod Enabled? → No → Continue to command parsing
    │                      ↓ Yes
    │
    ├── Check Ignored Roles
    │   └── Has ignored role? → Skip AutoMod
    │
    ├── Check Ignored Channels
    │   └── In ignored channel? → Skip AutoMod
    │
    ├── Run Parallel Rule Checks:
    │   │
    │   ├── Anti-Spam Check
    │   │   └── Track message frequency
    │   │       └── Count messages in timeframe
    │   │           └── Exceeds threshold? → Violation
    │   │
    │   ├── Anti-Caps Check
    │   │   └── Count capital letters
    │   │       └── Calculate percentage
    │   │           └── > capsPercentage? → Violation
    │   │
    │   ├── Anti-Links Check
    │   │   └── Regex match URLs
    │   │       └── Check whitelist
    │   │           └── Not whitelisted? → Violation
    │   │
    │   ├── Anti-Invites Check
    │   │   └── Regex match Discord invites
    │   │       └── Check whitelist
    │   │           └── Not whitelisted? → Violation
    │   │
    │   ├── Anti-Mention Spam Check
    │   │   └── Count user + role mentions
    │   │       └── > maxMentions? → Violation
    │   │
    │   └── Anti-Bad Words Check
    │       └── Check against bad words list
    │           └── Match found? → Violation
    │
    ├── Violations Found?
    │   │
    │   ├── No → Continue to command parsing
    │   │
    │   └── Yes → Handle Violation:
    │           │
    │           ├── Delete message
    │           │
    │           ├── Fetch user warnings from DB
    │           │
    │           ├── Add new warning to DB
    │           │
    │           ├── Send warning message
    │           │   (auto-delete after 5 seconds)
    │           │
    │           ├── Check if max warnings reached
    │           │   │
    │           │   └── Yes → Apply Punishment:
    │           │           │
    │           │           ├── Mute (timeout)
    │           │           │   └── member.timeout(duration)
    │           │           │
    │           │           ├── Kick
    │           │           │   └── member.kick(reason)
    │           │           │
    │           │           └── Ban
    │           │               └── member.ban(reason)
    │           │
    │           └── Clear warnings after punishment
    │
    └── End
```

### Spam Detection Algorithm

**In-Memory Tracker:**

```javascript
const spamTracker = new Map();
// Structure: Map<'guildId-userId', [timestamp1, timestamp2, ...]>

export function checkSpam(message, guildConfig) {
    const key = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    
    // Get user's message timestamps
    if (!spamTracker.has(key)) {
        spamTracker.set(key, []);
    }
    
    const userMessages = spamTracker.get(key);
    
    // Remove messages outside timeframe
    const timeframe = guildConfig.automod.spamTimeframe; // 5000ms
    const recentMessages = userMessages.filter(timestamp => 
        now - timestamp < timeframe
    );
    
    // Add current message
    recentMessages.push(now);
    spamTracker.set(key, recentMessages);
    
    // Check threshold
    const threshold = guildConfig.automod.spamThreshold; // 5 messages
    if (recentMessages.length >= threshold) {
        return { isSpam: true, count: recentMessages.length };
    }
    
    return { isSpam: false };
}
```

**Memory Management:**
- Old entries auto-expire after timeframe
- Map size naturally limited by active users
- Optional periodic cleanup for inactive entries

### Rule Implementation Examples

**Anti-Caps:**
```javascript
if (automod.antiCaps && content.length > 10) {
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const capsPercentage = (capsCount / content.length) * 100;
    
    if (capsPercentage > automod.capsPercentage) {
        violations.push({
            type: 'caps',
            reason: `Message contains ${capsPercentage.toFixed(0)}% caps`
        });
    }
}
```

**Anti-Links:**
```javascript
if (automod.antiLinks) {
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    const links = content.match(linkRegex);
    
    if (links && links.length > 0) {
        const hasWhitelistedLink = links.some(link => 
            automod.whitelistedLinks.some(wl => link.includes(wl))
        );
        
        if (!hasWhitelistedLink) {
            violations.push({
                type: 'links',
                reason: 'Unauthorized links detected'
            });
        }
    }
}
```

**Anti-Invites:**
```javascript
const inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
const invites = content.match(inviteRegex);

if (invites && invites.length > 0) {
    const hasWhitelistedInvite = invites.some(invite => 
        automod.whitelistedInvites.some(wl => invite.includes(wl))
    );
    
    if (!hasWhitelistedInvite) {
        violations.push({
            type: 'invites',
            reason: 'Discord invites are not allowed'
        });
    }
}
```

---

## Real-time Communication

### Socket.io Architecture

**Server Side:**
```javascript
import { Server } from 'socket.io';

const io = new Server(httpServer, {
    cors: {
        origin: process.env.DASHBOARD_URL,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Store io instance on client
client.io = io;

// Connection handler
io.on('connection', (socket) => {
    console.log('Dashboard connected:', socket.id);
    
    socket.on('update-config', async (data) => {
        const { guildId, config } = data;
        
        // Emit to all connected clients
        io.emit('config-updated', { guildId, config });
        
        // Clear bot cache
        clearGuildCache(guildId);
    });
});
```

**Client Side (Dashboard):**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Listen for config updates
socket.on('config-updated', (data) => {
    if (data.guildId === selectedGuild.id) {
        setGuildConfig(data.config);
    }
});

// Send update to bot
const updateConfig = async (updates) => {
    // Update via API
    await fetch(`/api/guilds/${guildId}/config`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
    
    // Emit to bot
    socket.emit('update-config', {
        guildId,
        config: newConfig
    });
};
```

### Event Flow

```
Dashboard Update
    │
    ├── User changes AutoMod setting
    │
    ├── React calls updateConfig()
    │       │
    │       ├── PATCH /api/guilds/:id/config
    │       │       │
    │       │       ├── Update MongoDB
    │       │       │
    │       │       └── Return new config
    │       │
    │       └── Socket emit 'update-config'
    │
    ├── Server receives 'update-config'
    │       │
    │       ├── Clear guild cache
    │       │
    │       └── Broadcast 'config-updated'
    │
    └── All connected dashboards receive update
            │
            └── Re-render with new config
```

---

## Security

### Authentication Flow

```
User clicks "Login with Discord"
    │
    ├── Redirect to Discord OAuth
    │       │
    │       └── /api/auth/discord
    │
    ├── User authorizes on Discord
    │
    ├── Discord redirects to callback
    │       │
    │       └── /api/auth/discord/callback
    │
    ├── Server receives OAuth code
    │       │
    │       ├── Exchange code for access token
    │       │
    │       ├── Fetch user info from Discord
    │       │
    │       ├── Fetch user's guilds
    │       │
    │       └── Create session
    │
    └── Redirect to dashboard
```

### Permission Checks

**Bot Commands:**
```javascript
// Check if user has required permissions
if (command.permissions) {
    const hasPermission = member.permissions.has(command.permissions);
    if (!hasPermission) {
        return interaction.reply({
            content: '❌ You do not have permission.',
            ephemeral: true
        });
    }
}
```

**API Routes:**
```javascript
// Check if user has access to guild
const userGuilds = req.user.guilds || [];
const hasAccess = userGuilds.some(g => g.id === guildId);

if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
}
```

### Rate Limiting

**API Rate Limiting:**
```javascript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
    points: 10, // Number of requests
    duration: 1, // Per second
});

app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (err) {
        res.status(429).send('Too Many Requests');
    }
});
```

**Command Cooldowns:**
```javascript
const cooldowns = new Map();
const cooldownAmount = (command.cooldown || 3) * 1000;

if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    
    if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return interaction.reply({
            content: `Please wait ${timeLeft.toFixed(1)}s`,
            ephemeral: true
        });
    }
}
```

---

## Performance

### Optimization Strategies

**1. Database Indexing**
```javascript
guildSchema.index({ guildId: 1 });
guildSchema.index({ 'warnings.userId': 1 });
```

**2. Guild Config Caching**
- 5-minute TTL cache
- Reduces database queries by ~95%
- Invalidation on updates

**3. Connection Pooling**
```javascript
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10 // Connection pool
});
```

**4. Efficient Event Handling**
- Only listen to necessary intents
- Filter events early
- Use partials for large objects

**5. Memory Management**
- Spam tracker auto-cleanup
- Limited cache sizes
- Periodic garbage collection

### Monitoring

**Key Metrics:**
- Command execution time
- Database query performance
- Memory usage
- WebSocket connections
- API response times

**Logging:**
```javascript
import morgan from 'morgan';

// HTTP request logging
app.use(morgan('combined'));

// Custom bot logging
console.log('[COMMAND]', commandName, 'executed by', user.tag);
console.log('[AUTOMOD]', 'Violation detected:', violation.type);
```

---

## Scalability

### Horizontal Scaling

**Bot Sharding:**
```javascript
import { ShardingManager } from 'discord.js';

const manager = new ShardingManager('./src/index.js', {
    token: process.env.BOT_TOKEN,
    totalShards: 'auto'
});

manager.spawn();
```

**Database Replication:**
- MongoDB replica sets
- Read preference optimization
- Write concern levels

**Load Balancing:**
- Multiple API instances
- Nginx reverse proxy
- Session affinity for WebSockets

---

This architecture is designed to be:
- ✅ **Scalable** - Handles growth efficiently
- ✅ **Maintainable** - Clean separation of concerns
- ✅ **Performant** - Optimized for speed
- ✅ **Secure** - Multiple security layers
- ✅ **Real-time** - Instant synchronization

