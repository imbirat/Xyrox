/**
 * src/api/middleware/auth.js — Authentication guards
 *
 * isAuthenticated: ensures req.session.user is set
 * hasGuildAccess:  ensures the authenticated user has Manage Guild in the target guild
 */

'use strict';

const log = require('@utils/logger');

const isSnowflake = (id) => typeof id === 'string' && /^\d{17,19}$/.test(id);

function isAuthenticated(req, res, next) {
    if (req.session?.user) {
        if (!req.user) {
            req.user = { ...req.session.user, guilds: req.session.guilds || [] };
        }
        return next();
    }
    log.warn('Unauthenticated request', { path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized — please log in' });
}

function hasGuildAccess(req, res, next) {
    const { guildId } = req.params;
    if (!isSnowflake(guildId)) {
        return res.status(400).json({ error: 'Invalid guild ID format' });
    }
    const userGuilds = req.user?.guilds || [];
    if (!userGuilds.some((g) => g.id === guildId)) {
        log.warn('Guild access denied', { user: req.user?.id, guildId });
        return res.status(403).json({ error: 'Access denied to this guild' });
    }
    return next();
}

module.exports = { isAuthenticated, hasGuildAccess };
