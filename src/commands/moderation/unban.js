import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('user_id').setDescription('User ID to unban').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason').setDescription('Reason for unbanning').setRequired(false)
        ),
    
    permissions: [PermissionFlagsBits.BanMembers],
    
    async execute(interaction) {
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Validate user ID is numeric
        if (!/^\d+$/.test(userId)) {
            return interaction.reply({ content: '❌ Please provide a valid user ID (numbers only).', ephemeral: true });
        }
        
        try {
            const bans = await interaction.guild.bans.fetch();
            const bannedUser = bans.get(userId);
            
            if (!bannedUser) {
                return interaction.reply({ content: '❌ This user is not banned.', ephemeral: true });
            }
            
            await interaction.guild.members.unban(userId, `${reason} | Moderator: ${interaction.user.username}`);
            
            return interaction.reply({
                embeds: [{
                    title: '✅ User Unbanned',
                    description: `**${bannedUser.user.username}** has been unbanned.`,
                    fields: [
                        { name: 'User ID', value: userId, inline: true },
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Moderator', value: interaction.user.username }
                    ],
                    color: 0x00FF00,
                    timestamp: new Date()
                }]
            });
            
        } catch (error) {
            console.error('Unban command error:', error);
            return interaction.reply({ content: '❌ Failed to unban the user. Please check the user ID and my permissions.', ephemeral: true });
        }
    }
};
