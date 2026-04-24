import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,   // This already creates an index — no need for guildSchema.index() below
        index: true
    },
    guildName: String,
    
    commandMode: {
        type: String,
        enum: ['slash', 'prefix', 'both'],
        default: 'slash'
    },
    prefix: { type: String, default: '?' },
    
    automod: {
        enabled: { type: Boolean, default: false },
        antiSpam: { type: Boolean, default: true },
        antiCaps: { type: Boolean, default: true },
        antiLinks: { type: Boolean, default: true },
        antiInvites: { type: Boolean, default: true },
        antiMentionSpam: { type: Boolean, default: true },
        antiBadWords: { type: Boolean, default: true },
        spamThreshold: { type: Number, default: 5 },
        spamTimeframe: { type: Number, default: 5000 },
        capsPercentage: { type: Number, default: 70 },
        maxMentions: { type: Number, default: 5 },
        badWords: { type: [String], default: [] },
        whitelistedLinks: { type: [String], default: [] },
        whitelistedInvites: { type: [String], default: [] },
        maxWarnings: { type: Number, default: 3 },
        punishment: { type: String, enum: ['mute', 'kick', 'ban'], default: 'mute' },
        muteDuration: { type: Number, default: 600000 },
        ignoredRoles: { type: [String], default: [] },
        ignoredChannels: { type: [String], default: [] }
    },
    
    antinuke: {
        enabled: { type: Boolean, default: false },
        whitelistedUsers: { type: [String], default: [] },
        maxBans: { type: Number, default: 5 },
        maxKicks: { type: Number, default: 5 },
        maxChannelDeletes: { type: Number, default: 3 },
        maxRoleDeletes: { type: Number, default: 3 },
        timeframe: { type: Number, default: 60000 },
        punishment: { type: String, enum: ['kick', 'ban', 'remove_permissions'], default: 'remove_permissions' }
    },
    
    logs: {
        enabled: { type: Boolean, default: false },
        channelId: String,
        messageDelete: { type: Boolean, default: true },
        messageEdit: { type: Boolean, default: true },
        memberJoin: { type: Boolean, default: true },
        memberLeave: { type: Boolean, default: true },
        memberBan: { type: Boolean, default: true },
        memberKick: { type: Boolean, default: true },
        roleUpdate: { type: Boolean, default: true },
        channelUpdate: { type: Boolean, default: true },
        memberUpdate: { type: Boolean, default: true }
    },
    
    welcome: {
        enabled: { type: Boolean, default: false },
        channelId: String,
        message: { type: String, default: 'Welcome {user} to {server}!' },
        embed: {
            enabled: { type: Boolean, default: false },
            title: String,
            description: String,
            color: { type: String, default: '#5865F2' },
            thumbnail: { type: Boolean, default: true },
            footer: String
        },
        dmMessage: {
            enabled: { type: Boolean, default: false },
            content: String
        }
    },
    
    leave: {
        enabled: { type: Boolean, default: false },
        channelId: String,
        message: { type: String, default: '{user} has left the server.' }
    },
    
    reactionRoles: [{
        messageId: String,
        channelId: String,
        roles: [{ emoji: String, roleId: String }],
        type: { type: String, enum: ['reaction', 'button', 'select'], default: 'reaction' }
    }],
    
    customCommands: [{
        name: { type: String, required: true },
        response: { type: String, required: true },
        embed: {
            enabled: { type: Boolean, default: false },
            title: String,
            description: String,
            color: String,
            footer: String
        },
        deleteCommand: { type: Boolean, default: false },
        createdBy: String,
        createdAt: { type: Date, default: Date.now }
    }],
    
    tickets: {
        enabled: { type: Boolean, default: false },
        categoryId: String,
        supportRoleId: String,
        transcriptChannelId: String,
        panels: [{
            messageId: String,
            channelId: String,
            title: String,
            description: String,
            button: {
                label: { type: String, default: 'Create Ticket' },
                emoji: String,
                style: { type: String, default: 'Primary' }
            }
        }]
    },
    
    warnings: [{
        userId: String,
        moderatorId: String,
        reason: String,
        timestamp: { type: Date, default: Date.now }
    }],
    
    settings: {
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'UTC' }
    }
}, { timestamps: true });

// No extra index needed — unique:true on guildId already handles it

const Guild = mongoose.model('Guild', guildSchema);
export default Guild;
