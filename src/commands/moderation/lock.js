import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to lock (default: current channel)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for locking')
                .setRequired(false)
        ),
    
    permissions: [PermissionFlagsBits.ManageChannels],
    
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            }, { reason: `Locked by ${interaction.user.tag}: ${reason}` });
            
            await interaction.reply({
                embeds: [{
                    title: '🔒 Channel Locked',
                    description: `${channel} has been locked.`,
                    fields: [{
                        name: 'Reason',
                        value: reason
                    }],
                    color: 0xFF0000,
                    timestamp: new Date()
                }]
            });
            
        } catch (error) {
            console.error('Lock command error:', error);
            return interaction.reply({
                content: '❌ Failed to lock the channel. Please check my permissions.',
                ephemeral: true
            });
        }
    }
};
