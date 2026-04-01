const {
  Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
  PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder,
  TextInputStyle, AutoModerationRuleEventType, AutoModerationRuleTriggerType,
  AutoModerationActionType, AuditLogEvent
} = require('discord.js');
const express = require('express');
const fs = require('fs');

// ─────────────────────────────────────────────────────────────
// EXPRESS
// ─────────────────────────────────────────────────────────────
const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(3000, () => console.log('Express running on port 3000'));

// ─────────────────────────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
});

const TOKEN     = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const BOT_TAG   = '[XyroxBot]';

// ─────────────────────────────────────────────────────────────
// DATA FILES
// ─────────────────────────────────────────────────────────────
const FILES = {
  levels:    './levels.json',
  warnings:  './warnings.json',
  xpCh:      './xpChannels.json',
  afk:       './afk.json',
  roles:     './autoroles.json',
  welcome:   './welcome.json',
  economy:   './economy.json',
  shop:      './shop.json',
  automod:   './automod_config.json',
  antinuke:  './antinuke.json',
};

const load = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : {};

let levels          = load(FILES.levels);
let warnings        = load(FILES.warnings);
let xpChannels      = load(FILES.xpCh);
let afkData         = load(FILES.afk);
let autoRoles       = load(FILES.roles);
let welcomeChannels = load(FILES.welcome);
let economy         = load(FILES.economy);
let shop            = load(FILES.shop);
let automodConfig   = load(FILES.automod);
let antinukeConfig  = load(FILES.antinuke);

const save         = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));
const saveData     = () => { save(FILES.levels, levels); save(FILES.warnings, warnings); save(FILES.xpCh, xpChannels); save(FILES.afk, afkData); save(FILES.roles, autoRoles); save(FILES.welcome, welcomeChannels); };
const saveEconomy  = () => save(FILES.economy, economy);
const saveShop     = () => save(FILES.shop, shop);
const saveAutomod  = () => save(FILES.automod, automodConfig);
const saveAntinuke = () => save(FILES.antinuke, antinukeConfig);

const ensureUser = id => {
  if (!economy[id]) economy[id] = { cash: 0, bank: 0, lastDaily: 0, lastInterest: 0, inventory: [] };
  if (economy[id].bank === undefined) economy[id].bank = 0;
  if (economy[id].lastInterest === undefined) economy[id].lastInterest = 0;
};
const getAMConfig  = guildId => { if (!automodConfig[guildId]) automodConfig[guildId] = { logChannel: null, exemptRoles: [], exemptChannels: [] }; return automodConfig[guildId]; };

// ─────────────────────────────────────────────────────────────
// ANTI-NUKE SYSTEM
// ─────────────────────────────────────────────────────────────

// Default thresholds (actions within timeWindow ms trigger punishment)
const AN_DEFAULTS = {
  enabled: false,
  logChannel: null,
  punishment: 'ban',         // 'ban' | 'kick' | 'strip' (strip all roles)
  whitelist: [],             // user IDs exempt from anti-nuke
  thresholds: {
    ban:           { limit: 3,  window: 10000 },
    kick:          { limit: 3,  window: 10000 },
    channelDelete: { limit: 3,  window: 10000 },
    channelCreate: { limit: 5,  window: 10000 },
    roleDelete:    { limit: 3,  window: 10000 },
    webhookCreate: { limit: 3,  window: 10000 },
  },
};

function getAN(guildId) {
  if (!antinukeConfig[guildId]) antinukeConfig[guildId] = JSON.parse(JSON.stringify(AN_DEFAULTS));
  // Ensure all keys exist (for older saved configs)
  const cfg = antinukeConfig[guildId];
  if (!cfg.thresholds) cfg.thresholds = JSON.parse(JSON.stringify(AN_DEFAULTS.thresholds));
  if (cfg.whitelist === undefined) cfg.whitelist = [];
  if (cfg.punishment === undefined) cfg.punishment = 'ban';
  return cfg;
}

// In-memory action tracker: Map<guildId, Map<userId, Map<action, timestamp[]>>>
const nukeTracker = new Map();

function trackAction(guildId, userId, action) {
  if (!nukeTracker.has(guildId)) nukeTracker.set(guildId, new Map());
  const guild = nukeTracker.get(guildId);
  if (!guild.has(userId)) guild.set(userId, new Map());
  const user = guild.get(userId);
  if (!user.has(action)) user.set(action, []);
  const now = Date.now();
  const timestamps = user.get(action);
  timestamps.push(now);
  const cfg = getAN(guildId);
  const thr = cfg.thresholds[action];
  // Clean up old entries outside window
  const fresh = timestamps.filter(t => now - t < (thr?.window || 10000));
  user.set(action, fresh);
  return fresh.length;
}

async function punishNuker(guild, userId, action, count) {
  const cfg = getAN(guild.id);
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;

  // Never punish the bot itself or the server owner
  if (userId === client.user.id) return;
  if (userId === guild.ownerId) return;

  const actionLabel = {
    ban: 'Mass Ban',
    kick: 'Mass Kick',
    channelDelete: 'Mass Channel Delete',
    channelCreate: 'Mass Channel Create',
    roleDelete: 'Mass Role Delete',
    webhookCreate: 'Mass Webhook Create',
  }[action] || action;

  // Strip all dangerous permissions / roles first
  const safeRoles = member.roles.cache.filter(r => r.id !== guild.id).map(r => r.id);

  try {
    switch (cfg.punishment) {
      case 'ban':
        await guild.members.ban(userId, { reason: `[Anti-Nuke] ${actionLabel} detected (${count} actions)` });
        break;
      case 'kick':
        await member.kick(`[Anti-Nuke] ${actionLabel} detected (${count} actions)`);
        break;
      case 'strip':
        await member.roles.set([], `[Anti-Nuke] ${actionLabel} detected (${count} actions)`).catch(() => {});
        await member.timeout(28 * 24 * 60 * 60 * 1000, `[Anti-Nuke] ${actionLabel} detected`).catch(() => {});
        break;
    }
  } catch (e) {
    console.error('[Anti-Nuke] Failed to punish:', e.message);
  }

  // Log to channel if set
  if (cfg.logChannel) {
    const logCh = guild.channels.cache.get(cfg.logChannel);
    if (logCh) {
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('🚨 Anti-Nuke Triggered!')
        .setDescription(`A user was punished for suspicious activity.`)
        .addFields(
          { name: '👤 User',       value: `<@${userId}> (\`${userId}\`)`, inline: true },
          { name: '⚡ Trigger',    value: actionLabel,                     inline: true },
          { name: '🔢 Actions',    value: `${count} in quick succession`,  inline: true },
          { name: '🔨 Punishment', value: cfg.punishment.toUpperCase(),    inline: true },
        )
        .setTimestamp();
      logCh.send({ embeds: [embed] }).catch(() => {});
    }
  }
}

async function handleAntiNuke(guild, userId, action) {
  if (!guild) return;
  const cfg = getAN(guild.id);
  if (!cfg.enabled) return;
  if (!userId) return;
  if (cfg.whitelist.includes(userId)) return;
  if (userId === guild.ownerId) return;
  if (userId === client.user.id) return;

  // Check if executor is an admin — whitelist all admins optionally (no, we still watch admins; only explicit whitelist skips)
  const count = trackAction(guild.id, userId, action);
  const thr = cfg.thresholds[action];
  if (!thr) return;
  if (count >= thr.limit) {
    // Reset tracker so we don't fire multiple times for same burst
    const tracker = nukeTracker.get(guild.id)?.get(userId);
    if (tracker) tracker.set(action, []);
    await punishNuker(guild, userId, action, count);
  }
}

// Audit log helper — fetches the latest entry of a given type
async function getAuditExecutor(guild, type) {
  try {
    const logs = await guild.fetchAuditLogs({ limit: 1, type });
    const entry = logs.entries.first();
    if (!entry) return null;
    // Only return if it happened in the last 5 seconds
    if (Date.now() - entry.createdTimestamp > 5000) return null;
    return entry.executor?.id || null;
  } catch {
    return null;
  }
}

// ── Anti-Nuke Event Listeners ──

client.on('guildBanAdd', async ban => {
  const executor = await getAuditExecutor(ban.guild, AuditLogEvent.MemberBanAdd);
  if (executor) await handleAntiNuke(ban.guild, executor, 'ban');
});

client.on('guildMemberRemove', async member => {
  const executor = await getAuditExecutor(member.guild, AuditLogEvent.MemberKick);
  if (executor) await handleAntiNuke(member.guild, executor, 'kick');
});

client.on('channelDelete', async channel => {
  if (!channel.guild) return;
  const executor = await getAuditExecutor(channel.guild, AuditLogEvent.ChannelDelete);
  if (executor) await handleAntiNuke(channel.guild, executor, 'channelDelete');
});

client.on('channelCreate', async channel => {
  if (!channel.guild) return;
  const executor = await getAuditExecutor(channel.guild, AuditLogEvent.ChannelCreate);
  if (executor) await handleAntiNuke(channel.guild, executor, 'channelCreate');
});

client.on('roleDelete', async role => {
  const executor = await getAuditExecutor(role.guild, AuditLogEvent.RoleDelete);
  if (executor) await handleAntiNuke(role.guild, executor, 'roleDelete');
});

client.on('webhookUpdate', async channel => {
  if (!channel.guild) return;
  const executor = await getAuditExecutor(channel.guild, AuditLogEvent.WebhookCreate);
  if (executor) await handleAntiNuke(channel.guild, executor, 'webhookCreate');
});

