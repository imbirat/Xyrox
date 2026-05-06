import { getGuildConfig, validateCommandMode, autoModCheck, checkSpam, handleViolation } from '../middleware/commandHandler.js';
import { handleMessageXP } from '../handlers/levelingHandler.js';
import Guild from '../models/Guild.js';
import { clearGuildCache } from '../middleware/commandHandler.js';

const ALL_PREFIXES = ['!', '/', '?'];

/**
 * Detect which prefix (if any) this message starts with.
 * Returns { usedPrefix: string } or null if no match.
 */
function detectPrefix(content, configPrefix) {
    if (configPrefix === 'all') {
        // Accept !, / or ? — return whichever one the message starts with
        for (const p of ALL_PREFIXES) {
            if (content.startsWith(p)) return p;
        }
        return null; // no recognised prefix at all — ignore
    }
    return content.startsWith(configPrefix) ? configPrefix : null;
}

export default {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const guildConfig = await getGuildConfig(message.guild.id);

        // === AFK: notify when someone pings an AFK user ===
        if (message.mentions.users.size > 0 && guildConfig.afkUsers?.length > 0) {
            for (const [, user] of message.mentions.users) {
                const afkEntry = guildConfig.afkUsers?.find(a => a.userId === user.id);
                if (afkEntry) {
                    const ago = Math.floor((Date.now() - new Date(afkEntry.timestamp).getTime()) / 60000);
                    await message.reply({
                        embeds: [{ description: `💤 **${user.username}** is AFK: ${afkEntry.reason} (${ago}m ago)`, color: 0x5865F2 }]
                    }).catch(() => {});
                }
            }
        }

        // === AFK: remove AFK when user sends a message ===
        const afkEntry = guildConfig.afkUsers?.find(a => a.userId === message.author.id);
        if (afkEntry) {
            await Guild.findOneAndUpdate(
                { guildId: message.guild.id },
                { $pull: { afkUsers: { userId: message.author.id } } }
            );
            clearGuildCache(message.guild.id);
            await message.reply({
                embeds: [{ description: `✅ Welcome back **${message.author.username}**! Your AFK has been removed.`, color: 0x00FF00 }]
            }).catch(() => {});
        }

        // === AUTOMOD ===
        if (guildConfig.automod.enabled) {
            const spamCheck = checkSpam(message, guildConfig);
            if (spamCheck.isSpam) {
                await handleViolation(message, [{ type: 'spam', reason: `Spam detected (${spamCheck.count} messages)` }], guildConfig);
                return;
            }
            const automodResult = await autoModCheck(message, guildConfig);
            if (!automodResult.passed) {
                await handleViolation(message, automodResult.violations, guildConfig);
                return;
            }
        }

        // === LEVELING XP ===
        await handleMessageXP(message, guildConfig);

        // === PREFIX COMMAND HANDLING ===
        const configPrefix = guildConfig.prefix || '/';
        const content = message.content;

        const usedPrefix = detectPrefix(content, configPrefix);
        if (!usedPrefix) return; // message doesn't start with any accepted prefix

        // Validate command mode (prefix must be allowed)
        const canExecute = await validateCommandMode(message, false);
        if (!canExecute) return;

        // Strip the prefix to get the raw command string
        const cmdContent = content.slice(usedPrefix.length).trim();
        if (!cmdContent) return;

        // Check custom commands first
        const customCmd = guildConfig.customCommands?.find(cmd =>
            cmdContent.toLowerCase() === cmd.name.toLowerCase() ||
            cmdContent.toLowerCase().startsWith(cmd.name.toLowerCase() + ' ')
        );
        if (customCmd) {
            await handleCustomCommand(message, customCmd);
            return;
        }

        // Parse built-in commands
        const args = cmdContent.split(/ +/);
        const commandName = args.shift().toLowerCase();
        if (!commandName) return;

        const command = client.prefixCommands.get(commandName) ||
            client.prefixCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        try {
            if (command.permissions && !message.member.permissions.has(command.permissions)) {
                return message.reply('❌ You do not have permission to use this command.');
            }
            await command.execute(message, args, client);
        } catch (error) {
            console.error('Prefix command execution error:', error);
            await message.reply('❌ There was an error executing this command.').catch(() => {});
        }
    }
};

async function handleCustomCommand(message, customCmd) {
    try {
        if (customCmd.deleteCommand) await message.delete().catch(() => {});

        let response = (customCmd.response || '')
            .replace(/{user}/g, message.author.toString())
            .replace(/{user\.name}/g, message.author.username)
            .replace(/{server}/g, message.guild.name)
            .replace(/{server\.members}/g, message.guild.memberCount)
            .replace(/{channel}/g, message.channel.toString())
            .replace(/{channel\.name}/g, message.channel.name);

        if (customCmd.embed?.enabled) {
            const embed = {
                title: customCmd.embed.title || null,
                description: customCmd.embed.description || response,
                color: parseInt((customCmd.embed.color || '#5865F2').replace('#', ''), 16),
                footer: customCmd.embed.footer ? { text: customCmd.embed.footer } : null
            };
            await message.channel.send({ embeds: [embed] });
        } else {
            await message.channel.send(response);
        }
    } catch (error) {
        console.error('Custom command error:', error);
    }
}
