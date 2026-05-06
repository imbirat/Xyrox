import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addIntegerOption(option =>
            option
                .setName('seconds')
                .setDescription('Slowmode duration in seconds (0 to disable)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600) // 6 hours max
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to set slowmode (default: current channel)')
                .setRequired(false)
        ),
    
    permissions: [PermissionFlagsBits.ManageChannels],
    
    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        
        try {
            await channel.setRateLimitPerUser(seconds, `Slowmode set by ${interaction.user.tag}`);
            
            if (seconds === 0) {
                return interaction.reply({
                    embeds: [{
                        title: '⏱️ Slowmode Disabled',
                        description: `Slowmode has been disabled in ${channel}.`,
                        color: 0x00FF00,
                        timestamp: new Date()
                    }]
                });
            }
            
            const formatTime = (sec) => {
                const hours = Math.floor(sec / 3600);
                const minutes = Math.floor((sec % 3600) / 60);
                const secs = sec % 60;
                
                const parts = [];
                if (hours > 0) parts.push(`${hours}h`);
                if (minutes > 0) parts.push(`${minutes}m`);
                if (secs > 0) parts.push(`${secs}s`);
                
                return parts.join(' ');
            };
            
            await interaction.reply({
                embeds: [{
                    title: '⏱️ Slowmode Enabled',
                    description: `Slowmode has been set to **${formatTime(seconds)}** in ${channel}.`,
                    color: 0xFFA500,
                    timestamp: new Date()
                }]
            });
            
        } catch (error) {
            console.error('Slowmode command error:', error);
            return interaction.reply({
                content: '❌ Failed to set slowmode. Please check my permissions.',
                ephemeral: true
            });
        }
    }
};
