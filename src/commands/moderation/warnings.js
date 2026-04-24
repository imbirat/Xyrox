import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Guild from '../../models/Guild.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand.setName('view').setDescription('View warnings for a user')
                .addUserOption(option =>
                    option.setName('user').setDescription('User to view warnings for').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('clear').setDescription('Clear warnings for a user')
                .addUserOption(option =>
                    option.setName('user').setDescription('User to clear warnings for').setRequired(true)
                )
        ),
    
    permissions: [PermissionFlagsBits.ModerateMembers],
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        
        try {
            const guildConfig = await Guild.findOne({ guildId });
            
            if (!guildConfig) {
                return interaction.reply({ content: '❌ No warnings found.', ephemeral: true });
            }
            
            const userWarnings = guildConfig.warnings.filter(w => w.userId === user.id);
            
            if (subcommand === 'view') {
                if (userWarnings.length === 0) {
                    return interaction.reply({ content: `✅ **${user.username}** has no warnings.`, ephemeral: true });
                }
                
                const warningFields = userWarnings.slice(0, 10).map((warning, index) => {
                    const moderator = interaction.guild.members.cache.get(warning.moderatorId);
                    return {
                        name: `Warning #${index + 1}`,
                        value: [
                            `**Reason:** ${warning.reason}`,
                            `**Moderator:** ${moderator ? moderator.user.username : 'Unknown'}`,
                            `**Date:** ${new Date(warning.timestamp).toLocaleDateString()}`
                        ].join('\n')
                    };
                });
                
                return interaction.reply({
                    embeds: [{
                        title: `⚠️ Warnings for ${user.username}`,
                        description: `Total warnings: **${userWarnings.length}**`,
                        fields: warningFields,
                        color: 0xFFFF00,
                        footer: { text: userWarnings.length > 10 ? 'Showing first 10 warnings' : '' }
                    }],
                    ephemeral: true
                });
            }
            
            if (subcommand === 'clear') {
                if (userWarnings.length === 0) {
                    return interaction.reply({ content: `✅ **${user.username}** has no warnings to clear.`, ephemeral: true });
                }
                
                await Guild.findOneAndUpdate(
                    { guildId },
                    { $pull: { warnings: { userId: user.id } } }
                );
                
                return interaction.reply({
                    embeds: [{
                        title: '✅ Warnings Cleared',
                        description: `Cleared **${userWarnings.length}** warning(s) for **${user.username}**`,
                        color: 0x00FF00,
                        timestamp: new Date()
                    }]
                });
            }
            
        } catch (error) {
            console.error('Warnings command error:', error);
            return interaction.reply({ content: '❌ Failed to retrieve warnings.', ephemeral: true });
        }
    }
};
