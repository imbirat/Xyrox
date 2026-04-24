import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user').setDescription('User to timeout').setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration').setDescription('Duration in minutes').setRequired(true)
                .setMinValue(1).setMaxValue(40320)
        )
        .addStringOption(option =>
            option.setName('reason').setDescription('Reason for the timeout').setRequired(false)
        ),
    
    permissions: [PermissionFlagsBits.ModerateMembers],
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (user.id === interaction.user.id) {
            return interaction.reply({ content: '❌ You cannot timeout yourself!', ephemeral: true });
        }
        if (user.id === interaction.client.user.id) {
            return interaction.reply({ content: '❌ I cannot timeout myself!', ephemeral: true });
        }
        
        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({ content: '❌ You cannot timeout this user (role hierarchy).', ephemeral: true });
            }
            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ content: '❌ I cannot timeout this user (role hierarchy).', ephemeral: true });
            }
            
            const durationMs = duration * 60 * 1000;
            await member.timeout(durationMs, `${reason} | Moderator: ${interaction.user.username}`);
            
            try {
                await user.send({
                    embeds: [{
                        title: '🔇 You have been timed out',
                        description: `You have been timed out in **${interaction.guild.name}**`,
                        fields: [
                            { name: 'Duration', value: `${duration} minutes`, inline: true },
                            { name: 'Reason', value: reason, inline: true },
                            { name: 'Moderator', value: interaction.user.username }
                        ],
                        color: 0xFFA500,
                        timestamp: new Date()
                    }]
                });
            } catch {
                // User has DMs disabled
            }
            
            return interaction.reply({
                embeds: [{
                    title: '✅ User Timed Out',
                    description: `**${user.username}** has been timed out for **${duration} minutes**.`,
                    fields: [
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Moderator', value: interaction.user.username, inline: true }
                    ],
                    color: 0xFFA500,
                    timestamp: new Date()
                }]
            });
            
        } catch (error) {
            console.error('Timeout command error:', error);
            return interaction.reply({ content: '❌ Failed to timeout the user. Please check my permissions.', ephemeral: true });
        }
    }
};
