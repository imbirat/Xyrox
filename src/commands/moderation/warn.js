import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Guild from '../../models/Guild.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user').setDescription('User to warn').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason').setDescription('Reason for the warning').setRequired(true)
        ),
    
    permissions: [PermissionFlagsBits.ModerateMembers],
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const guildId = interaction.guild.id;
        
        if (user.id === interaction.user.id) {
            return interaction.reply({ content: '❌ You cannot warn yourself!', ephemeral: true });
        }
        if (user.bot) {
            return interaction.reply({ content: '❌ You cannot warn bots!', ephemeral: true });
        }
        
        try {
            const guildConfig = await Guild.findOneAndUpdate(
                { guildId },
                {
                    $push: {
                        warnings: {
                            userId: user.id,
                            moderatorId: interaction.user.id,
                            reason,
                            timestamp: new Date()
                        }
                    }
                },
                { upsert: true, new: true }
            );
            
            const userWarnings = guildConfig.warnings.filter(w => w.userId === user.id);
            const warningCount = userWarnings.length;
            
            try {
                await user.send({
                    embeds: [{
                        title: '⚠️ You have been warned',
                        description: `You have received a warning in **${interaction.guild.name}**`,
                        fields: [
                            { name: 'Reason', value: reason },
                            { name: 'Moderator', value: interaction.user.username },
                            { name: 'Total Warnings', value: warningCount.toString() }
                        ],
                        color: 0xFFFF00,
                        timestamp: new Date()
                    }]
                });
            } catch {
                // User has DMs disabled
            }
            
            return interaction.reply({
                embeds: [{
                    title: '✅ User Warned',
                    description: `**${user.username}** has been warned.`,
                    fields: [
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Total Warnings', value: warningCount.toString(), inline: true },
                        { name: 'Moderator', value: interaction.user.username }
                    ],
                    color: 0xFFFF00,
                    timestamp: new Date()
                }]
            });
            
        } catch (error) {
            console.error('Warn command error:', error);
            return interaction.reply({ content: '❌ Failed to warn the user.', ephemeral: true });
        }
    }
};
