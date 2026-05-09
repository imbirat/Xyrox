/**
 * src/api/routes/bot.js — Bot status and meta routes
 */

'use strict';

const express = require('express');
const router  = express.Router();
const log     = require('@utils/logger');

// GET /api/bot/status
router.get('/status', async (req, res) => {
    const client = req.app.get('client');

    return res.json({
        status:   client?.isReady() ? 'online' : 'offline',
        ping:     client?.ws?.ping ?? null,
        uptime:   process.uptime(),
        guilds:   client?.guilds?.cache.size ?? 0,
        users:    client?.users?.cache.size  ?? 0,
        shardId:  client?.shard?.ids?.[0]   ?? 0,
    });
});

// GET /api/bot/invite
router.get('/invite', (req, res) => {
    const clientId = process.env.DISCORD_BOT_CLIENT_ID || '';
    const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot`;
    return res.json({ url });
});

module.exports = router;
