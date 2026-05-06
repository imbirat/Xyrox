import { SlashCommandBuilder } from 'discord.js';
import UserLevel from '../../models/UserLevel.js';
import UserEconomy from '../../models/UserEconomy.js';
import { xpForLevel } from '../../models/UserLevel.js';

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View server leaderboards')
        .addStringOption(o => o.setName('type').setDescription('Leaderboard type').setRequired(false)
            .addChoices(
                { name: '⭐ Levels', value: 'levels' },
                { name: '🪙 Economy', value: 'economy' }
            )),
    name: 'leaderboard',
    aliases: ['lb', 'top'],
    cooldown: 5,

    async execute(interaction, client) {
        const type = interaction.options?.getString('type') || 'levels';
        const guildId = interaction.guild?.id || interaction.guildId;
        await (interaction.deferReply ? interaction.deferReply() : null);

        let embed;
        if (type === 'economy') {
            const top = await UserEconomy.find({ guildId }).sort({ wallet: -1 }).limit(10);
            const lines = await Promise.all(top.map(async (u, i) => {
                const user = await client.users.fetch(u.userId).catch(() => null);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i+1}.**`;
                return `${medal} ${user?.username || 'Unknown'} — 🪙 ${u.wallet.toLocaleString()} wallet | 🏦 ${u.bank.toLocaleString()} bank`;
            }));
            embed = { title: '🪙 Economy Leaderboard', description: lines.join('\n') || 'No data yet.', color: 0xFBBF24, footer: { text: interaction.guild?.name } };
        } else {
            const top = await UserLevel.find({ guildId }).sort({ totalXP: -1 }).limit(10);
            const lines = await Promise.all(top.map(async (u, i) => {
                const user = await client.users.fetch(u.userId).catch(() => null);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i+1}.**`;
                return `${medal} ${user?.username || 'Unknown'} — Level **${u.level}** | ${u.totalXP.toLocaleString()} XP`;
            }));
            embed = { title: '⭐ Level Leaderboard', description: lines.join('\n') || 'No data yet.', color: 0x5865F2, footer: { text: interaction.guild?.name } };
        }

        if (interaction.editReply) await interaction.editReply({ embeds: [embed] });
        else await interaction.channel.send({ embeds: [embed] });
    }
};
