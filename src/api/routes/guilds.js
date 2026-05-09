/**
 * src/api/routes/guilds.js — Guild configuration & data routes
 *
 * All routes require authentication and guild membership verification.
 * Bridges the Kythia addon API (Hono/SQLite) with the SaaS Express API.
 */

'use strict';

const express = require('express');
const log     = require('@utils/logger');
const { isAuthenticated, hasGuildAccess } = require('../middleware/auth');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClient(req) {
    return req.app.get('client');
}

// ─── GET /api/guilds ──────────────────────────────────────────────────────────
// Returns user's guilds with hasBot flag
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        const client     = getClient(req);
        const userGuilds = req.user.guilds || [];
        const botGuildIds = client?.guilds?.cache
            ? new Set(client.guilds.cache.keys())
            : new Set();

        const tagged = userGuilds.map((g) => ({
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
        const client      = getClient(req);
        const container   = client?.container;

        if (!container) {
            return res.status(503).json({ error: 'Bot not initialised yet' });
        }

        const { ServerSetting } = container.models;
        let config = await ServerSetting.getCache({ guildId });

        if (!config) {
            [config] = await ServerSetting.findOrCreateWithCache({
                where:    { guildId },
                defaults: { guildId, guildName: guildId },
            });
            log.info('Created default guild config', { guildId });
        }

        return res.json(config);
    } catch (err) {
        next(err);
    }
});

// ─── PATCH /api/guilds/:guildId/config ────────────────────────────────────────
router.patch('/:guildId/config', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const client      = getClient(req);
        const { ServerSetting } = client.container.models;

        const [setting] = await ServerSetting.findOrCreateWithCache({
            where:    { guildId },
            defaults: { guildId, guildName: guildId },
        });

        const allowedFields = [
            'prefix', 'lang', 'commandMode', 'logChannelId',
            'welcomeInOn', 'welcomeOutOn', 'automodOn', 'levelingOn',
            'economyOn', 'aiOn', 'musicOn', 'activityOn',
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                setting[field] = req.body[field];
            }
        }

        await setting.save();

        // Broadcast config change to connected dashboard
        const io = req.app.get('io');
        if (io) io.to(guildId).emit('config_updated', setting.toJSON());

        log.info('Guild config updated', { guildId, user: req.user.id, fields: Object.keys(req.body) });
        return res.json(setting);
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/guilds/:guildId/channels ────────────────────────────────────────
router.get('/:guildId/channels', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const client      = getClient(req);
        const guild       = client?.guilds?.cache.get(guildId);

        if (!guild) {
            return res.status(404).json({ error: 'Bot is not in this guild' });
        }

        const channels = guild.channels.cache
            .filter((c) => [0, 2, 4, 5, 13, 15].includes(c.type))
            .map((c) => ({
                id:       c.id,
                name:     c.name,
                type:     c.type,
                parentId: c.parentId,
                position: c.position,
            }))
            .sort((a, b) => a.position - b.position);

        return res.json(channels);
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/guilds/:guildId/roles ───────────────────────────────────────────
router.get('/:guildId/roles', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const client      = getClient(req);
        const guild       = client?.guilds?.cache.get(guildId);

        if (!guild) {
            return res.status(404).json({ error: 'Bot is not in this guild' });
        }

        const roles = guild.roles.cache
            .filter((r) => !r.managed && r.id !== guild.id)
            .map((r) => ({
                id:       r.id,
                name:     r.name,
                color:    r.hexColor,
                position: r.position,
                hoist:    r.hoist,
            }))
            .sort((a, b) => b.position - a.position);

        return res.json(roles);
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/guilds/:guildId/stats ───────────────────────────────────────────
router.get('/:guildId/stats', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const client      = getClient(req);
        const guild       = client?.guilds?.cache.get(guildId);

        if (!guild) {
            return res.status(404).json({ error: 'Bot is not in this guild' });
        }

        return res.json({
            memberCount:  guild.memberCount,
            onlineCount:  guild.members.cache.filter((m) => m.presence?.status !== 'offline').size,
            channelCount: guild.channels.cache.size,
            roleCount:    guild.roles.cache.size,
            boostLevel:   guild.premiumTier,
            boostCount:   guild.premiumSubscriptionCount,
            createdAt:    guild.createdAt,
        });
    } catch (err) {
        next(err);
    }
});

// ─── GET /api/guilds/:guildId/leaderboard ─────────────────────────────────────
router.get('/:guildId/leaderboard', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId } = req.params;
        const { type = 'xp', limit = '10' } = req.query;
        const client    = getClient(req);
        const container = client?.container;

        const limitNum = Math.min(50, parseInt(limit, 10) || 10);

        if (type === 'xp' || type === 'level') {
            const { UserLevel } = container.models;
            if (!UserLevel) return res.json([]);

            const rows = await UserLevel.findAll({
                where:  { guildId },
                order:  [['xp', 'DESC']],
                limit:  limitNum,
                raw:    true,
            });

            return res.json(rows);
        }

        if (type === 'economy') {
            const { UserEconomy } = container.models;
            if (!UserEconomy) return res.json([]);

            const rows = await UserEconomy.findAll({
                where:  { guildId },
                order:  [['balance', 'DESC']],
                limit:  limitNum,
                raw:    true,
            });

            return res.json(rows);
        }

        return res.status(400).json({ error: 'type must be xp, level, or economy' });
    } catch (err) {
        next(err);
    }
});

// ─── POST /api/guilds/:guildId/send-message ───────────────────────────────────
router.post('/:guildId/send-message', isAuthenticated, hasGuildAccess, async (req, res, next) => {
    try {
        const { guildId }          = req.params;
        const { channelId, content, embeds } = req.body;
        const client               = getClient(req);

        if (!channelId) {
            return res.status(400).json({ error: 'channelId is required' });
        }
        if (!content && (!embeds || embeds.length === 0)) {
            return res.status(400).json({ error: 'content or embeds is required' });
        }

        const guild   = client?.guilds?.cache.get(guildId);
        const channel = guild?.channels?.cache.get(channelId);

        if (!channel || !channel.isTextBased()) {
            return res.status(404).json({ error: 'Channel not found or not a text channel' });
        }

        const msg = await channel.send({ content: content || undefined, embeds: embeds || [] });

        log.info('Message sent via dashboard', { guildId, channelId, user: req.user.id });
        return res.json({ success: true, messageId: msg.id });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
