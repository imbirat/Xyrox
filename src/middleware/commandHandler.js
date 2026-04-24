import Guild from '../models/Guild.js';

// Cache for guild configs (in-memory cache for performance)
const guildCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

/**
 * Get guild configuration from cache or database
 */
export async function getGuildConfig(guildId) {
    // Check cache first
    const cached = guildCache.get(guildId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    // Fetch from database
    let guildConfig = await Guild.findOne({ guildId });
    
    // Create default config if not exists
    if (!guildConfig) {
        guildConfig = await Guild.create({
            guildId,
            commandMode: 'slash',
            prefix: '?'
        });
    }
    
    // Update cache
    guildCache.set(guildId, {
        data: guildConfig,
        timestamp: Date.now()
    });
    
    return guildConfig;
}

/**
 * Clear guild cache (used when config updates)
 */
export function clearGuildCache(guildId) {
    guildCache.delete(guildId);
}

/**
 * Validate if command can be executed based on command mode
 */
export async function validateCommandMode(interaction, isSlash = true) {
    const guildId = interaction.guild?.id;
    if (!guildId) return true; // Allow in DMs
    
    const guildConfig = await getGuildConfig(guildId);
    const mode = guildConfig.commandMode;
    
    // Check execution rules
    if (mode === 'slash' && !isSlash) return false;
    if (mode === 'prefix' && isSlash) return false;
    if (mode === 'both') return true;
    
    return true;
}

/**
 * Check if user has permission to execute command
 */
export function checkPermissions(member, requiredPermissions = []) {
    if (!member) return false;
    
    // Bot owner bypass
    if (member.id === member.guild.ownerId) return true;
    
    // Check required permissions
    if (requiredPermissions.length > 0) {
        return member.permissions.has(requiredPermissions);
    }
    
    return true;
}

/**
 * AutoMod message check middleware
 */
export async function autoModCheck(message, guildConfig) {
    if (!guildConfig.automod.enabled) return { passed: true };
    
    const { automod } = guildConfig;
    const violations = [];
    
    // Ignore bots
    if (message.author.bot) return { passed: true };
    
    // Check ignored roles
    if (message.member && automod.ignoredRoles.some(roleId => 
        message.member.roles.cache.has(roleId))) {
        return { passed: true };
    }
    
    // Check ignored channels
    if (automod.ignoredChannels.includes(message.channel.id)) {
        return { passed: true };
    }
    
    const content = message.content;
    
    // Anti-Caps Check
    if (automod.antiCaps && content.length > 10) {
        const capsCount = (content.match(/[A-Z]/g) || []).length;
        const capsPercentage = (capsCount / content.length) * 100;
        
        if (capsPercentage > automod.capsPercentage) {
            violations.push({
                type: 'caps',
                reason: `Message contains ${capsPercentage.toFixed(0)}% caps`
            });
        }
    }
    
    // Anti-Links Check
    if (automod.antiLinks) {
        const linkRegex = /(https?:\/\/[^\s]+)/gi;
        const links = content.match(linkRegex);
        
        if (links && links.length > 0) {
            const hasWhitelistedLink = links.some(link => 
                automod.whitelistedLinks.some(wl => link.includes(wl))
            );
            
            if (!hasWhitelistedLink) {
                violations.push({
                    type: 'links',
                    reason: 'Unauthorized links detected'
                });
            }
        }
    }
    
    // Anti-Invites Check
    if (automod.antiInvites) {
        const inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
        const invites = content.match(inviteRegex);
        
        if (invites && invites.length > 0) {
            const hasWhitelistedInvite = invites.some(invite => 
                automod.whitelistedInvites.some(wl => invite.includes(wl))
            );
            
            if (!hasWhitelistedInvite) {
                violations.push({
                    type: 'invites',
                    reason: 'Discord invites are not allowed'
                });
            }
        }
    }
    
    // Anti-Mention Spam Check
    if (automod.antiMentionSpam) {
        const mentions = message.mentions.users.size + message.mentions.roles.size;
        
        if (mentions > automod.maxMentions) {
            violations.push({
                type: 'mention_spam',
                reason: `Too many mentions (${mentions})`
            });
        }
    }
    
    // Anti-Bad Words Check
    if (automod.antiBadWords && automod.badWords.length > 0) {
        const lowerContent = content.toLowerCase();
        const foundBadWords = automod.badWords.filter(word => 
            lowerContent.includes(word.toLowerCase())
        );
        
        if (foundBadWords.length > 0) {
            violations.push({
                type: 'bad_words',
                reason: `Inappropriate language detected`
            });
        }
    }
    
    return {
        passed: violations.length === 0,
        violations
    };
}

/**
 * Anti-Spam tracker (in-memory)
 */
const spamTracker = new Map();

export function checkSpam(message, guildConfig) {
    if (!guildConfig.automod.enabled || !guildConfig.automod.antiSpam) {
        return { isSpam: false };
    }
    
    const key = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    
    if (!spamTracker.has(key)) {
        spamTracker.set(key, []);
    }
    
    const userMessages = spamTracker.get(key);
    
    // Remove old messages outside timeframe
    const timeframe = guildConfig.automod.spamTimeframe;
    const recentMessages = userMessages.filter(timestamp => 
        now - timestamp < timeframe
    );
    
    // Add current message
    recentMessages.push(now);
    spamTracker.set(key, recentMessages);
    
    // Check if threshold exceeded
    const threshold = guildConfig.automod.spamThreshold;
    if (recentMessages.length >= threshold) {
        return {
            isSpam: true,
            count: recentMessages.length
        };
    }
    
    return { isSpam: false };
}

/**
 * Handle AutoMod violations
 */
export async function handleViolation(message, violations, guildConfig) {
    try {
        // Delete message
        await message.delete().catch(() => {});
        
        // Get user warnings
        const userWarnings = guildConfig.warnings.filter(w => 
            w.userId === message.author.id
        );
        
        const warningCount = userWarnings.length + 1;
        
        // Add warning to database
        await Guild.findOneAndUpdate(
            { guildId: message.guild.id },
            {
                $push: {
                    warnings: {
                        userId: message.author.id,
                        moderatorId: message.client.user.id,
                        reason: violations.map(v => v.reason).join(', '),
                        timestamp: new Date()
                    }
                }
            }
        );
        
        // Send warning message
        const warningMsg = await message.channel.send({
            content: `⚠️ ${message.author}, your message was removed for: ${violations[0].reason}. Warning ${warningCount}/${guildConfig.automod.maxWarnings}`
        });
        
        // Delete warning message after 5 seconds
        setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
        
        // Apply punishment if max warnings reached
        if (warningCount >= guildConfig.automod.maxWarnings) {
            const punishment = guildConfig.automod.punishment;
            const member = message.member;
            
            if (!member) return;
            
            switch (punishment) {
                case 'mute':
                    await member.timeout(
                        guildConfig.automod.muteDuration,
                        `AutoMod: ${warningCount} warnings`
                    ).catch(() => {});
                    
                    message.channel.send({
                        content: `🔇 ${message.author} has been muted for reaching ${warningCount} warnings.`
                    });
                    break;
                    
                case 'kick':
                    await member.kick(`AutoMod: ${warningCount} warnings`).catch(() => {});
                    
                    message.channel.send({
                        content: `👢 ${message.author.tag} has been kicked for reaching ${warningCount} warnings.`
                    });
                    break;
                    
                case 'ban':
                    await member.ban({ 
                        reason: `AutoMod: ${warningCount} warnings`,
                        deleteMessageDays: 1
                    }).catch(() => {});
                    
                    message.channel.send({
                        content: `🔨 ${message.author.tag} has been banned for reaching ${warningCount} warnings.`
                    });
                    break;
            }
            
            // Clear warnings after punishment
            await Guild.findOneAndUpdate(
                { guildId: message.guild.id },
                {
                    $pull: {
                        warnings: { userId: message.author.id }
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error handling AutoMod violation:', error);
    }
}

export default {
    getGuildConfig,
    clearGuildCache,
    validateCommandMode,
    checkPermissions,
    autoModCheck,
    checkSpam,
    handleViolation
};
