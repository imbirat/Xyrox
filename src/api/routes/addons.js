/**
 * src/api/routes/addons.js — Addon data proxy routes
 *
 * Kythia's addon system has its own Hono API server on an internal port.
 * These routes proxy requests from the dashboard to the addon API,
 * adding SaaS-layer authentication and guild access checks.
 *
 * Covered addons: activity, automod, leveling, economy, welcomer,
 *                 automod, autoreply, autoreact, giveaway, tickets,
 *                 reaction-roles, modmail, invite, birthday
 */

'use strict';

const express = require('express');
const axios   = require('axios');
const log     = require('@utils/logger');
const { isAuthenticated, hasGuildAccess } = require('../middleware/auth');
const { getConfig } = require('@config/index');

const router = express.Router();

// Internal Kythia addon API base (same process, different port)
function addonBase() {
    const cfg = getConfig();
    return `http://127.0.0.1:${cfg.addons.api.port}`;
}

// Build the Authorization header for addon API calls
function addonHeaders() {
    const cfg = getConfig();
    return {
        Authorization:  `Bearer ${cfg.addons.api.secret}`,
        'Content-Type': 'application/json',
    };
}

// ─── Generic proxy helper ─────────────────────────────────────────────────────
async function proxyAddon(req, res, next, path) {
    try {
        const method  = req.method.toLowerCase();
        const url     = `${addonBase()}/api${path}`;
        const config  = {
            method,
            url,
            headers: addonHeaders(),
            params:  req.query,
        };

        if (['post', 'patch', 'put'].includes(method) && req.body) {
            config.data = req.body;
        }

        const response = await axios(config);
        return res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        log.error('Addon proxy error', { path, message: err.message });
        next(err);
    }
}

// ─── Activity ─────────────────────────────────────────────────────────────────
router.get('/activity/:guildId',             isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/activity/${req.params.guildId}${req.url.replace(/^\/activity\/[^/]+/, '')}`));

router.patch('/activity/:guildId/toggle',    isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/activity/${req.params.guildId}/toggle`));

// ─── Leveling ─────────────────────────────────────────────────────────────────
router.get('/leveling/:guildId',             isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/leveling/${req.params.guildId}`));

router.patch('/leveling/:guildId',           isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/leveling/${req.params.guildId}`));

// ─── Automod ──────────────────────────────────────────────────────────────────
router.get('/automod/:guildId',              isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/automod/${req.params.guildId}`));

router.patch('/automod/:guildId',            isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/automod/${req.params.guildId}`));

// ─── Welcomer ─────────────────────────────────────────────────────────────────
router.get('/welcome/:guildId',              isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/welcome/${req.params.guildId}`));

router.patch('/welcome/:guildId',            isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/welcome/${req.params.guildId}`));

// ─── Giveaway ─────────────────────────────────────────────────────────────────
router.get('/giveaway/:guildId',             isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/giveaway/${req.params.guildId}`));

// ─── Tickets ──────────────────────────────────────────────────────────────────
router.get('/tickets/:guildId',              isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/tickets/${req.params.guildId}`));

router.patch('/tickets/:guildId',            isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/tickets/${req.params.guildId}`));

// ─── Reaction Roles ───────────────────────────────────────────────────────────
router.get('/reaction-roles/:guildId',       isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/reaction-roles/${req.params.guildId}`));

// ─── Addons list ──────────────────────────────────────────────────────────────
router.get('/list/:guildId',                 isAuthenticated, hasGuildAccess, (req, res, next) =>
    proxyAddon(req, res, next, `/list/${req.params.guildId}`));

// ─── Stats (public) ───────────────────────────────────────────────────────────
router.get('/stats', (req, res, next) =>
    proxyAddon(req, res, next, '/stats'));

module.exports = router;
