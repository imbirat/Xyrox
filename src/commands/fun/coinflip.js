import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin'),
    
    async execute(interaction) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '🪙' : '💿';
        
        await interaction.reply({
            embeds: [{
                title: `${emoji} Coin Flip`,
                description: `The coin landed on **${result}**!`,
                color: result === 'Heads' ? 0xFFD700 : 0xC0C0C0,
                footer: {
                    text: `Flipped by ${interaction.user.tag}`
                }
            }]
        });
    }
};
