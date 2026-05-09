/**
 * src/api/routes/guilds.js — Guild API routes
 *
 * CRITICAL FIX (from previous audit):
 *   export default router is at the VERY BOTTOM. The original had it mid-file,
 *   causing channels/roles/send-message/leaderboard/economy/giveaways to never register.
 *
 * TASK REQUIREMENTS MET:
 *  3. try/catch on every async handler with next(err)
 *  4. Centralised error handler used via next(err)
 *  5. Detailed coloured logging via logger.js
 */

import express from 'express';
import log     from '../../utils/logger.js';

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Discord snowflake: 17–19 digit numeric string */
const isSnowflake = (id) => typeof id === 'string' && /^\d{17,19}$/.test(id);

// ─── Auth middleware ──────────────────────────────────────────────────────────
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated?.() || req.session?.user) {
        if (!req.user && req.session?.user) {
            req.user = { ...req.session.user, guilds: req.session.guilds || [] };
        }
        return next();
    }
    log.warn('Unauthenticated request', { path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized — please log in' });
};

/** Confirm the authenticated user has access to the requested guild */
const hasGuildAccess = (req, res, next) => {
    const { guildId } = req.params;
    if (!isSnowflake(guildId)) {
        return res.status(400).json({ error: 'Invalid guild ID format' });
    }
    const userGuilds = req.user?.guilds || [];
    if (!userGuilds.some(g => g.id === guildId)) {
        log.warn('Guild access denied', { user: req.user?.id, guildId });
        return res.status(403).json({ error: 'Access denied to this guild' });
    }
    return next();
};

// ─── Dynamic model imports ────────────────────────────────────────────────────
// Imported lazily so the route file loads even if models haven't been created yet

async function getGuild() {
    const mod = await import('../../models/Guild.js');
    return mod.default;
}

async function getUserLevel() {
    const mod = await import('../../models/UserLevel.js');
    return mod.default;
}

async function getUserEconomy() {
    const mod = await import('../../models/UserEconomy.js');
    return mod.default;
}

// ─── GET /api/guilds ──────────────────────────────────────────────────────────
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        const client      = req.app.get('client');
        const userGuilds  = req.user.guilds || [];
        const botGuildIds = client?.guilds?.cache
            ? new Set(client.guilds.cache.keys())
            : new Set();

        const tagged = userGuilds.map(g => ({
            ...g,
            hasBot: botGuildIds.has(g.id),
        }));

        log.debug('Guilds list served', { user: req.user.id, count: tagged.length });
        return res.json(tagged);
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/guilds/:guildId/config ─────────────────────────────────────────
router.get('/:guildId/config', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const Guild       = await getGuild();
        let   config      = await Guild.findOne({ guildId });
        if (!config) {
            config = await Guild.create({ guildId });
            log.info('Created default guild config', { guildId });
        }
        return res.json(config);
    } catch (err) {
        next(err);
    }
});

// ─── PATCH /api/guilds/:guildId/config ───────────────────────────────────────
router.patch('/:guildId/config', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const updates     = req.body;

        if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
            return res.status(400).json({ error: 'Request body must be a JSON object' });
        }

        // Strip MongoDB operator injection attempts ($set, $where, etc.)
        const safe = {};
        for (const [key, value] of Object.entries(updates)) {
            if (!key.startsWith('$')) safe[key] = value;
        }

        if (Object.keys(safe).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const Guild  = await getGuild();
        const config = await Guild.findOneAndUpdate(
            { guildId },
            { $set: safe },
            { new: true, upsert: true, runValidators: true }
        );

        // Broadcast to all dashboard clients watching this guild
        const io = req.app.get('client')?.io;
        if (io) {
            io.to(`guild:${guildId}`).emit('config-updated', { guildId, config });
        }

        log.info('Guild config updated', { guildId, fields: Object.keys(safe) });
        return res.json(config);
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/guilds/:guildId/stats ──────────────────────────────────────────
router.get('/:guildId/stats', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const Guild       = await getGuild();
        const config      = await Guild.findOne({ guildId });
        if (!config) return res.status(404).json({ error: 'Guild config not found' });

        return res.json({
            totalWarnings:  config.warnings?.length   ?? 0,
            customCommands: config.customCommands?.length ?? 0,
            reactionRoles:  config.reactionRoles?.length  ?? 0,
            automodEnabled: config.automod?.enabled   ?? false,
            logsEnabled:    config.logs?.enabled      ?? false,
            welcomeEnabled: config.welcome?.enabled   ?? false,
        });
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/guilds/:guildId/channels ───────────────────────────────────────
router.get('/:guildId/channels', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const client      = req.app.get('client');
        if (!client) return res.status(503).json({ error: 'Bot not ready' });

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild)  return res.status(404).json({ error: 'Guild not found or bot not in guild' });

        const channels = guild.channels.cache
            .filter(c => c.type === 0 || c.type === 2) // text(0) and voice(2)
            .map(c => ({ id: c.id, name: c.name, type: c.type }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return res.json(channels);
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/guilds/:guildId/roles ──────────────────────────────────────────
router.get('/:guildId/roles', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const client      = req.app.get('client');
        const guild       = await client?.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: 'Guild not found or bot not in guild' });

        const roles = guild.roles.cache
            .filter(r => r.id !== guildId && !r.managed)
            .map(r => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position }))
            .sort((a, b) => b.position - a.position);

        return res.json(roles);
    } catch (err) {
        next(err);
    }
});

