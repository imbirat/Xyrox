import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription("Get a user's avatar")
        .addUserOption(option =>
            option.setName('user').setDescription('User to get avatar from').setRequired(false)
        ),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        
        const isAnimated = user.avatar?.startsWith('a_');

        // Static PNG URL — always downloadable by browsers
        const pngURL = user.displayAvatarURL({ extension: 'png', forceStatic: true, size: 4096 });
        // GIF URL only if avatar is actually animated
        const gifURL = isAnimated
            ? user.displayAvatarURL({ extension: 'gif', forceStatic: false, size: 4096 })
            : null;

        // Display URL: prefer GIF for animated avatars, otherwise PNG
        const displayURL = gifURL ?? pngURL;

        const components = [{
            type: 1,
            components: [
                {
                    type: 2,
                    style: 5,
                    label: 'Download PNG',
                    url: pngURL
                },
                ...(gifURL ? [{
                    type: 2,
                    style: 5,
                    label: 'Download GIF',
                    url: gifURL
                }] : [])
            ]
        }];

        await interaction.reply({
            embeds: [{
                title: `${user.username}'s Avatar`,
                image: { url: displayURL },
                color: 0x5865F2,
                footer: { text: `Requested by ${interaction.user.username}` }
            }],
            components
        });
    }
};
