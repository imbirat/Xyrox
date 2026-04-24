import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to unlock (default: current channel)')
                .setRequired(false)
        ),
    
    permissions: [PermissionFlagsBits.ManageChannels],
    
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        
        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null
            }, { reason: `Unlocked by ${interaction.user.tag}` });
            
            await interaction.reply({
                embeds: [{
                    title: '🔓 Channel Unlocked',
                    description: `${channel} has been unlocked.`,
                    color: 0x00FF00,
                    timestamp: new Date()
                }]
            });
            
        } catch (error) {
            console.error('Unlock command error:', error);
            return interaction.reply({
                content: '❌ Failed to unlock the channel. Please check my permissions.',
                ephemeral: true
            });
        }
    }
};