// ─────────────────────────────────────────────────────────────
// AUTOMOD RULE DEFINITIONS
// ─────────────────────────────────────────────────────────────
const RULE_DEFS = {
  keyword: {
    key:   'keyword',
    label: '🚫 Keyword Filter',
    name:  `${BOT_TAG} Keyword Filter`,
    desc:  'Blocks custom blocked words and phrases',
    build: (exemptRoles, exemptChannels) => ({
      name: `${BOT_TAG} Keyword Filter`,
      eventType: 1,
      triggerType: 1,
      triggerMetadata: { keywordFilter: [], regexPatterns: [] },
      actions: [
        { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: '🚫 Your message was blocked by AutoMod.' } },
      ],
      enabled: true,
      exemptRoles,
      exemptChannels,
    }),
  },
  invites: {
    key:   'invites',
    label: '🔗 Invite Links',
    name:  `${BOT_TAG} Invite Links`,
    desc:  'Blocks Discord invite links from non-staff',
    build: (exemptRoles, exemptChannels) => ({
      name: `${BOT_TAG} Invite Links`,
      eventType: 1,
      triggerType: 1,
      triggerMetadata: { keywordFilter: ['discord.gg/*', 'discord.com/invite/*', 'dsc.gg/*'] },
      actions: [
        { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: '🔗 Invite links are not allowed here.' } },
      ],
      enabled: true,
      exemptRoles,
      exemptChannels,
    }),
  },
  spam: {
    key:   'spam',
    label: '⚡ Spam Detection',
    name:  `${BOT_TAG} Spam Detection`,
    desc:  'Detects and blocks spam messages, auto-mutes spammers for 2 min',
    build: (exemptRoles, exemptChannels) => ({
      name: `${BOT_TAG} Spam Detection`,
      eventType: 1,
      triggerType: 3,
      triggerMetadata: {},
      actions: [
        { type: AutoModerationActionType.BlockMessage },
        { type: AutoModerationActionType.Timeout, metadata: { durationSeconds: 120 } },
      ],
      enabled: true,
      exemptRoles,
      exemptChannels,
    }),
  },
  mentions: {
    key:   'mentions',
    label: '🔔 Mention Spam',
    name:  `${BOT_TAG} Mention Spam`,
    desc:  'Blocks messages with excessive @mentions, mutes for 5 min',
    build: (exemptRoles, exemptChannels) => ({
      name: `${BOT_TAG} Mention Spam`,
      eventType: 1,
      triggerType: 5,
      triggerMetadata: { mentionTotalLimit: 5, mentionRaidProtectionEnabled: true },
      actions: [
        { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: '🔔 Too many mentions.' } },
        { type: AutoModerationActionType.Timeout, metadata: { durationSeconds: 300 } },
      ],
      enabled: true,
      exemptRoles,
      exemptChannels,
    }),
  },
  harmful: {
    key:   'harmful',
    label: '☣️ Harmful Content',
    name:  `${BOT_TAG} Harmful Content`,
    desc:  'Discord ML filter — profanity, sexual content, hate speech',
    build: (exemptRoles, exemptChannels) => ({
      name: `${BOT_TAG} Harmful Content`,
      eventType: 1,
      triggerType: 4,
      triggerMetadata: { presets: [1, 2, 3] },
      actions: [
        { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: '☣️ That content is not allowed here.' } },
      ],
      enabled: true,
      exemptRoles,
      exemptChannels,
    }),
  },
};

// ─────────────────────────────────────────────────────────────
// AUTOMOD HELPERS
// ─────────────────────────────────────────────────────────────
async function fetchBotRules(guild) {
  const all = await guild.autoModerationRules.fetch();
  return all.filter(r => r.name.startsWith(BOT_TAG));
}

async function findRule(guild, key) {
  const rules = await fetchBotRules(guild);
  return rules.find(r => r.name === RULE_DEFS[key].name) || null;
}

async function createRule(guild, key) {
  const cfg   = getAMConfig(guild.id);
  const def   = RULE_DEFS[key];
  const logCh = cfg.logChannel;
  const built = def.build(cfg.exemptRoles, cfg.exemptChannels);
  if (logCh) {
    built.actions.push({
      type: AutoModerationActionType.SendAlertMessage,
      metadata: { channel: logCh },
    });
  }
  return guild.autoModerationRules.create(built);
}

async function updateAllRuleExemptions(guild) {
  const cfg   = getAMConfig(guild.id);
  const rules = await fetchBotRules(guild);
  for (const [, rule] of rules) {
    await rule.edit({ exemptRoles: cfg.exemptRoles, exemptChannels: cfg.exemptChannels }).catch(() => {});
  }
}

async function updateAllLogChannels(guild, channelId) {
  const rules = await fetchBotRules(guild);
  for (const [, rule] of rules) {
    const baseActions = rule.actions
      .filter(a => a.type !== AutoModerationActionType.SendAlertMessage)
      .map(a => {
        const rebuilt = { type: a.type };
        if (a.metadata && Object.keys(a.metadata).length > 0) rebuilt.metadata = a.metadata;
        return rebuilt;
      });
    if (channelId) {
      baseActions.push({
        type: AutoModerationActionType.SendAlertMessage,
        metadata: { channel: channelId },
      });
    }
    await rule.edit({ actions: baseActions }).catch(console.error);
  }
}

