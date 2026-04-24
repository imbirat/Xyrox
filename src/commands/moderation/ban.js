import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName('delete_days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(7)
        ),
    
    permissions: [PermissionFlagsBits.BanMembers],
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        
        if (user.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot ban yourself!',
                ephemeral: true
            });
        }
        
        if (user.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ I cannot ban myself!',
                ephemeral: true
            });
        }
        
        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            if (member) {
                if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                    return interaction.reply({
                        content: '❌ You cannot ban this user (role hierarchy).',
                        ephemeral: true
                    });
                }
                
                if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                    return interaction.reply({
                        content: '❌ I cannot ban this user (role hierarchy).',
                        ephemeral: true
                    });
                }
            }
            
            // Send DM before banning
            try {
                await user.send({
                    embeds: [{
                        title: '🔨 You have been banned',
                        description: `You have been banned from **${interaction.guild.name}**`,
                        fields: [
                            { name: 'Reason', value: reason },
                            { name: 'Moderator', value: interaction.user.username }
                        ],
                        color: 0xFF0000,
                        timestamp: new Date()
                    }]
                });
            } catch {
                // User has DMs disabled
            }
            
            await interaction.guild.members.ban(user, {
                reason: `${reason} | Moderator: ${interaction.user.username}`,
                deleteMessageSeconds: deleteDays * 86400
            });
            
            return interaction.reply({
                embeds: [{
                    title: '✅ User Banned',
                    description: `**${user.username}** has been banned from the server.`,
                    fields: [
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Moderator', value: interaction.user.username, inline: true }
                    ],
                    color: 0xFF0000,
                    timestamp: new Date()
                }]
            });
            
        } catch (error) {
            console.error('Ban command error:', error);
            return interaction.reply({
                content: '❌ Failed to ban the user. Please check my permissions.',
                ephemeral: true
            });
        }
    }
};
