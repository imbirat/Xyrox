import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig } from '../../middleware/commandHandler.js';
import Guild from '../../models/Guild.js';

export default {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set your AFK status')
        .addStringOption(o => o.setName('reason').setDescription('Reason for being AFK').setRequired(false)),
    name: 'afk',
    aliases: ['away'],
    cooldown: 5,

    async execute(interaction, client) {
        const reason = interaction.options?.getString('reason') || 'AFK';
        const userId = interaction.user?.id || interaction.author?.id;
        const guildId = interaction.guild?.id;
        const username = interaction.user?.username || interaction.author?.username;

        await Guild.findOneAndUpdate(
            { guildId },
            { $pull: { afkUsers: { userId } } },
            { upsert: true }
        );
        await Guild.findOneAndUpdate(
            { guildId },
            { $push: { afkUsers: { userId, reason, timestamp: new Date() } } }
        );

        const embed = {
            title: '💤 AFK Set',
            description: `I've set your AFK status: **${reason}**`,
            color: 0x5865F2,
            footer: { text: 'You will be unmarked as AFK when you send a message.' }
        };

        if (interaction.reply) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.channel.send({ embeds: [embed] });
        }
    }
};
