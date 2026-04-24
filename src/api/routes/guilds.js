import express from 'express';
import Guild from '../../models/Guild.js';
import { clearGuildCache } from '../../middleware/commandHandler.js';

const router = express.Router();

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

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
