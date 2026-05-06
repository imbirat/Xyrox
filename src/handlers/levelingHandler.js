import UserLevel, { xpForLevel } from '../models/UserLevel.js';
import Guild from '../models/Guild.js';

const xpCooldowns = new Map();

export async function handleMessageXP(message, config) {
    if (!config.leveling?.enabled || !config.leveling?.textXP) return;
    if (config.leveling?.ignoredChannels?.includes(message.channelId)) return;
    if (message.member?.roles.cache.some(r => config.leveling?.ignoredRoles?.includes(r.id))) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const cooldownKey = `${userId}-${guildId}`;
    const cooldownMs = (config.leveling?.xpCooldown || 60) * 1000;

    const lastXP = xpCooldowns.get(cooldownKey);
    if (lastXP && Date.now() - lastXP < cooldownMs) return;
    xpCooldowns.set(cooldownKey, Date.now());

    const min = config.leveling?.xpPerMessageMin || 15;
    const max = config.leveling?.xpPerMessageMax || 25;
    const xpGain = Math.floor(Math.random() * (max - min + 1)) + min;

    await grantXP(message.author, guildId, xpGain, config, message.channel, message.guild, message.client);
}

export async function handleReactionXP(reaction, user, config) {
    if (!config.leveling?.enabled || !config.leveling?.reactionXP) return;
    const guildId = reaction.message.guild?.id;
    if (!guildId) return;
    const xpGain = config.leveling?.xpPerReaction || 5;
    const guild = reaction.message.guild;
    const channel = reaction.message.channel;
    await grantXP(user, guildId, xpGain, config, channel, guild, reaction.client);
}

async function grantXP(user, guildId, xpGain, config, channel, guild, client) {
    try {
        let doc = await UserLevel.findOne({ userId: user.id, guildId });
        if (!doc) doc = new UserLevel({ userId: user.id, guildId, xp: 0, level: 0, totalXP: 0 });

        const oldLevel = doc.level;
        doc.xp += xpGain;
        doc.totalXP += xpGain;

        // Level up check
        while (doc.xp >= xpForLevel(doc.level)) {
            doc.xp -= xpForLevel(doc.level);
            doc.level++;
        }

        await doc.save();

        if (doc.level > oldLevel) {
            await handleLevelUp(user, doc, config, channel, guild, client);
        }
    } catch (err) {
        console.error('XP grant error:', err);
    }
}

async function handleLevelUp(user, doc, config, channel, guild, client) {
    try {
        // Check role rewards
        const rewards = config.leveling?.roleRewards || [];
        for (const reward of rewards) {
            if (reward.level === doc.level) {
                const member = await guild.members.fetch(user.id).catch(() => null);
                if (member) await member.roles.add(reward.roleId).catch(() => {});
            }
        }

        // Send level up message
        const rawMsg = config.leveling?.levelUpMessage || '🎉 Congratulations {user}! You leveled up to level **{level}**!';
        const levelUpMsg = rawMsg
            .replace(/{user}/g, user.toString())
            .replace(/{user\.name}/g, user.username)
            .replace(/{level}/g, doc.level)
            .replace(/{xp}/g, doc.totalXP);

        const targetChannelId = config.leveling?.levelUpChannelId;
        const targetChannel = targetChannelId ? await client.channels.fetch(targetChannelId).catch(() => channel) : channel;

        if (targetChannel) {
            await targetChannel.send({ embeds: [{ description: levelUpMsg, color: 0xFBBF24 }] }).catch(() => {});
        }
    } catch (err) {
        console.error('Level up handler error:', err);
    }
}
