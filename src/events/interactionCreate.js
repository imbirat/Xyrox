import { validateCommandMode, checkPermissions } from '../middleware/commandHandler.js';

export default {
    name: 'interactionCreate',
    async execute(interaction, client) {
        
        // Guard: ignore autocomplete (no reply needed, prevents crashes)
        if (interaction.isAutocomplete()) return;
        
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            
            if (!command) return;
            
            try {
                // Validate command mode
                const canExecute = await validateCommandMode(interaction, true);
                if (!canExecute) {
                    return interaction.reply({
                        content: '❌ Slash commands are disabled in this server. Use prefix commands instead.',
                        ephemeral: true
                    });
                }
                
                // Check permissions
                if (command.permissions) {
                    const hasPermission = checkPermissions(interaction.member, command.permissions);
                    if (!hasPermission) {
                        return interaction.reply({
                            content: '❌ You do not have permission to use this command.',
                            ephemeral: true
                        });
                    }
                }
                
                // Check cooldowns
                const { cooldowns } = client;
                if (!cooldowns.has(command.data.name)) {
                    cooldowns.set(command.data.name, new Map());
                }
                
                const now = Date.now();
                const timestamps = cooldowns.get(command.data.name);
                const cooldownAmount = (command.cooldown || 3) * 1000;
                
                if (timestamps.has(interaction.user.id)) {
                    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                    
                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000;
                        return interaction.reply({
                            content: `⏰ Please wait ${timeLeft.toFixed(1)} more seconds before using \`${command.data.name}\` again.`,
                            ephemeral: true
                        });
                    }
                }
                
                timestamps.set(interaction.user.id, now);
                setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
                
                // Execute command
                await command.execute(interaction, client);
                
            } catch (error) {
                console.error('Command execution error:', error);
                
                const errorMessage = {
                    content: '❌ There was an error executing this command.',
                    ephemeral: true
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage).catch(() => {});
                } else {
                    await interaction.reply(errorMessage).catch(() => {});
                }
            }
        }
        
        // Handle Button Interactions
        if (interaction.isButton()) {
            const buttonId = interaction.customId;
            
            if (buttonId.startsWith('ticket_')) {
                const ticketHandler = await import('../handlers/ticketHandler.js');
                await ticketHandler.default.handleButton(interaction, client);
            }
            
            if (buttonId.startsWith('rr_')) {
                const reactionRoleHandler = await import('../handlers/reactionRoleHandler.js');
                await reactionRoleHandler.default.handleButton(interaction, client);
            }
        }
        
        // Handle Select Menu Interactions
        if (interaction.isStringSelectMenu()) {
            const selectId = interaction.customId;
            
            if (selectId.startsWith('rr_select_')) {
                const reactionRoleHandler = await import('../handlers/reactionRoleHandler.js');
                await reactionRoleHandler.default.handleSelectMenu(interaction, client);
            }
        }
        
        // Handle Modal Submissions
        if (interaction.isModalSubmit()) {
            const modalId = interaction.customId;
            
            if (modalId.startsWith('ticket_')) {
                const ticketHandler = await import('../handlers/ticketHandler.js');
                if (typeof ticketHandler.default.handleModal === 'function') {
                    await ticketHandler.default.handleModal(interaction, client);
                }
            }
        }
    }
};
