/**
 * src/bot/managers/BotManager.js — Core bot orchestrator
 *
 * Responsibilities:
 *  - Create and configure the Discord.js Client (preserving all original intents/partials)
 *  - Bootstrap the Kythia addon system via kythia-core
 *  - Load commands, events, and interaction handlers
 *  - Expose the live client to the API server
 */

'use strict';

const {
    GatewayIntentBits,
    Partials,
    Options,
    Client,
} = require('discord.js');

const {
    Kythia,
    KythiaModel,
    createSequelizeInstance,
} = require('kythia-core');

const {
    isTeam,
    isPremium,
    embedFooter,
    getGuildSafe,
    isVoterActive,
    getMemberSafe,
    getChannelSafe,
    createContainer,
    simpleContainer,
    chunkTextDisplay,
    getTextChannelSafe,
    setVoiceChannelStatus,
} = require('kythia-core').helpers.discord;

const { checkCooldown, parseDuration, formatDuration } = require('kythia-core').helpers.time;
const { getHelpData, buildHelpReply }                   = require('kythia-core').helpers.helpUtils;
const { convertColor }                                   = require('kythia-core').utils;

const log      = require('@utils/logger');
const config   = require('@config/index').getConfig();

class BotManager {
    constructor() {
        this.client  = null;
        this.kythia  = null;
    }

    /**
     * Build the Discord.js Client.
     * Exact intent + partial + cache configuration from the original Kythia codebase.
     */
    _createClient() {
        return new Client({
            waitGuildTimeout: 60000,
            closeTimeout:     60000,
            rest: {
                timeout: 60000,
                retries: 20,
            },
            ws: {
                large_threshold: 250,
            },

            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.AutoModerationExecution,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessageTyping,
                GatewayIntentBits.GuildExpressions,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.AutoModerationConfiguration,
                GatewayIntentBits.GuildWebhooks,
                GatewayIntentBits.GuildIntegrations,
                GatewayIntentBits.GuildScheduledEvents,
                GatewayIntentBits.GuildMessagePolls,
            ],

            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction,
                Partials.User,
                Partials.GuildMember,
            ],

            makeCache: Options.cacheWithLimits({
                PresenceManager: 0,
                ThreadManager: { maxSize: 25 },
                GuildMemberManager: {
                    maxSize:       2000,
                    keepOverLimit: (member) =>
                        (member.client.user && member.id === member.client.user.id) ||
                        (member.guild && member.id === member.guild.ownerId)        ||
                        (member.voice && member.voice.channelId !== null)           ||
                        member.roles.cache.size > 5,
                },
                UserManager: {
                    maxSize:       20000,
                    keepOverLimit: (user) => user.id === user.client.user.id,
                },
            }),

            sweepers: {
                ...Options.DefaultSweeperSettings,
                messages: { interval: 3600, lifetime: 1800 },
                threads:  { interval: 3600, lifetime: 1800 },
                users: {
                    interval: 3600,
                    filter:   () => (user) => {
                        if (user.bot)                        return false;
                        if (user.id === user.client.user.id) return false;
                        return true;
                    },
                },
            },
        });
    }

    /**
     * Start the bot — initialise client, kythia-core, addon system, and login.
     */
    async start() {
        log.section('Bot System');

        this.client = this._createClient();

        // Create Sequelize instance (kythia-core compatible)
        const sequelize = createSequelizeInstance(config);

        KythiaModel.setDependencies({
            config,
            redisOptions: config.db.redis,
        });

        // Dependency injection container (matches original index.js exactly)
        const dependencies = {
            client:    this.client,
            config,
            redis:     KythiaModel.redis,
            sequelize,
            models:    {},
            helpers: {
                discord: {
                    isTeam,
                    isPremium,
                    embedFooter,
                    getGuildSafe,
                    isVoterActive,
                    getMemberSafe,
                    getChannelSafe,
                    createContainer,
                    simpleContainer,
                    chunkTextDisplay,
                    getTextChannelSafe,
                    setVoiceChannelStatus,
                },
                color:     { convertColor },
                time:      { checkCooldown, formatDuration, parseDuration },
                helpUtils: { getHelpData, buildHelpReply },
            },
            appRoot: process.cwd(),
        };

        // Bootstrap Kythia
        this.kythia = new Kythia(dependencies);

        // Language resolver — reads per-guild language from ServerSetting
        this.kythia.container.translator.setLanguageResolver(async (guildId) => {
            const { ServerSetting } = this.kythia.container.models;
            if (!ServerSetting) return null;
            try {
                const setting = await ServerSetting.getCache({ guildId });
                return setting?.lang || null;
            } catch {
                return null;
            }
        });

        await this.kythia.start();

        log.success('Bot system online', { tag: this.client.user?.tag });
    }
}

module.exports = BotManager;
