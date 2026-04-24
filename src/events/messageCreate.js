import { 
    getGuildConfig, 
    validateCommandMode, 
    autoModCheck, 
    checkSpam, 
    handleViolation 
} from '../middleware/commandHandler.js';

export default {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Ignore DMs
        if (!message.guild) return;
        
        // Get guild configuration
        const guildConfig = await getGuildConfig(message.guild.id);
        
        // === AUTOMOD CHECKS ===
        if (guildConfig.automod.enabled) {
            // Check spam
            const spamCheck = checkSpam(message, guildConfig);
            if (spamCheck.isSpam) {
                await handleViolation(message, [{
                    type: 'spam',
                    reason: `Spam detected (${spamCheck.count} messages)`
                }], guildConfig);
                return;
            }
            
            // Check other automod rules
            const automodResult = await autoModCheck(message, guildConfig);
            if (!automodResult.passed) {
                await handleViolation(message, automodResult.violations, guildConfig);
                return;
            }
        }
        
        // === PREFIX COMMAND HANDLING ===
        const prefix = guildConfig.prefix || '?';
        
        // Check for custom commands (must start with prefix)
        if (message.content.toLowerCase() === `${prefix}` || !message.content.startsWith(prefix)) {
            // Check for custom commands without requiring prefix parsing
            const lowerContent = message.content.toLowerCase();
            const customCmd = guildConfig.customCommands?.find(cmd => 
                lowerContent === `${prefix}${cmd.name.toLowerCase()}`
            );
            if (customCmd) {
                await handleCustomCommand(message, customCmd);
            }
            return;
        }
        
        // Validate prefix command mode
        const canExecute = await validateCommandMode(message, false);
        if (!canExecute) return;
        
        // Parse command
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        if (!commandName) return;
        
        // Get command
        const command = client.prefixCommands.get(commandName) || 
                       client.prefixCommands.find(cmd => 
                           cmd.aliases && cmd.aliases.includes(commandName)
                       );
        
        if (!command) return;
        
        try {
            // Check permissions
            if (command.permissions) {
                const hasPermission = message.member.permissions.has(command.permissions);
                if (!hasPermission) {
                    return message.reply('❌ You do not have permission to use this command.');
                }
            }
            
            // Execute command
            await command.execute(message, args, client);
            
        } catch (error) {
            console.error('Prefix command execution error:', error);
            await message.reply('❌ There was an error executing this command.').catch(() => {});
        }
    }
};

/**
 * Handle custom commands
 */
async function handleCustomCommand(message, customCmd) {
    try {
        if (customCmd.deleteCommand) {
            await message.delete().catch(() => {});
        }
        
        let response = customCmd.response
            .replace(/{user}/g, message.author.toString())
            .replace(/{user\.mention}/g, message.author.toString())
            .replace(/{user\.name}/g, message.author.username)
            .replace(/{user\.tag}/g, message.author.username)
            .replace(/{server}/g, message.guild.name)
            .replace(/{server\.name}/g, message.guild.name)
            .replace(/{server\.members}/g, message.guild.memberCount)
            .replace(/{channel}/g, message.channel.toString())
            .replace(/{channel\.name}/g, message.channel.name);
        
        if (customCmd.embed?.enabled) {
            const embed = {
                title: customCmd.embed.title || null,
                description: customCmd.embed.description || response,
                color: parseInt(customCmd.embed.color?.replace('#', '') || '5865F2', 16),
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
