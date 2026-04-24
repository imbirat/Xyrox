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
        
        // Use extension: 'gif' for animated avatars (discord.js v14)
        const avatarURL = user.displayAvatarURL({ extension: 'gif', forceStatic: false, size: 4096 });
        
        await interaction.reply({
            embeds: [{
                title: `${user.username}'s Avatar`,
                image: { url: avatarURL },
                color: 0x5865F2,
                footer: { text: `Requested by ${interaction.user.username}` }
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: 5,
                    label: 'Open in Browser',
                    url: avatarURL
                }]
            }]
        });
    }
};
