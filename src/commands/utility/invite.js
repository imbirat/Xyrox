import { SlashCommandBuilder } from 'discord.js';

const ADD_BOT_URL = 'https://discord.com/oauth2/authorize?client_id=1496858363688915115&permissions=8&integration_type=0&scope=bot';
const SUPPORT_URL = 'https://discord.gg/huXUSUeu6t';
const WEBSITE_URL = 'https://xyrox.vercel.app/';

export default {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the bot invite link'),
    
    async execute(interaction) {
        const { client } = interaction;
        
        await interaction.reply({
            embeds: [{
                title: '📨 Invite Xyrox',
                description: 'Thanks for using Xyrox! Click the button below to invite the bot to your server.',
                fields: [
                    {
                        name: '✨ Features',
                        value: '• Advanced AutoMod System\n• Anti-Nuke Protection\n• Server Logging\n• Custom Commands\n• Reaction Roles\n• Ticket System\n• Welcome Messages'
                    },
                    {
                        name: '🔗 Links',
                        value: `[Website](${WEBSITE_URL}) • [Support Server](${SUPPORT_URL}) • [Invite Bot](${ADD_BOT_URL})`
                    }
                ],
                color: 0x5865F2,
                thumbnail: {
                    url: client.user.displayAvatarURL({ size: 256 })
                },
                footer: {
                    text: 'Xyrox Bot'
                }
            }],
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: 'Invite Xyrox',
                        url: ADD_BOT_URL,
                        emoji: '🤖'
                    },
                    {
                        type: 2,
                        style: 5,
                        label: 'Support Server',
                        url: SUPPORT_URL,
                        emoji: '💬'
                    },
                    {
                        type: 2,
                        style: 5,
                        label: 'Website',
                        url: WEBSITE_URL,
                        emoji: '🌐'
                    }
                ]
            }]
        });
    }
};
