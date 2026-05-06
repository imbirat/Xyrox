import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)
        ),
    
    permissions: [PermissionFlagsBits.KickMembers],
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (user.id === interaction.user.id) {
            return interaction.reply({ content: '❌ You cannot kick yourself!', ephemeral: true });
        }
        if (user.id === interaction.client.user.id) {
            return interaction.reply({ content: '❌ I cannot kick myself!', ephemeral: true });
        }
        
        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({ content: '❌ You cannot kick this user (role hierarchy).', ephemeral: true });
            }
            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ content: '❌ I cannot kick this user (role hierarchy).', ephemeral: true });
            }
            
            try {
                await user.send({
                    embeds: [{
                        title: '👢 You have been kicked',
                        description: `You have been kicked from **${interaction.guild.name}**`,
                        fields: [
                            { name: 'Reason', value: reason },
                            { name: 'Moderator', value: interaction.user.username }
                        ],
                        color: 0xFF9900,
                        timestamp: new Date()
                    }]
                });
            } catch {
                // User has DMs disabled
            }
            
            await member.kick(`${reason} | Moderator: ${interaction.user.username}`);
            
            return interaction.reply({
                embeds: [{
                    title: '✅ User Kicked',
                    description: `**${user.username}** has been kicked from the server.`,
                    fields: [
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Moderator', value: interaction.user.username, inline: true }
                    ],
                    color: 0xFF9900,
                    timestamp: new Date()
                }]
            });
            
        } catch (error) {
            console.error('Kick command error:', error);
            return interaction.reply({ content: '❌ Failed to kick the user. Please check my permissions.', ephemeral: true });
        }
    }
};