async function buildStatusEmbed(guild) {
  const cfg    = getAMConfig(guild.id);
  const rules  = await fetchBotRules(guild);
  const fields = [];

  for (const [key, def] of Object.entries(RULE_DEFS)) {
    const rule   = rules.find(r => r.name === def.name);
    const status = rule ? (rule.enabled ? '✅ Active' : '⏸️ Disabled') : '❌ Not set up';
    let detail   = '';
    if (rule && key === 'keyword') {
      const kw = rule.triggerMetadata.keywordFilter || [];
      const re = rule.triggerMetadata.regexPatterns || [];
      detail = kw.length > 0 ? `\n> Keywords: \`${kw.slice(0, 5).join('`, `')}${kw.length > 5 ? `\` +${kw.length - 5} more` : '`'}` : '';
      if (re.length > 0) detail += `\n> Regex: ${re.length} pattern(s)`;
    }
    if (rule && key === 'mentions') {
      const lim = rule.triggerMetadata.mentionTotalLimit;
      detail = `\n> Limit: ${lim} mentions per message`;
    }
    fields.push({ name: `${def.label} — ${status}`, value: def.desc + detail, inline: false });
  }

  const logCh      = cfg.logChannel ? `<#${cfg.logChannel}>` : 'Not set';
  const exempt     = cfg.exemptRoles.length > 0 ? cfg.exemptRoles.map(id => `<@&${id}>`).join(', ') : 'None';
  const exCh       = cfg.exemptChannels.length > 0 ? cfg.exemptChannels.map(id => `<#${id}>`).join(', ') : 'None';
  const activeCount = rules.filter(r => r.enabled).size;

  return new EmbedBuilder()
    .setColor(activeCount > 0 ? 0x2ECC71 : 0xE74C3C)
    .setTitle(`🛡️ AutoMod Dashboard — ${guild.name}`)
    .setDescription(`**${activeCount}** active rule(s) • **${rules.size}** total bot rule(s)`)
    .addFields(
      ...fields,
      { name: '📋 Log Channel',     value: logCh,  inline: true },
      { name: '🔓 Exempt Roles',    value: exempt,  inline: true },
      { name: '📵 Exempt Channels', value: exCh,    inline: true },
    )
    .setFooter({ text: 'Use /automod to manage • Powered by Discord native AutoMod' })
    .setTimestamp();
}

// ─────────────────────────────────────────────────────────────
// SLASH COMMANDS
// ─────────────────────────────────────────────────────────────
const commands = [
  // Utility
  new SlashCommandBuilder().setName('help').setDescription('Shows all bot commands'),
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('View server information'),
  new SlashCommandBuilder().setName('afk').setDescription('Set yourself as AFK')
    .addStringOption(o => o.setName('reason').setDescription('Reason')),
  new SlashCommandBuilder().setName('level').setDescription('Check your level/profile')
    .addUserOption(o => o.setName('user').setDescription('User to check')),

  // XP
  new SlashCommandBuilder().setName('addxp').setDescription('Add XP to a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('XP amount').setRequired(true)),
  new SlashCommandBuilder().setName('removexp').setDescription('Remove XP from a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('XP amount').setRequired(true)),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Top 10 leaderboard'),
  new SlashCommandBuilder().setName('setxpchannel').setDescription('Set level-up channel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)),
  new SlashCommandBuilder().setName('setautorole').setDescription('Set auto role on join')
    .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)),
  new SlashCommandBuilder().setName('setwelcome').setDescription('Set welcome channel and configure linked channels')
    .addChannelOption(o => o.setName('channel').setDescription('Welcome channel to send messages in').setRequired(true))
    .addChannelOption(o => o.setName('rules').setDescription('Rules channel to link in welcome message'))
    .addChannelOption(o => o.setName('announcements').setDescription('Announcements channel to link'))
    .addChannelOption(o => o.setName('general').setDescription('General chat channel to link')),

  // Moderation
  new SlashCommandBuilder().setName('clear').setDescription('Delete messages')
    .addIntegerOption(o => o.setName('amount').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100)),

  // ── ANNOUNCE (FIXED) ──
  // Channel is selected via slash option; message text is entered in a modal.
  // The modal now also has a "mention" field so users can @mention roles/users.
  new SlashCommandBuilder().setName('announce').setDescription('Send an announcement')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to send the announcement in').setRequired(true))
    .addBooleanOption(o => o.setName('ping_everyone').setDescription('Ping @everyone with the announcement? (default: false)')),

  new SlashCommandBuilder().setName('kick').setDescription('Kick a member')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),
  new SlashCommandBuilder().setName('ban').setDescription('Ban a member')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),
  new SlashCommandBuilder().setName('warn').setDescription('Warn a member')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)),
  new SlashCommandBuilder().setName('warnings').setDescription('View warnings for a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('clearwarnings').setDescription('Clear all warnings for a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('mute').setDescription('Timeout a member')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Duration').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),
  new SlashCommandBuilder().setName('unmute').setDescription('Remove timeout')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  // Economy
  new SlashCommandBuilder().setName('cash').setDescription('Check balance')
    .addUserOption(o => o.setName('user').setDescription('User')),
  new SlashCommandBuilder().setName('deposit').setDescription('Deposit cash into your bank')
    .addStringOption(o => o.setName('amount').setDescription('Amount or "all"').setRequired(true)),
  new SlashCommandBuilder().setName('withdraw').setDescription('Withdraw cash from your bank')
    .addStringOption(o => o.setName('amount').setDescription('Amount or "all"').setRequired(true)),
  new SlashCommandBuilder().setName('daily').setDescription('Claim daily reward'),
  new SlashCommandBuilder().setName('give').setDescription('Give cash')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)),
  new SlashCommandBuilder().setName('fish').setDescription('Go fishing'),
  new SlashCommandBuilder().setName('rob').setDescription('Rob a user')
    .addUserOption(o => o.setName('user').setDescription('Target').setRequired(true)),
  new SlashCommandBuilder().setName('gamble').setDescription('Gamble cash')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)),
  new SlashCommandBuilder().setName('shop').setDescription('View the shop'),
  new SlashCommandBuilder().setName('buy').setDescription('Buy an item from the shop')
    .addStringOption(o => o.setName('item').setDescription('Item name').setRequired(true)),
  new SlashCommandBuilder().setName('addshopitem').setDescription('Add a role item to the shop (admin)')
    .addStringOption(o => o.setName('name').setDescription('Item name').setRequired(true))
    .addIntegerOption(o => o.setName('price').setDescription('Price in cash').setRequired(true).setMinValue(1))
    .addRoleOption(o => o.setName('role').setDescription('Role to give on purchase').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Item description')),
  new SlashCommandBuilder().setName('removeshopitem').setDescription('Remove an item from the shop (admin)')
    .addStringOption(o => o.setName('name').setDescription('Item name to remove').setRequired(true)),

  // ── AUTOMOD ──
  new SlashCommandBuilder().setName('automod').setDescription('Manage the AutoMod system')
    .addSubcommand(s => s.setName('dashboard').setDescription('View full AutoMod dashboard'))
    .addSubcommand(s => s.setName('setup').setDescription('Enable all recommended AutoMod rules at once'))
    .addSubcommand(s => s.setName('disable').setDescription('Delete all bot-created AutoMod rules'))
    .addSubcommand(s => s.setName('enable').setDescription('Enable a specific AutoMod rule')
      .addStringOption(o => o.setName('rule').setDescription('Rule to enable').setRequired(true)
        .addChoices(
          { name: '🚫 Keyword Filter',  value: 'keyword'  },
          { name: '🔗 Invite Links',    value: 'invites'  },
          { name: '⚡ Spam Detection',  value: 'spam'     },
          { name: '🔔 Mention Spam',    value: 'mentions' },
          { name: '☣️ Harmful Content', value: 'harmful'  },
        )))
    .addSubcommand(s => s.setName('pause').setDescription('Pause (disable) a specific AutoMod rule')
      .addStringOption(o => o.setName('rule').setDescription('Rule to pause').setRequired(true)
        .addChoices(
          { name: '🚫 Keyword Filter',  value: 'keyword'  },
          { name: '🔗 Invite Links',    value: 'invites'  },
          { name: '⚡ Spam Detection',  value: 'spam'     },
          { name: '🔔 Mention Spam',    value: 'mentions' },
          { name: '☣️ Harmful Content', value: 'harmful'  },
        )))
    .addSubcommand(s => s.setName('addword').setDescription('Add a blocked keyword')
      .addStringOption(o => o.setName('word').setDescription('Word or phrase').setRequired(true)))
    .addSubcommand(s => s.setName('removeword').setDescription('Remove a blocked keyword')
      .addStringOption(o => o.setName('word').setDescription('Word or phrase').setRequired(true)))
    .addSubcommand(s => s.setName('listwords').setDescription('List all blocked keywords'))
    .addSubcommand(s => s.setName('addregex').setDescription('Add a regex pattern to the keyword filter')
      .addStringOption(o => o.setName('pattern').setDescription('Regex pattern').setRequired(true)))
    .addSubcommand(s => s.setName('removeregex').setDescription('Remove a regex pattern')
      .addStringOption(o => o.setName('pattern').setDescription('Regex pattern').setRequired(true)))
    .addSubcommand(s => s.setName('mentionlimit').setDescription('Set max allowed mentions per message')
      .addIntegerOption(o => o.setName('limit').setDescription('Limit (2-50)').setRequired(true).setMinValue(2).setMaxValue(50)))
    .addSubcommand(s => s.setName('setlog').setDescription('Set the AutoMod alert log channel')
      .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true)))
    .addSubcommand(s => s.setName('removelog').setDescription('Remove the AutoMod log channel'))
    .addSubcommand(s => s.setName('exemptrole').setDescription('Exempt a role from all AutoMod rules')
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand(s => s.setName('unexemptrole').setDescription('Remove role exemption')
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand(s => s.setName('exemptchannel').setDescription('Exempt a channel from all AutoMod rules')
      .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)))
    .addSubcommand(s => s.setName('unexemptchannel').setDescription('Remove channel exemption')
      .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true))),

  // ── ANTI-NUKE ──
  new SlashCommandBuilder().setName('antinuke').setDescription('Manage the Anti-Nuke protection system')
    .addSubcommand(s => s.setName('enable').setDescription('Enable Anti-Nuke protection'))
    .addSubcommand(s => s.setName('disable').setDescription('Disable Anti-Nuke protection'))
    .addSubcommand(s => s.setName('status').setDescription('View current Anti-Nuke configuration'))
    .addSubcommand(s => s.setName('setlog').setDescription('Set the Anti-Nuke alert log channel')
      .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true)))
    .addSubcommand(s => s.setName('punishment').setDescription('Set the punishment for nukers')
      .addStringOption(o => o.setName('type').setDescription('Punishment type').setRequired(true)
        .addChoices(
          { name: '🔨 Ban (recommended)',        value: 'ban'   },
          { name: '👢 Kick',                     value: 'kick'  },
          { name: '🔕 Strip Roles + Max Timeout', value: 'strip' },
        )))
    .addSubcommand(s => s.setName('whitelist').setDescription('Whitelist a user from Anti-Nuke')
      .addUserOption(o => o.setName('user').setDescription('User to whitelist').setRequired(true)))
    .addSubcommand(s => s.setName('unwhitelist').setDescription('Remove a user from the whitelist')
      .addUserOption(o => o.setName('user').setDescription('User to remove').setRequired(true)))
    .addSubcommand(s => s.setName('threshold').setDescription('Set action threshold (how many actions trigger punishment)')
      .addStringOption(o => o.setName('action').setDescription('Action type').setRequired(true)
        .addChoices(
          { name: 'Ban',            value: 'ban'           },
          { name: 'Kick',           value: 'kick'          },
          { name: 'Channel Delete', value: 'channelDelete' },
          { name: 'Channel Create', value: 'channelCreate' },
          { name: 'Role Delete',    value: 'roleDelete'    },
          { name: 'Webhook Create', value: 'webhookCreate' },
        ))
      .addIntegerOption(o => o.setName('limit').setDescription('Max actions allowed before punishment (1-10)').setRequired(true).setMinValue(1).setMaxValue(10))
      .addIntegerOption(o => o.setName('window').setDescription('Time window in seconds (3-60)').setRequired(true).setMinValue(3).setMaxValue(60))),

].map(c => c.toJSON());

// ─────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('Registering commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Commands registered!');
  } catch (e) { console.error(e); }
})();

// ─────────────────────────────────────────────────────────────
// READY
// ─────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({ status: 'idle', activities: [{ name: '/help | Xyrox', type: 0 }] });

  // Bank interest — 2% every hour, credited silently
  setInterval(() => {
    let changed = false;
    for (const id of Object.keys(economy)) {
      if (!economy[id].bank || economy[id].bank <= 0) continue;
      const interest = Math.floor(economy[id].bank * 0.02);
      if (interest > 0) { economy[id].bank += interest; changed = true; }
    }
    if (changed) saveEconomy();
  }, 60 * 60 * 1000);
});

// ─────────────────────────────────────────────────────────────
// XP HELPERS
// ─────────────────────────────────────────────────────────────
const xpCooldowns = new Map();

function addXP(guildId, userId, amount) {
  if (!levels[guildId]) levels[guildId] = {};
  if (!levels[guildId][userId]) levels[guildId][userId] = { xp: 0, level: 1 };
  const u = levels[guildId][userId];
  u.xp += amount;
  if (u.xp >= u.level * 100) { u.level++; u.xp -= (u.level - 1) * 100; saveData(); return true; }
  saveData(); return false;
}

function xpOnCooldown(userId) {
  const now = Date.now(), last = xpCooldowns.get(userId) || 0;
  if (now - last < 60000) return true;
  xpCooldowns.set(userId, now); return false;
}

