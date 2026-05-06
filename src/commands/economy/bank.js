import { SlashCommandBuilder } from 'discord.js';
import UserEconomy from '../../models/UserEconomy.js';
import { getGuildConfig } from '../../middleware/commandHandler.js';
export default {
    data: new SlashCommandBuilder().setName('bank').setDescription('View bank balance').addUserOption(o => o.setName('user').setDescription('User').setRequired(false)),
    name: 'bank', cooldown: 3,
    async execute(interaction, client) {
        const target = interaction.options?.getUser('user') || interaction.user || interaction.author;
        const guildId = interaction.guild?.id || interaction.guildId;
        const config = await getGuildConfig(guildId);
        const eco = await UserEconomy.findOne({ userId: target.id, guildId }) || { wallet: 0, bank: 0 };
        const emoji = config.economy?.currencyEmoji || '🪙';
        const reply = { embeds: [{ title: `🏦 ${target.username}'s Bank`, fields: [{ name: '👜 Wallet', value: `**${emoji} ${eco.wallet.toLocaleString()}**`, inline: true }, { name: '🏦 Bank', value: `**${emoji} ${eco.bank.toLocaleString()}**`, inline: true }, { name: '💰 Total', value: `**${emoji} ${(eco.wallet + eco.bank).toLocaleString()}**`, inline: true }], color: 0xFBBF24 }] };
        return interaction.reply ? interaction.reply(reply) : interaction.channel.send(reply);
    }
};
