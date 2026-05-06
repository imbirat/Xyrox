import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll a dice')
        .addIntegerOption(option =>
            option
                .setName('sides')
                .setDescription('Number of sides on the dice (default: 6)')
                .setRequired(false)
                .setMinValue(2)
                .setMaxValue(100)
        ),
    
    async execute(interaction) {
        const sides = interaction.options.getInteger('sides') || 6;
        const result = Math.floor(Math.random() * sides) + 1;
        
        const diceEmoji = {
            1: '⚀',
            2: '⚁',
            3: '⚂',
            4: '⚃',
            5: '⚄',
            6: '⚅'
        };
        
        const emoji = sides <= 6 ? diceEmoji[result] : '🎲';
        
        await interaction.reply({
            embeds: [{
                title: `${emoji} Dice Roll`,
                description: `You rolled a **${result}** on a ${sides}-sided dice!`,
                color: 0xFF6B6B,
                footer: {
                    text: `Rolled by ${interaction.user.tag}`
                }
            }]
        });
    }
};