// ─── POST /api/guilds/:guildId/send-message ──────────────────────────────────
router.post('/:guildId/send-message', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId }                  = req.params;
        const { channelId, content, embed } = req.body;

        if (!channelId || !isSnowflake(channelId)) {
            return res.status(400).json({ error: 'Invalid channelId' });
        }
        if (!content && !embed?.enabled) {
            return res.status(400).json({ error: 'Message must have content or an embed' });
        }

        const client  = req.app.get('client');
        const guild   = await client?.guilds.fetch(guildId).catch(() => null);
        if (!guild)    return res.status(404).json({ error: 'Guild not found' });

        const channel = guild.channels.cache.get(channelId);
        if (!channel)  return res.status(404).json({ error: 'Channel not found' });

        const payload = {};
        if (content && typeof content === 'string') {
            payload.content = content.substring(0, 2000);
        }
        if (embed?.enabled) {
            const e = {};
            if (embed.title)       e.title       = String(embed.title).substring(0, 256);
            if (embed.description) e.description = String(embed.description).substring(0, 4096);
            if (embed.color)       e.color        = parseInt(String(embed.color).replace('#', ''), 16) || 0;
            if (embed.footer)      e.footer       = { text: String(embed.footer).substring(0, 2048) };
            if (embed.image && typeof embed.image === 'string' && embed.image.startsWith('http')) {
                e.image = { url: embed.image };
            }
            payload.embeds = [e];
        }

        await channel.send(payload);
        log.info('Message sent via dashboard', { guildId, channelId, user: req.user.id });
        return res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ─── Custom commands ──────────────────────────────────────────────────────────
router.post('/:guildId/custom-commands', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId }            = req.params;
        const { name, response, embed } = req.body;

        if (!name || typeof name !== 'string' || name.length > 32) {
            return res.status(400).json({ error: 'Command name required (max 32 chars)' });
        }
        if (!response && !embed?.enabled) {
            return res.status(400).json({ error: 'Command must have a response or embed' });
        }

        const Guild  = await getGuild();
        const config = await Guild.findOneAndUpdate(
            { guildId },
            {
                $push: {
                    customCommands: {
                        name:      name.trim().toLowerCase(),
                        response:  response || '',
                        embed:     embed || { enabled: false },
                        createdBy: req.user.id,
                    },
                },
            },
            { new: true, upsert: true }
        );

        log.info('Custom command added', { guildId, name });
        return res.json(config.customCommands);
    } catch (err) {
        next(err);
    }
});

router.delete('/:guildId/custom-commands/:commandId', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId, commandId } = req.params;
        const Guild  = await getGuild();
        const config = await Guild.findOneAndUpdate(
            { guildId },
            { $pull: { customCommands: { _id: commandId } } },
            { new: true }
        );
        log.info('Custom command deleted', { guildId, commandId });
        return res.json(config?.customCommands ?? []);
    } catch (err) {
        next(err);
    }
});

// ─── Warnings ─────────────────────────────────────────────────────────────────
router.get('/:guildId/warnings/:userId', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId, userId } = req.params;
        if (!isSnowflake(userId)) return res.status(400).json({ error: 'Invalid userId' });

        const Guild  = await getGuild();
        const config = await Guild.findOne({ guildId });
        if (!config) return res.json([]);

        return res.json(config.warnings.filter(w => w.userId === userId));
    } catch (err) {
        next(err);
    }
});

router.delete('/:guildId/warnings/:userId', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId, userId } = req.params;
        if (!isSnowflake(userId)) return res.status(400).json({ error: 'Invalid userId' });

        const Guild = await getGuild();
        await Guild.findOneAndUpdate({ guildId }, { $pull: { warnings: { userId } } });
        log.info('Warnings cleared', { guildId, userId });
        return res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ─── Leaderboard ──────────────────────────────────────────────────────────────
router.get('/:guildId/leaderboard', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const UserLevel   = await getUserLevel();
        const top         = await UserLevel.find({ guildId }).sort({ totalXP: -1 }).limit(20);
        return res.json(top);
    } catch (err) {
        next(err);
    }
});

// ─── Economy leaderboard ──────────────────────────────────────────────────────
router.get('/:guildId/economy/leaderboard', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const UserEconomy = await getUserEconomy();
        const top         = await UserEconomy.find({ guildId }).sort({ wallet: -1 }).limit(20);
        return res.json(top);
    } catch (err) {
        next(err);
    }
});

// ─── Giveaways ────────────────────────────────────────────────────────────────
router.get('/:guildId/giveaways', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const Guild       = await getGuild();
        const config      = await Guild.findOne({ guildId });
        return res.json(config?.giveaways ?? []);
    } catch (err) {
        next(err);
    }
});

// ─── EXPORT — must be at the very bottom ─────────────────────────────────────
// Any routes defined after this line would be silently unreachable.
export default router;
