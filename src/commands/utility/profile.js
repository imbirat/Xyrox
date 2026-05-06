import { SlashCommandBuilder } from 'discord.js';
import UserLevel, { xpForLevel } from '../../models/UserLevel.js';
import UserEconomy from '../../models/UserEconomy.js';

export default {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your or another user\'s profile')
        .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(false)),
    name: 'profile',
    aliases: ['rank', 'level'],
    cooldown: 3,

    async execute(interaction, client) {
        const target = interaction.options?.getUser('user') || interaction.user || interaction.author;
        const guildId = interaction.guild?.id || interaction.guildId;

        const [levelData, ecoData] = await Promise.all([
            UserLevel.findOne({ userId: target.id, guildId }),
            UserEconomy.findOne({ userId: target.id, guildId })
        ]);

        const level = levelData?.level || 0;
        const xp = levelData?.xp || 0;
        const totalXP = levelData?.totalXP || 0;
        const nextLevelXP = xpForLevel(level);
        const progress = nextLevelXP > 0 ? Math.floor((xp / nextLevelXP) * 10) : 0;
        const bar = '█'.repeat(progress) + '░'.repeat(10 - progress);

        // Get rank
        const rank = await UserLevel.countDocuments({ guildId, totalXP: { $gt: totalXP } }) + 1;

        const embed = {
            title: `📊 ${target.username}'s Profile`,
            thumbnail: { url: target.displayAvatarURL({ dynamic: true }) },
            color: 0x5865F2,
            fields: [
                { name: '⭐ Level', value: `**${level}**`, inline: true },
                { name: '🏆 Rank', value: `**#${rank}**`, inline: true },
                { name: '✨ Total XP', value: `**${totalXP.toLocaleString()}**`, inline: true },
                { name: `📈 Progress to Level ${level + 1}`, value: `\`[${bar}]\` ${xp}/${nextLevelXP} XP`, inline: false },
                { name: '🪙 Wallet', value: `**${(ecoData?.wallet || 0).toLocaleString()}** coins`, inline: true },
                { name: '🏦 Bank', value: `**${(ecoData?.bank || 0).toLocaleString()}** coins`, inline: true },
            ],
            footer: { text: interaction.guild?.name },
            timestamp: new Date()
        };

        if (interaction.reply) await interaction.reply({ embeds: [embed] });
        else await interaction.channel.send({ embeds: [embed] });
    }
};