// ─────────────────────────────────────────────────────────────
// WELCOME / AUTO-ROLE
// ─────────────────────────────────────────────────────────────
client.on('guildMemberAdd', async member => {
  const guildId = member.guild.id;
  if (autoRoles[guildId]) {
    const role = member.guild.roles.cache.get(autoRoles[guildId]);
    if (role) member.roles.add(role).catch(console.error);
  }
  const wcData = welcomeChannels[guildId];
  if (!wcData) return;
  const wcId = typeof wcData === 'string' ? wcData : wcData.channel;
  if (!wcId) return;
  const ch = member.guild.channels.cache.get(wcId);
  if (!ch) return;
  const count = member.guild.memberCount;

  const wData      = welcomeChannels[guildId];
  const rulesCh    = wData?.rules    ? `<#${wData.rules}>`    : '`#rules`';
  const announceCh = wData?.announce ? `<#${wData.announce}>` : '`#announcements`';
  const generalCh  = wData?.general  ? `<#${wData.general}>`  : '`#general`';

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setAuthor({
      name: member.user.username,
      iconURL: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
    })
    .setDescription(
      `• **Welcome to ${member.guild.name}!**\n\n` +
      `**Take a moment to settle in.**\n\n` +
      `» Read the rules ┆ ${rulesCh} ┆\n` +
      `» Check the announcements ┆ ${announceCh} ┆\n` +
      `» Chat here ┆ ${generalCh} ┆\n\n` +
      `*✧ This is a chill place to hang out, talk, and have fun with others. ✧*`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setFooter({ text: `We have ${count} members now!` })
    .setTimestamp();

  ch.send({ content: `Welcome ${member}!`, embeds: [embed] });
});

// ─────────────────────────────────────────────────────────────
// MESSAGE EVENT  (AFK + XP + prefix commands)
// ─────────────────────────────────────────────────────────────
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  const { guild, author: { id: userId } } = message;
  const guildId = guild.id;

  // AFK
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach(u => {
      if (afkData[u.id]) {
        const entry = afkData[u.id];
        const reason = typeof entry === 'object' ? entry.reason : entry;
        message.reply(`💤 **${u.username}** is AFK: **${reason}**`);
      }
    });
  }
  if (afkData[userId]) {
    const afkEntry = afkData[userId];
    const since = typeof afkEntry === 'object' ? afkEntry.since : Date.now();
    const elapsed = Date.now() - since;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins} minutes, ${secs} seconds` : `${secs} seconds`;
    const mentions = message.mentions.users.size;
    delete afkData[userId]; saveData();
    const returnEmbed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setTitle(`Heyy ${message.author.username}`)
      .setDescription(
        `Welcome Back!! ${message.author} I removed your AFK\n` +
        `Total Mentions: **${mentions}**\n` +
        `You were AFK For: **${timeStr}**`
      );
    message.reply({ embeds: [returnEmbed] }).then(m => setTimeout(() => m.delete().catch(() => {}), 8000));
  }

  // XP
  if (!xpOnCooldown(userId)) {
    const leveled = addXP(guildId, userId, Math.floor(Math.random() * 10) + 5);
    if (leveled) {
      const lvl = levels[guildId][userId].level;
      const ch  = xpChannels[guildId] ? guild.channels.cache.get(xpChannels[guildId]) : message.channel;
      if (ch) ch.send(`🎉🎊 Congrats ${message.author}! You reached level **${lvl}**!`);
    }
  }

  // ?rules
  if (message.content.toLowerCase() === '?rules') {
    return message.channel.send({ embeds: [new EmbedBuilder().setColor('Blue').setTitle('📜 Server Rules')
      .addFields(
        { name: '1. Respect Everyone',          value: 'No harassment, bullying, hate speech or discrimination.' },
        { name: '2. No Spamming',               value: 'Avoid spam, excessive links or self-promotion.' },
        { name: '3. Keep Content Appropriate',  value: 'No NSFW, illegal or pirated content.' },
        { name: '4. Respect Privacy',           value: 'No doxxing or sharing personal info.' },
        { name: '5. No Advertising',            value: 'No advertising without permission.' },
        { name: '6. Follow Staff Instructions', value: 'Respect mods and admins; decisions are final.' },
        { name: '7. No Impersonation',          value: 'Do not impersonate staff or members.' },
        { name: '8. Have Fun! 🎉',              value: 'Enjoy yourself and help build a great community!' },
      )
      .setFooter({ text: 'Breaking rules may result in warnings, mutes, kicks or bans.' })]});
  }

  // ?lock / ?unlock
  if (message.content.toLowerCase().startsWith('?lock')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply('❌ You need **Manage Channels** permission.');
    const reason = message.content.slice(5).trim() || 'No reason provided';
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }).catch(() => {});
    return message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setTitle('🔒 Channel Locked')
      .addFields({ name: 'Locked by', value: message.author.tag, inline: true }, { name: 'Reason', value: reason, inline: true })
      .setTimestamp()]});
  }

  if (message.content.toLowerCase().startsWith('?unlock')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply('❌ You need **Manage Channels** permission.');
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }).catch(() => {});
    return message.channel.send({ embeds: [new EmbedBuilder().setColor('Green').setTitle('🔓 Channel Unlocked')
      .addFields({ name: 'Unlocked by', value: message.author.tag, inline: true })
      .setTimestamp()]});
  }

  // ?membercount
  if (message.content.toLowerCase() === '?membercount') {
    await message.guild.members.fetch();
    const humans = message.guild.members.cache.filter(m => !m.user.bot).size;
    return message.channel.send({ embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) || undefined })
      .setTitle('👥 Member Count')
      .setDescription(`**${humans}** members`)
      .setThumbnail(message.guild.iconURL({ dynamic: true }) || null)
      .setFooter({ text: message.guild.name })
      .setTimestamp()]});
  }
});

// ─────────────────────────────────────────────────────────────
// LEADERBOARD BUILDER
// ─────────────────────────────────────────────────────────────
async function buildLeaderboard(guild, type) {
  const medals = ['🥇', '🥈', '🥉'];
  let desc = '';
  if (type === 'xp') {
    const sorted = Object.entries(levels[guild.id] || {})
      .sort(([, a], [, b]) => b.level !== a.level ? b.level - a.level : b.xp - a.xp).slice(0, 10);
    if (!sorted.length) { desc = 'No XP data yet.'; }
    else for (let i = 0; i < sorted.length; i++) {
      const [uid, d] = sorted[i];
      let u; try { u = await client.users.fetch(uid); } catch { u = null; }
      desc += `${medals[i] ? medals[i] + ' ' : `**#${i + 1}** `}${u ? u.username : 'Unknown'}\n\u00a0\u00a0\u00a0\u00a0Level ${d.level} • ${d.xp}/${d.level * 100} XP\n\n`;
    }
  } else {
    const sorted = Object.entries(economy).sort(([, a], [, b]) => b.cash - a.cash).slice(0, 10);
    if (!sorted.length) { desc = 'No economy data yet.'; }
    else for (let i = 0; i < sorted.length; i++) {
      const [uid, d] = sorted[i];
      let u; try { u = await client.users.fetch(uid); } catch { u = null; }
      desc += `${medals[i] ? medals[i] + ' ' : `**#${i + 1}** `}${u ? u.username : 'Unknown'}\n\u00a0\u00a0\u00a0\u00a0$${d.cash}\n\n`;
    }
  }
  const embed = new EmbedBuilder()
    .setTitle(`${type === 'xp' ? '🏆' : '💰'} ${guild.name} ${type === 'xp' ? 'XP' : 'Cash'} Leaderboard`)
    .setColor(type === 'xp' ? 'Gold' : 'Green').setDescription(desc.trim()).setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`lb_xp_${guild.id}`).setLabel('XP').setEmoji('🏆').setStyle(type === 'xp' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`lb_cash_${guild.id}`).setLabel('Cash').setEmoji('💰').setStyle(type === 'cash' ? ButtonStyle.Primary : ButtonStyle.Secondary),
  );
  return { embed, row };
}

// ─────────────────────────────────────────────────────────────
// INTERACTIONS
// ─────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {

  // ── BUTTON: leaderboard tab switch ──
  if (interaction.isButton()) {
    const { customId, guild } = interaction;
    if (customId.startsWith('lb_')) {
      const type = customId.startsWith('lb_xp_') ? 'xp' : 'cash';
      const { embed, row } = await buildLeaderboard(guild, type);
      return interaction.update({ embeds: [embed], components: [row] });
    }
    return;
  }

  // ── MODAL SUBMIT ──
  if (interaction.isModalSubmit()) {

    // ── Announce modal ──
    if (interaction.customId.startsWith('announce_modal_')) {
      // Format: announce_modal_{channelId}_{pingEveryone}
      const parts       = interaction.customId.replace('announce_modal_', '').split('_');
      const pingEveryone = parts.pop() === 'true';
      const channelId   = parts.join('_'); // re-join in case channel IDs had underscores (they don't, but safe)

      const messageText  = interaction.fields.getTextInputValue('announce_message');
      const mentionText  = interaction.fields.getTextInputValue('announce_mention').trim();
      const targetChannel = interaction.guild.channels.cache.get(channelId);

      if (!targetChannel) return interaction.reply({ content: '❌ Channel not found.', ephemeral: true });

      // Build content string: optional ping + optional custom mention
      let content = '';
      if (pingEveryone) content += '@everyone ';
      if (mentionText)  content += mentionText + ' ';
      content = content.trim();

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setDescription(messageText)
        .setFooter({ text: `Announced by ${interaction.user.tag}` })
        .setTimestamp();

      await targetChannel.send({ content: content || undefined, embeds: [embed], allowedMentions: { parse: ['everyone', 'roles', 'users'] } });
      return interaction.reply({ content: `✅ Announcement sent in ${targetChannel}.`, ephemeral: true });
    }

    return;
  }

  if (!interaction.isCommand()) return;
  const { commandName, guild, member } = interaction;
  const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
  const isMod   = isAdmin || member.permissions.has(PermissionsBitField.Flags.ManageMessages);
  const canKick = isAdmin || member.permissions.has(PermissionsBitField.Flags.KickMembers);
  const canBan  = isAdmin || member.permissions.has(PermissionsBitField.Flags.BanMembers);
  const canMute = isAdmin || member.permissions.has(PermissionsBitField.Flags.ModerateMembers);

  // ════════════════════════════════════════════
  // ANTI-NUKE COMMANDS
  // ════════════════════════════════════════════
  if (commandName === 'antinuke') {
    // Only the server owner can configure anti-nuke
    if (interaction.user.id !== guild.ownerId) {
      return interaction.reply({ content: '❌ Only the **server owner** can configure Anti-Nuke.', ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    const cfg = getAN(guild.id);

    if (sub === 'enable') {
      cfg.enabled = true;
      saveAntinuke();
      return interaction.reply({ embeds: [new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('🛡️ Anti-Nuke Enabled')
        .setDescription('The server is now protected against mass destructive actions.')
        .addFields(
          { name: '🔨 Punishment',  value: cfg.punishment.toUpperCase(), inline: true },
          { name: '📋 Log Channel', value: cfg.logChannel ? `<#${cfg.logChannel}>` : 'Not set', inline: true },
        )
        .setFooter({ text: 'Use /antinuke threshold to adjust limits' })
        .setTimestamp()] });
    }

    if (sub === 'disable') {
      cfg.enabled = false;
      saveAntinuke();
      return interaction.reply({ embeds: [new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('🛡️ Anti-Nuke Disabled')
        .setDescription('Anti-Nuke protection has been turned off.')
        .setTimestamp()] });
    }

    if (sub === 'status') {
      const thr = cfg.thresholds;
      const wl  = cfg.whitelist.length > 0 ? cfg.whitelist.map(id => `<@${id}>`).join(', ') : 'None';
      return interaction.reply({ embeds: [new EmbedBuilder()
        .setColor(cfg.enabled ? 0x2ECC71 : 0xE74C3C)
        .setTitle('🛡️ Anti-Nuke Status')
        .setDescription(cfg.enabled ? '✅ **Enabled** — Server is protected' : '❌ **Disabled** — Server is unprotected')
        .addFields(
          { name: '🔨 Punishment',      value: cfg.punishment.toUpperCase(),                                            inline: true },
          { name: '📋 Log Channel',     value: cfg.logChannel ? `<#${cfg.logChannel}>` : 'Not set',                   inline: true },
          { name: '🔓 Whitelist',       value: wl,                                                                      inline: false },
          { name: '📊 Thresholds',      value:
            `**Ban:** ${thr.ban.limit} in ${thr.ban.window / 1000}s\n` +
            `**Kick:** ${thr.kick.limit} in ${thr.kick.window / 1000}s\n` +
            `**Channel Delete:** ${thr.channelDelete.limit} in ${thr.channelDelete.window / 1000}s\n` +
            `**Channel Create:** ${thr.channelCreate.limit} in ${thr.channelCreate.window / 1000}s\n` +
            `**Role Delete:** ${thr.roleDelete.limit} in ${thr.roleDelete.window / 1000}s\n` +
            `**Webhook Create:** ${thr.webhookCreate.limit} in ${thr.webhookCreate.window / 1000}s`,
            inline: false },
        )
        .setTimestamp()], ephemeral: true });
    }

    if (sub === 'setlog') {
      const channel = interaction.options.getChannel('channel');
      cfg.logChannel = channel.id;
      saveAntinuke();
      return interaction.reply(`✅ Anti-Nuke alerts will be sent to ${channel}.`);
    }

    if (sub === 'punishment') {
      const type = interaction.options.getString('type');
      cfg.punishment = type;
      saveAntinuke();
      const labels = { ban: '🔨 Ban', kick: '👢 Kick', strip: '🔕 Strip Roles + Timeout' };
      return interaction.reply(`✅ Anti-Nuke punishment set to **${labels[type]}**.`);
    }

    if (sub === 'whitelist') {
      const user = interaction.options.getUser('user');
      if (!cfg.whitelist.includes(user.id)) { cfg.whitelist.push(user.id); saveAntinuke(); }
      return interaction.reply(`✅ **${user.tag}** is now whitelisted from Anti-Nuke.`);
    }

    if (sub === 'unwhitelist') {
      const user = interaction.options.getUser('user');
      cfg.whitelist = cfg.whitelist.filter(id => id !== user.id);
      saveAntinuke();
      return interaction.reply(`✅ **${user.tag}** removed from the Anti-Nuke whitelist.`);
    }

    if (sub === 'threshold') {
      const action = interaction.options.getString('action');
      const limit  = interaction.options.getInteger('limit');
      const window = interaction.options.getInteger('window') * 1000;
      cfg.thresholds[action] = { limit, window };
      saveAntinuke();
      return interaction.reply(`✅ **${action}** threshold set to **${limit}** actions within **${window / 1000}s**.`);
    }
  }

  // ════════════════════════════════════════════
  // AUTOMOD
  // ════════════════════════════════════════════
  if (commandName === 'automod') {
    if (!isAdmin) return interaction.reply({ content: '❌ You need **Administrator** permission.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const cfg = getAMConfig(guild.id);

    if (sub === 'dashboard') {
      const embed = await buildStatusEmbed(guild);
      return interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'setup') {
      const created = [];
      for (const key of Object.keys(RULE_DEFS)) {
        const existing = await findRule(guild, key);
        if (!existing) { await createRule(guild, key); created.push(RULE_DEFS[key].label); }
      }
      const embed = new EmbedBuilder().setColor('Green')
        .setTitle('🛡️ AutoMod Setup Complete')
        .setDescription(created.length > 0 ? `Created:\n${created.join('\n')}` : 'All rules were already active.')
        .addFields({ name: '💡 Next steps', value: 'Set a log channel with `/automod setlog`\nExempt staff roles with `/automod exemptrole`\nAdd custom keywords with `/automod addword`' })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'disable') {
      const rules = await fetchBotRules(guild);
      if (!rules.size) return interaction.editReply('⚠️ No bot-created rules found.');
      for (const [, r] of rules) await r.delete().catch(() => {});
      return interaction.editReply(`✅ Deleted **${rules.size}** AutoMod rule(s).`);
    }
    if (sub === 'enable') {
      const key  = interaction.options.getString('rule');
      const rule = await findRule(guild, key);
      if (!rule) { await createRule(guild, key); return interaction.editReply(`✅ **${RULE_DEFS[key].label}** rule created and enabled.`); }
      await rule.edit({ enabled: true });
      return interaction.editReply(`✅ **${RULE_DEFS[key].label}** has been enabled.`);
    }
    if (sub === 'pause') {
      const key  = interaction.options.getString('rule');
      const rule = await findRule(guild, key);
      if (!rule) return interaction.editReply(`❌ **${RULE_DEFS[key].label}** is not set up. Run \`/automod setup\` first.`);
      await rule.edit({ enabled: false });
      return interaction.editReply(`⏸️ **${RULE_DEFS[key].label}** has been paused.`);
    }
    if (sub === 'addword') {
      const word = interaction.options.getString('word').toLowerCase();
      const rule = await findRule(guild, 'keyword');
      if (!rule) return interaction.editReply('❌ Keyword Filter not set up. Run `/automod setup` first.');
      const kw = [...(rule.triggerMetadata.keywordFilter || [])];
      if (kw.includes(word)) return interaction.editReply(`⚠️ \`${word}\` is already blocked.`);
      kw.push(word);
      await rule.edit({ triggerMetadata: { keywordFilter: kw, regexPatterns: rule.triggerMetadata.regexPatterns || [] } });
      return interaction.editReply(`✅ Added \`${word}\` to the keyword filter. (**${kw.length}** keywords total)`);
    }
    if (sub === 'removeword') {
      const word = interaction.options.getString('word').toLowerCase();
      const rule = await findRule(guild, 'keyword');
      if (!rule) return interaction.editReply('❌ Keyword Filter not set up.');
      const kw = (rule.triggerMetadata.keywordFilter || []).filter(w => w !== word);
      if (kw.length === (rule.triggerMetadata.keywordFilter || []).length) return interaction.editReply(`⚠️ \`${word}\` was not in the list.`);
      await rule.edit({ triggerMetadata: { keywordFilter: kw, regexPatterns: rule.triggerMetadata.regexPatterns || [] } });
      return interaction.editReply(`✅ Removed \`${word}\`. (**${kw.length}** keywords remaining)`);
    }
    if (sub === 'listwords') {
      const rule = await findRule(guild, 'keyword');
      if (!rule) return interaction.editReply('❌ Keyword Filter not set up.');
      const kw = rule.triggerMetadata.keywordFilter || [];
      const re = rule.triggerMetadata.regexPatterns || [];
      if (!kw.length && !re.length) return interaction.editReply('📋 No keywords or regex patterns set.');
      const embed = new EmbedBuilder().setColor('Blue').setTitle('📋 Blocked Keywords')
        .addFields(
          { name: `🔤 Keywords (${kw.length})`, value: kw.length ? kw.map(w => `\`${w}\``).join(', ') : 'None', inline: false },
          { name: `🔣 Regex Patterns (${re.length})`, value: re.length ? re.map(p => `\`${p}\``).join('\n') : 'None', inline: false },
        ).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'addregex') {
      const pattern = interaction.options.getString('pattern');
      try { new RegExp(pattern); } catch { return interaction.editReply('❌ Invalid regex pattern.'); }
      const rule = await findRule(guild, 'keyword');
      if (!rule) return interaction.editReply('❌ Keyword Filter not set up. Run `/automod setup` first.');
      const re = [...(rule.triggerMetadata.regexPatterns || [])];
      if (re.includes(pattern)) return interaction.editReply('⚠️ That pattern already exists.');
      if (re.length >= 10) return interaction.editReply('❌ Maximum 10 regex patterns allowed by Discord.');
      re.push(pattern);
      await rule.edit({ triggerMetadata: { keywordFilter: rule.triggerMetadata.keywordFilter || [], regexPatterns: re } });
      return interaction.editReply(`✅ Added regex pattern \`${pattern}\`.`);
    }
    if (sub === 'removeregex') {
      const pattern = interaction.options.getString('pattern');
      const rule = await findRule(guild, 'keyword');
      if (!rule) return interaction.editReply('❌ Keyword Filter not set up.');
      const re = (rule.triggerMetadata.regexPatterns || []).filter(p => p !== pattern);
      if (re.length === (rule.triggerMetadata.regexPatterns || []).length) return interaction.editReply('⚠️ That pattern was not found.');
      await rule.edit({ triggerMetadata: { keywordFilter: rule.triggerMetadata.keywordFilter || [], regexPatterns: re } });
      return interaction.editReply(`✅ Removed regex pattern \`${pattern}\`.`);
    }
    if (sub === 'mentionlimit') {
      const limit = interaction.options.getInteger('limit');
      const rule  = await findRule(guild, 'mentions');
      if (!rule) return interaction.editReply('❌ Mention Spam rule not set up. Run `/automod setup` first.');
      await rule.edit({ triggerMetadata: { mentionTotalLimit: limit, mentionRaidProtectionEnabled: true } });
      return interaction.editReply(`✅ Mention limit set to **${limit}** mentions per message.`);
    }
    if (sub === 'setlog') {
      const channel = interaction.options.getChannel('channel');
      cfg.logChannel = channel.id;
      saveAutomod();
      await updateAllLogChannels(guild, channel.id);
      return interaction.editReply(`✅ AutoMod alerts will now be sent to ${channel}.`);
    }
    if (sub === 'removelog') {
      cfg.logChannel = null;
      saveAutomod();
      await updateAllLogChannels(guild, null);
      return interaction.editReply('✅ AutoMod log channel removed. Alert actions have been stripped from all rules.');
    }
    if (sub === 'exemptrole') {
      const role = interaction.options.getRole('role');
      if (!cfg.exemptRoles.includes(role.id)) { cfg.exemptRoles.push(role.id); saveAutomod(); }
      await updateAllRuleExemptions(guild);
      return interaction.editReply(`✅ **${role.name}** is now exempt from all AutoMod rules.`);
    }
    if (sub === 'unexemptrole') {
      const role = interaction.options.getRole('role');
      cfg.exemptRoles = cfg.exemptRoles.filter(id => id !== role.id);
      saveAutomod();
      await updateAllRuleExemptions(guild);
      return interaction.editReply(`✅ **${role.name}** is no longer exempt.`);
    }
    if (sub === 'exemptchannel') {
      const ch = interaction.options.getChannel('channel');
      if (!cfg.exemptChannels.includes(ch.id)) { cfg.exemptChannels.push(ch.id); saveAutomod(); }
      await updateAllRuleExemptions(guild);
      return interaction.editReply(`✅ ${ch} is now exempt from all AutoMod rules.`);
    }
    if (sub === 'unexemptchannel') {
      const ch = interaction.options.getChannel('channel');
      cfg.exemptChannels = cfg.exemptChannels.filter(id => id !== ch.id);
      saveAutomod();
      await updateAllRuleExemptions(guild);
      return interaction.editReply(`✅ ${ch} is no longer exempt.`);
    }
  }

  // ════════════════════════════════════════════
  // MODERATION
  // ════════════════════════════════════════════

  if (commandName === 'kick') {
    if (!canKick) return interaction.reply({ content: '❌ You need **Kick Members** permission.', ephemeral: true });
    const targetUser   = interaction.options.getUser('user');
    const reason       = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember)          return interaction.reply({ content: '❌ That user is not in this server.', ephemeral: true });
    if (!targetMember.kickable) return interaction.reply({ content: "❌ I can't kick that user.", ephemeral: true });
    if (targetMember.id === interaction.user.id) return interaction.reply({ content: '❌ You cannot kick yourself.', ephemeral: true });
    await targetMember.send(`👢 You have been **kicked** from **${guild.name}**.\n**Reason:** ${reason}`).catch(() => {});
    await targetMember.kick(reason);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xE67E22).setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() }).setTitle('👢 Member Kicked')
      .addFields({ name: 'User', value: `${targetUser}`, inline: true }, { name: 'Moderator', value: `${interaction.user}`, inline: true }, { name: 'Reason', value: reason })
      .setFooter({ text: `ID: ${targetUser.id}` }).setTimestamp()] });
  }

  if (commandName === 'ban') {
    if (!canBan) return interaction.reply({ content: '❌ You need **Ban Members** permission.', ephemeral: true });
    const targetUser   = interaction.options.getUser('user');
    const reason       = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (targetMember) {
      if (!targetMember.bannable) return interaction.reply({ content: "❌ I can't ban that user.", ephemeral: true });
      if (targetMember.id === interaction.user.id) return interaction.reply({ content: '❌ You cannot ban yourself.', ephemeral: true });
      await targetMember.send(`🔨 You have been **banned** from **${guild.name}**.\n**Reason:** ${reason}`).catch(() => {});
    }
    await guild.members.ban(targetUser.id, { reason, deleteMessageSeconds: 0 });
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xE74C3C).setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() }).setTitle('🔨 Member Banned')
      .addFields({ name: 'User', value: `${targetUser}`, inline: true }, { name: 'Moderator', value: `${interaction.user}`, inline: true }, { name: 'Reason', value: reason })
      .setFooter({ text: `ID: ${targetUser.id}` }).setTimestamp()] });
  }

  if (commandName === 'warn') {
    if (!isMod) return interaction.reply({ content: '❌ You need **Manage Messages** permission.', ephemeral: true });
    const targetUser = interaction.options.getUser('user');
    const reason     = interaction.options.getString('reason');
    if (targetUser.id === interaction.user.id) return interaction.reply({ content: '❌ You cannot warn yourself.', ephemeral: true });
    if (targetUser.bot) return interaction.reply({ content: '❌ You cannot warn a bot.', ephemeral: true });
    if (!warnings[guild.id]) warnings[guild.id] = {};
    if (!warnings[guild.id][targetUser.id]) warnings[guild.id][targetUser.id] = [];
    warnings[guild.id][targetUser.id].push({ reason, moderator: interaction.user.tag, date: new Date().toISOString() });
    saveData();
    const total = warnings[guild.id][targetUser.id].length;
    const tm = await guild.members.fetch(targetUser.id).catch(() => null);
    if (tm) await tm.send(`⚠️ You were **warned** in **${guild.name}**.\n**Reason:** ${reason}\n**Total warnings:** ${total}`).catch(() => {});
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xF1C40F).setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() }).setTitle('⚠️ Member Warned')
      .addFields({ name: 'User', value: `${targetUser}`, inline: true }, { name: 'Moderator', value: `${interaction.user}`, inline: true }, { name: 'Total Warnings', value: `${total}`, inline: true }, { name: 'Reason', value: reason })
      .setFooter({ text: `ID: ${targetUser.id}` }).setTimestamp()] });
  }

  if (commandName === 'warnings') {
    if (!isMod) return interaction.reply({ content: '❌ You need **Manage Messages** permission.', ephemeral: true });
    const targetUser = interaction.options.getUser('user');
    const userWarns  = warnings[guild.id]?.[targetUser.id];
    if (!userWarns || !userWarns.length) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2ECC71).setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() }).setTitle('📋 Warnings').setDescription('This user has no warnings.').setTimestamp()] });
    const list = userWarns.map((w, i) => `**#${i + 1}** — ${w.reason}\n> by ${w.moderator || 'Unknown'} • ${new Date(w.date).toLocaleDateString('en-US')}`).join('\n\n');
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xF1C40F).setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() }).setTitle('📋 Warnings').setDescription(list).setFooter({ text: `Total: ${userWarns.length} • ID: ${targetUser.id}` }).setTimestamp()] });
  }

  if (commandName === 'clearwarnings') {
    if (!isAdmin) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    const targetUser = interaction.options.getUser('user');
    if (warnings[guild.id]) warnings[guild.id][targetUser.id] = [];
    saveData();
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2ECC71).setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() }).setTitle('🧹 Warnings Cleared').setDescription(`All warnings for ${targetUser} have been cleared.`).setTimestamp()] });
  }

  if (commandName === 'mute') {
    if (!canMute) return interaction.reply({ content: '❌ You need **Moderate Members** permission.', ephemeral: true });
    const targetUser   = interaction.options.getUser('user');
    const minutes      = interaction.options.getInteger('minutes');
    const reason       = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember)             return interaction.reply({ content: '❌ User not in server.', ephemeral: true });
    if (!targetMember.moderatable) return interaction.reply({ content: "❌ I can't mute that user.", ephemeral: true });
    await targetMember.timeout(minutes * 60000, reason);
    await targetMember.send(`🔇 You were **muted** in **${guild.name}** for **${minutes} min**.\n**Reason:** ${reason}`).catch(() => {});
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xE67E22).setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() }).setTitle('🔇 Member Muted')
      .addFields({ name: 'User', value: `${targetUser}`, inline: true }, { name: 'Moderator', value: `${interaction.user}`, inline: true }, { name: 'Duration', value: `${minutes} minute(s)`, inline: true }, { name: 'Reason', value: reason })
      .setFooter({ text: `ID: ${targetUser.id}` }).setTimestamp()] });
  }

  if (commandName === 'unmute') {
    if (!canMute) return interaction.reply({ content: '❌ You need **Moderate Members** permission.', ephemeral: true });
    const targetUser   = interaction.options.getUser('user');
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return interaction.reply({ content: '❌ User not in server.', ephemeral: true });
    if (!targetMember.isCommunicationDisabled()) return interaction.reply({ content: '⚠️ That user is not muted.', ephemeral: true });
    await targetMember.timeout(null);
    await targetMember.send(`🔊 Your mute in **${guild.name}** has been removed.`).catch(() => {});
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2ECC71).setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() }).setTitle('🔊 Member Unmuted')
      .addFields({ name: 'User', value: `${targetUser}`, inline: true }, { name: 'Moderator', value: `${interaction.user}`, inline: true })
      .setFooter({ text: `ID: ${targetUser.id}` }).setTimestamp()] });
  }

  // ── ANNOUNCE (FIXED) ──
  if (commandName === 'announce') {
    if (!isMod) return interaction.reply({ content: '❌ You need **Manage Messages** permission.', ephemeral: true });
    const targetChannel = interaction.options.getChannel('channel');
    const pingEveryone  = interaction.options.getBoolean('ping_everyone') ?? false;

    const modal = new ModalBuilder()
      .setCustomId(`announce_modal_${targetChannel.id}_${pingEveryone}`)
      .setTitle('Send Announcement');

    const msgInput = new TextInputBuilder()
      .setCustomId('announce_message')
      .setLabel('Announcement Message')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Type your announcement here...\nSupports Discord markdown formatting.')
      .setRequired(true)
      .setMaxLength(4000);

    // New: optional mention field — user types @Role or @User name/ID here
    const mentionInput = new TextInputBuilder()
      .setCustomId('announce_mention')
      .setLabel('Ping (optional) — e.g. <@&ROLE_ID> or <@USER_ID>')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Leave blank for no extra ping')
      .setRequired(false)
      .setMaxLength(200);

    modal.addComponents(
      new ActionRowBuilder().addComponents(msgInput),
      new ActionRowBuilder().addComponents(mentionInput),
    );
    return interaction.showModal(modal);
  }

  if (commandName === 'clear') {
    if (!isMod) return interaction.reply({ content: '❌ You need **Manage Messages** permission.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const deleted = await interaction.channel.bulkDelete(interaction.options.getInteger('amount'), true).catch(() => null);
    return interaction.editReply(deleted ? `✅ Deleted **${deleted.size}** message(s).` : '❌ Failed — messages older than 14 days cannot be bulk deleted.');
  }

  // ════════════════════════════════════════════
  // UTILITY
  // ════════════════════════════════════════════

  if (commandName === 'help') {
    const autoRules  = await guild.autoModerationRules.fetch().catch(() => null);
    const hasAutoMod = autoRules && autoRules.size > 0;
    const anCfg      = getAN(guild.id);
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🤖 Bot Commands').setColor('Blue')
      .setDescription(
        (hasAutoMod ? '🛡️ `Uses Discord AutoMod`' : '') +
        (anCfg.enabled ? '\n🔒 `Anti-Nuke is Active`' : '')
      )
      .addFields(
        { name: '⚔️ Moderation',  value: '`/kick` `/ban` `/warn` `/warnings` `/clearwarnings` `/mute` `/unmute` `/clear` `/announce`' },
        { name: '📈 Levels & XP', value: '`/level` `/addxp` `/removexp` `/leaderboard` `/setxpchannel`' },
        { name: '💰 Economy',     value: '`/cash` `/deposit` `/withdraw` `/daily` `/give` `/fish` `/rob` `/gamble` `/shop` `/buy`' },
        { name: '🛡️ AutoMod',    value: '`/automod dashboard` `setup` `enable` `pause` `disable`\n`addword` `removeword` `listwords` `addregex` `removeregex`\n`mentionlimit` `setlog` `removelog` `exemptrole` `exemptchannel`' },
        { name: '🔒 Anti-Nuke',   value: '`/antinuke enable` `disable` `status` `setlog` `punishment`\n`whitelist` `unwhitelist` `threshold`' },
        { name: '⚙️ Setup',       value: '`/setwelcome` `/setautorole` `/setxpchannel`' },
        { name: '🔧 Utility',     value: '`/afk` `/ping` `/serverinfo` `?rules` `?membercount` `?lock` `?unlock`' },
      )
      .setFooter({ text: hasAutoMod ? '🛡️ Discord AutoMod is active' : '💡 Set up AutoMod with /automod setup' })] });
  }

  if (commandName === 'ping') {
    const msg = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    return interaction.editReply(`🏓 Pong! Latency: **${msg.createdTimestamp - interaction.createdTimestamp}ms**`);
  }

  if (commandName === 'serverinfo') {
    await guild.members.fetch();
    const owner       = await guild.fetchOwner();
    const total       = guild.memberCount;
    const humans      = guild.members.cache.filter(m => !m.user.bot).size;
    const bots        = guild.members.cache.filter(m => m.user.bot).size;
    const online      = guild.members.cache.filter(m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd').size;
    const textCh      = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceCh     = guild.channels.cache.filter(c => c.type === 2).size;
    const categories  = guild.channels.cache.filter(c => c.type === 4).size;
    const roles       = guild.roles.cache.size - 1;
    const emojis      = guild.emojis.cache.size;
    const boosts      = guild.premiumSubscriptionCount || 0;
    const boostTier   = guild.premiumTier ? `Tier ${guild.premiumTier}` : 'None';
    const verif       = ['None', 'Low', 'Medium', 'High', 'Very High'][guild.verificationLevel] || 'Unknown';
    const created     = `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`;
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) || undefined })
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👑 Owner',        value: `${owner}`,                                                                    inline: true },
        { name: '🆔 Server ID',    value: `\`${guild.id}\``,                                                            inline: true },
        { name: '📅 Created',      value: created,                                                                       inline: true },
        { name: '👥 Members',      value: `👤 Humans: **${humans}**\n🤖 Bots: **${bots}**\n🟢 Online: **${online}**\n📊 Total: **${total}**`, inline: true },
        { name: '💬 Channels',     value: `💬 Text: **${textCh}**\n🔊 Voice: **${voiceCh}**\n📁 Categories: **${categories}**`,               inline: true },
        { name: '✨ Server Info',  value: `🏷️ Roles: **${roles}**\n😀 Emojis: **${emojis}**\n🚀 Boosts: **${boosts}** (${boostTier})\n🔒 Verification: **${verif}**`, inline: true },
      )
      .setFooter({ text: `${total} total members`, iconURL: guild.iconURL({ dynamic: true }) || undefined })
      .setTimestamp();
    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));
    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'afk') {
    const reason = interaction.options.getString('reason') || 'AFK';
    afkData[interaction.user.id] = { reason, since: Date.now() }; saveData();
    const afkEmbed = new EmbedBuilder()
      .setColor(0x57F287)
      .setDescription(`✅ **${interaction.user}**, You are now marked as AFK due to: **${reason}**`);
    return interaction.reply({ embeds: [afkEmbed] });
  }

  if (commandName === 'level') {
    const target = interaction.options.getUser('user') || interaction.user;
    if (!levels[guild.id]) levels[guild.id] = {};
    if (!levels[guild.id][target.id]) levels[guild.id][target.id] = { xp: 0, level: 1 };
    const d = levels[guild.id][target.id];
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`${target.tag}'s Profile`).setColor('Gold')
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**Level:** ${d.level}\n**XP:** ${d.xp} / ${d.level * 100}`)] });
  }

  if (commandName === 'setwelcome') {
    if (!isAdmin) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    const ch       = interaction.options.getChannel('channel');
    const rules    = interaction.options.getChannel('rules');
    const announce = interaction.options.getChannel('announcements');
    const general  = interaction.options.getChannel('general');
    if (!welcomeChannels[guild.id] || typeof welcomeChannels[guild.id] === 'string') welcomeChannels[guild.id] = {};
    welcomeChannels[guild.id].channel = ch.id;
    if (rules)    welcomeChannels[guild.id].rules    = rules.id;
    if (announce) welcomeChannels[guild.id].announce = announce.id;
    if (general)  welcomeChannels[guild.id].general  = general.id;
    saveData();
    const linked = [
      rules    ? `Rules → ${rules}`            : null,
      announce ? `Announcements → ${announce}` : null,
      general  ? `General → ${general}`        : null,
    ].filter(Boolean).join('\n') || 'No channels linked — they will show as plain text.';
    return interaction.reply({ embeds: [new EmbedBuilder().setColor('Green').setTitle('✅ Welcome Channel Set')
      .addFields(
        { name: 'Welcome Channel', value: `${ch}`, inline: true },
        { name: 'Linked Channels', value: linked, inline: false },
      )
      .setFooter({ text: 'Use /setwelcome again to update linked channels' })], ephemeral: true });
  }

  if (commandName === 'setautorole') {
    if (!isAdmin) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    const role = interaction.options.getRole('role');
    autoRoles[guild.id] = role.id; saveData();
    return interaction.reply(`✅ Auto-role set to **${role.name}**`);
  }

  if (commandName === 'setxpchannel') {
    if (!isAdmin) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    const ch = interaction.options.getChannel('channel');
    xpChannels[guild.id] = ch.id; saveData();
    return interaction.reply(`✅ Level-up notifications will be sent to ${ch}.`);
  }

  if (commandName === 'addxp') {
    if (!isAdmin) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    if (amount <= 0) return interaction.reply({ content: '❌ Amount must be > 0.', ephemeral: true });
    if (!levels[guild.id]) levels[guild.id] = {};
    if (!levels[guild.id][target.id]) levels[guild.id][target.id] = { xp: 0, level: 1 };
    const leveled = addXP(guild.id, target.id, amount);
    const d = levels[guild.id][target.id];
    return interaction.reply(`✅ Added **${amount} XP** to ${target}.${leveled ? ` They leveled up to **Level ${d.level}**! 🎉` : ` Now at **${d.xp}/${d.level * 100} XP**.`}`);
  }

  if (commandName === 'removexp') {
    if (!isAdmin) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    if (amount <= 0) return interaction.reply({ content: '❌ Amount must be > 0.', ephemeral: true });
    if (!levels[guild.id]) levels[guild.id] = {};
    if (!levels[guild.id][target.id]) levels[guild.id][target.id] = { xp: 0, level: 1 };
    const u = levels[guild.id][target.id];
    u.xp -= amount;
    while (u.xp < 0 && u.level > 1) { u.level--; u.xp += u.level * 100; }
    if (u.xp < 0) u.xp = 0;
    saveData();
    return interaction.reply(`✅ Removed **${amount} XP** from ${target}. Now at **Level ${u.level}** (${u.xp}/${u.level * 100} XP).`);
  }

  if (commandName === 'leaderboard') {
    const { embed, row } = await buildLeaderboard(guild, 'xp');
    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // ════════════════════════════════════════════
  // ECONOMY
  // ════════════════════════════════════════════
  ensureUser(interaction.user.id);

  if (commandName === 'cash') {
    const target = interaction.options.getUser('user') || interaction.user;
    ensureUser(target.id);
    const u = economy[target.id];
    const total = u.cash + u.bank;
    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setTitle(`Balance - ${target.username}`)
      .addFields(
        { name: '💵 Total Balance:', value: `$${total}`, inline: false },
        { name: '💰 Holding:',       value: `$${u.cash}`, inline: false },
        { name: '🏦 Bank:',          value: `$${u.bank}`, inline: false },
      )
      .setFooter({ text: 'dollars in the bank earn interest!' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (commandName === 'deposit') {
    const u = economy[interaction.user.id];
    const raw = interaction.options.getString('amount');
    const amount = raw.toLowerCase() === 'all' ? u.cash : parseInt(raw);
    if (isNaN(amount) || amount <= 0) return interaction.reply({ content: '❌ Enter a valid amount or "all".', ephemeral: true });
    if (u.cash < amount) return interaction.reply({ content: `❌ You only have **$${u.cash}** in hand.`, ephemeral: true });
    u.cash -= amount; u.bank += amount; saveEconomy();
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2ECC71).setTitle('🏦 Deposit successful').addFields({ name: 'Deposited', value: `$${amount}`, inline: true }, { name: 'Bank balance', value: `$${u.bank}`, inline: true }).setTimestamp()] });
  }
  if (commandName === 'withdraw') {
    const u = economy[interaction.user.id];
    const raw = interaction.options.getString('amount');
    const amount = raw.toLowerCase() === 'all' ? u.bank : parseInt(raw);
    if (isNaN(amount) || amount <= 0) return interaction.reply({ content: '❌ Enter a valid amount or "all".', ephemeral: true });
    if (u.bank < amount) return interaction.reply({ content: `❌ You only have **$${u.bank}** in the bank.`, ephemeral: true });
    u.bank -= amount; u.cash += amount; saveEconomy();
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2ECC71).setTitle('🏦 Withdrawal successful').addFields({ name: 'Withdrawn', value: `$${amount}`, inline: true }, { name: 'Holding', value: `$${u.cash}`, inline: true }).setTimestamp()] });
  }
  if (commandName === 'daily') {
    const now = Date.now(), last = economy[interaction.user.id].lastDaily, cd = 86400000;
    if (now - last < cd) { const r = cd - (now - last); return interaction.reply(`⏳ Already claimed. Try again in **${Math.floor(r / 3600000)}h ${Math.floor((r % 3600000) / 60000)}m**.`); }
    const reward = Math.floor(Math.random() * 500) + 100;
    economy[interaction.user.id].cash += reward; economy[interaction.user.id].lastDaily = now; saveEconomy();
    return interaction.reply(`✅ You claimed your daily reward of **$${reward}**!`);
  }
  if (commandName === 'give') {
    const target = interaction.options.getUser('user'), amount = interaction.options.getInteger('amount');
    ensureUser(target.id);
    if (amount <= 0) return interaction.reply('❌ Amount must be > 0.');
    if (target.id === interaction.user.id) return interaction.reply('❌ You cannot give cash to yourself.');
    if (economy[interaction.user.id].cash < amount) return interaction.reply('❌ Not enough cash in hand.');
    economy[interaction.user.id].cash -= amount; economy[target.id].cash += amount; saveEconomy();
    return interaction.reply(`💸 Gave **$${amount}** to **${target.tag}**`);
  }
  if (commandName === 'fish') {
    const gain = Math.floor(Math.random() * 300) + 50;
    economy[interaction.user.id].cash += gain; saveEconomy();
    return interaction.reply(`🎣 You caught a fish and earned **$${gain}**!`);
  }
  if (commandName === 'rob') {
    const target = interaction.options.getUser('user'); ensureUser(target.id);
    if (target.id === interaction.user.id) return interaction.reply("❌ You can't rob yourself.");
    if (economy[target.id].cash < 100) return interaction.reply('❌ Target has less than $100 in hand (bank is safe!).');
    if (Math.random() < 0.5) {
      const stolen = Math.floor(Math.random() * (economy[target.id].cash / 2)) + 1;
      economy[target.id].cash -= stolen; economy[interaction.user.id].cash += stolen; saveEconomy();
      return interaction.reply(`💰 Success! Stole **$${stolen}** from **${target.tag}**`);
    } else {
      const lost = Math.floor(Math.random() * 100) + 10;
      economy[interaction.user.id].cash = Math.max(0, economy[interaction.user.id].cash - lost); saveEconomy();
      return interaction.reply(`❌ You got caught! Lost **$${lost}**`);
    }
  }
  if (commandName === 'gamble') {
    const amount = interaction.options.getInteger('amount');
    if (amount <= 0) return interaction.reply('❌ Amount must be > 0.');
    if (economy[interaction.user.id].cash < amount) return interaction.reply('❌ Not enough cash in hand.');
    if (Math.random() < 0.5) { economy[interaction.user.id].cash += amount; saveEconomy(); return interaction.reply(`🎉 Won **$${amount}**! Holding: **$${economy[interaction.user.id].cash}**`); }
    economy[interaction.user.id].cash -= amount; saveEconomy();
    return interaction.reply(`💸 Lost **$${amount}**. Holding: **$${economy[interaction.user.id].cash}**`);
  }
  if (commandName === 'shop') {
    if (!Object.keys(shop).length) {
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🛒 Shop').setColor('Green').setDescription('The shop is empty. Admins can add items with `/addshopitem`.')] });
    }
    let desc = '';
    for (const [name, data] of Object.entries(shop)) {
      const roleTag = data.roleId ? `<@&${data.roleId}>` : '';
      desc += `**${name}** — $${data.price}${roleTag ? ` • ${roleTag}` : ''}\n${data.desc || ''}\n\n`;
    }
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🛒 Shop').setColor('Green').setDescription(desc.trim()).setFooter({ text: 'Use /buy <item name> to purchase' })] });
  }
  if (commandName === 'buy') {
    const itemName = interaction.options.getString('item');
    const itemData = shop[itemName];
    if (!itemData) return interaction.reply({ content: "❌ That item doesn't exist. Check `/shop` for available items.", ephemeral: true });
    if (economy[interaction.user.id].cash < itemData.price) return interaction.reply({ content: `❌ Not enough cash in hand. You need **$${itemData.price}** but are holding **$${economy[interaction.user.id].cash}**. Use \`/withdraw\` to get funds from your bank.`, ephemeral: true });
    if (itemData.roleId && economy[interaction.user.id].inventory.includes(itemName)) {
      return interaction.reply({ content: `⚠️ You already own **${itemName}**.`, ephemeral: true });
    }
    economy[interaction.user.id].cash -= itemData.price;
    economy[interaction.user.id].inventory.push(itemName);
    saveEconomy();
    if (itemData.roleId) {
      const role = guild.roles.cache.get(itemData.roleId);
      if (role) {
        const buyerMember = await guild.members.fetch(interaction.user.id).catch(() => null);
        if (buyerMember) await buyerMember.roles.add(role).catch(() => {});
        return interaction.reply({ embeds: [new EmbedBuilder()
          .setColor(0x2ECC71).setTitle('🛒 Purchase Successful!')
          .setDescription(`You bought **${itemName}** and received the ${role} role!`)
          .addFields({ name: 'Price Paid', value: `$${itemData.price}`, inline: true }, { name: 'New Balance', value: `$${economy[interaction.user.id].cash}`, inline: true })
          .setTimestamp()] });
      }
    }
    return interaction.reply({ embeds: [new EmbedBuilder()
      .setColor(0x2ECC71).setTitle('🛒 Purchase Successful!')
      .setDescription(`You bought **${itemName}**!`)
      .addFields({ name: 'Price Paid', value: `$${itemData.price}`, inline: true }, { name: 'New Balance', value: `$${economy[interaction.user.id].cash}`, inline: true })
      .setTimestamp()] });
  }
  if (commandName === 'addshopitem') {
    if (!isAdmin) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    const name  = interaction.options.getString('name');
    const price = interaction.options.getInteger('price');
    const role  = interaction.options.getRole('role');
    const desc  = interaction.options.getString('description') || `Grants the ${role.name} role`;
    if (shop[name]) return interaction.reply({ content: `⚠️ An item named **${name}** already exists. Remove it first with \`/removeshopitem\`.`, ephemeral: true });
    shop[name] = { price, roleId: role.id, desc };
    saveShop();
    return interaction.reply({ embeds: [new EmbedBuilder()
      .setColor(0x2ECC71).setTitle('✅ Shop Item Added')
      .addFields(
        { name: 'Item',        value: name,        inline: true },
        { name: 'Price',       value: `$${price}`, inline: true },
        { name: 'Role',        value: `${role}`,   inline: true },
        { name: 'Description', value: desc,         inline: false },
      ).setTimestamp()] });
  }
  if (commandName === 'removeshopitem') {
    if (!isAdmin) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    const name = interaction.options.getString('name');
    if (!shop[name]) return interaction.reply({ content: `❌ No item named **${name}** found.`, ephemeral: true });
    delete shop[name];
    saveShop();
    return interaction.reply(`✅ Removed **${name}** from the shop.`);
  }
});

client.login(TOKEN);
