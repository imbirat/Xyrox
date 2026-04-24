import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency'),
    
    async execute(interaction) {
        const sent = await interaction.reply({ 
            content: '🏓 Pinging...', 
            fetchReply: true 
        });
        
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        await interaction.editReply({
            embeds: [{
                title: '🏓 Pong!',
                fields: [
                    {
                        name: 'Roundtrip Latency',
                        value: `${roundtrip}ms`,
                        inline: true
                    },
                    {
                        name: 'WebSocket Latency',
                        value: `${apiLatency}ms`,
                        inline: true
                    }
                ],
                color: roundtrip < 200 ? 0x00FF00 : roundtrip < 500 ? 0xFFFF00 : 0xFF0000,
                timestamp: new Date()
            }]
        });
    }
};
