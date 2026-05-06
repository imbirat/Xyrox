import express from 'express';
import Guild from '../../models/Guild.js';
import { clearGuildCache } from '../../middleware/commandHandler.js';

const router = express.Router();

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    // Also support session-based auth (token exchange flow)
    if (req.session && req.session.user) {
        req.user = { ...req.session.user, guilds: req.session.guilds || [] };
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

// GET /api/guilds — returns all guilds the user can manage, tagged with hasBot
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const client = req.app.get('client');
        const userGuilds = req.user.guilds || [];

        // Tag each guild with whether the bot is present
        const botGuildIds = client?.guilds?.cache
            ? new Set(client.guilds.cache.keys())
            : new Set();

        const tagged = userGuilds.map(g => ({
            ...g,
            hasBot: botGuildIds.has(g.id)
        }));

        res.json(tagged);
    } catch (err) {
        console.error('Error fetching guilds list:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get guild configuration
router.get('/:guildId/config', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        
        // Check if user has access to this guild
        const userGuilds = req.user.guilds || [];
        const hasAccess = userGuilds.some(g => g.id === guildId);
        
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        let guildConfig = await Guild.findOne({ guildId });
        
        if (!guildConfig) {
            guildConfig = await Guild.create({ guildId });
        }
        
        res.json(guildConfig);
    } catch (error) {
        console.error('Error fetching guild config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update guild configuration
router.patch('/:guildId/config', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        const updates = req.body;
        
        // Check if user has access to this guild
        const userGuilds = req.user.guilds || [];
        const hasAccess = userGuilds.some(g => g.id === guildId);
        
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const guildConfig = await Guild.findOneAndUpdate(
            { guildId },
            { $set: updates },
            { new: true, upsert: true }
        );
        
        // Clear cache
        clearGuildCache(guildId);
        
        res.json(guildConfig);
    } catch (error) {
        console.error('Error updating guild config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get guild stats
router.get('/:guildId/stats', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        
        const guildConfig = await Guild.findOne({ guildId });
        
        if (!guildConfig) {
            return res.status(404).json({ error: 'Guild not found' });
        }
        
        const stats = {
            totalWarnings: guildConfig.warnings.length,
            customCommands: guildConfig.customCommands.length,
            reactionRoles: guildConfig.reactionRoles.length,
            automodEnabled: guildConfig.automod.enabled,
            logsEnabled: guildConfig.logs.enabled,
            welcomeEnabled: guildConfig.welcome.enabled
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching guild stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add custom command
router.post('/:guildId/custom-commands', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { name, response, embed } = req.body;
        
        const guildConfig = await Guild.findOneAndUpdate(
            { guildId },
            {
                $push: {
                    customCommands: {
                        name,
                        response,
                        embed: embed || { enabled: false },
                        createdBy: req.user.id
                    }
                }
            },
            { new: true, upsert: true }
        );
        
        clearGuildCache(guildId);
        res.json(guildConfig.customCommands);
    } catch (error) {
        console.error('Error adding custom command:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete custom command
router.delete('/:guildId/custom-commands/:commandId', isAuthenticated, async (req, res) => {
    try {
        const { guildId, commandId } = req.params;
        
        const guildConfig = await Guild.findOneAndUpdate(
            { guildId },
            {
                $pull: {
                    customCommands: { _id: commandId }
                }
            },
            { new: true }
        );
        
        clearGuildCache(guildId);
        res.json(guildConfig.customCommands);
    } catch (error) {
        console.error('Error deleting custom command:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get warnings for a user
router.get('/:guildId/warnings/:userId', isAuthenticated, async (req, res) => {
    try {
        const { guildId, userId } = req.params;
        
        const guildConfig = await Guild.findOne({ guildId });
        
        if (!guildConfig) {
            return res.json([]);
        }
        
        const userWarnings = guildConfig.warnings.filter(w => w.userId === userId);
        res.json(userWarnings);
    } catch (error) {
        console.error('Error fetching warnings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clear warnings for a user
router.delete('/:guildId/warnings/:userId', isAuthenticated, async (req, res) => {
    try {
        const { guildId, userId } = req.params;
        
        await Guild.findOneAndUpdate(
            { guildId },
            {
                $pull: {
                    warnings: { userId }
                }
            }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing warnings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

// Get channels
router.get('/:guildId/channels', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        const client = req.app.get('client');
        if (!client) return res.status(500).json({ error: 'Bot not ready' });
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: 'Guild not found' });
        const channels = guild.channels.cache
            .filter(c => c.type === 0 || c.type === 2) // text & voice
            .map(c => ({ id: c.id, name: c.name, type: c.type }))
            .sort((a, b) => a.name.localeCompare(b.name));
        res.json(channels);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get roles
router.get('/:guildId/roles', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        const client = req.app.get('client');
        const guild = await client?.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: 'Guild not found' });
        const roles = guild.roles.cache
            .filter(r => r.id !== guildId && !r.managed)
            .map(r => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position }))
            .sort((a, b) => b.position - a.position);
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send message from dashboard
router.post('/:guildId/send-message', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { channelId, content, embed } = req.body;
        const client = req.app.get('client');
        const guild = await client?.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: 'Guild not found' });
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return res.status(404).json({ error: 'Channel not found' });

        const payload = {};
        if (content) payload.content = content;
        if (embed?.enabled) {
            const e = {};
            if (embed.title) e.title = embed.title;
            if (embed.description) e.description = embed.description;
            if (embed.color) e.color = parseInt(embed.color.replace('#', ''), 16);
            if (embed.footer) e.footer = { text: embed.footer };
            if (embed.image) e.image = { url: embed.image };
            payload.embeds = [e];
        }

        await channel.send(payload);
        res.json({ success: true });
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Leveling - get leaderboard
router.get('/:guildId/leaderboard', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        const UserLevel = (await import('../../models/UserLevel.js')).default;
        const top = await UserLevel.find({ guildId }).sort({ totalXP: -1 }).limit(20);
        res.json(top);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Economy leaderboard
router.get('/:guildId/economy/leaderboard', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        const UserEconomy = (await import('../../models/UserEconomy.js')).default;
        const top = await UserEconomy.find({ guildId }).sort({ wallet: -1 }).limit(20);
        res.json(top);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Giveaways
router.get('/:guildId/giveaways', isAuthenticated, async (req, res) => {
    try {
        const { guildId } = req.params;
        const guildConfig = await Guild.findOne({ guildId });
        res.json(guildConfig?.giveaways || []);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
