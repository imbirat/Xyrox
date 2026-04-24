import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8ball a question')
        .addStringOption(option =>
            option
                .setName('question')
                .setDescription('Your question')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const question = interaction.options.getString('question');
        
        const responses = [
            // Positive
            '✅ It is certain.',
            '✅ It is decidedly so.',
            '✅ Without a doubt.',
            '✅ Yes definitely.',
            '✅ You may rely on it.',
            '✅ As I see it, yes.',
            '✅ Most likely.',
            '✅ Outlook good.',
            '✅ Yes.',
            '✅ Signs point to yes.',
            
            // Non-committal
            '🤔 Reply hazy, try again.',
            '🤔 Ask again later.',
            '🤔 Better not tell you now.',
            '🤔 Cannot predict now.',
            '🤔 Concentrate and ask again.',
            
            // Negative
            '❌ Don\'t count on it.',
            '❌ My reply is no.',
            '❌ My sources say no.',
            '❌ Outlook not so good.',
            '❌ Very doubtful.'
        ];
        
        const answer = responses[Math.floor(Math.random() * responses.length)];
        
        await interaction.reply({
            embeds: [{
                title: '🎱 Magic 8-Ball',
                fields: [
                    {
                        name: 'Question',
                        value: question
                    },
                    {
                        name: 'Answer',
                        value: answer
                    }
                ],
                color: 0x000000,
                footer: {
                    text: `Asked by ${interaction.user.tag}`
                },
                timestamp: new Date()
            }]
        });
    }
};
