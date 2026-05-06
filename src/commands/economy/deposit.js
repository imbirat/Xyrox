import { SlashCommandBuilder } from 'discord.js';
import UserEconomy from '../../models/UserEconomy.js';
import { getGuildConfig } from '../../middleware/commandHandler.js';
export default {
    data: new SlashCommandBuilder().setName('deposit').setDescription('Deposit coins to bank').addStringOption(o => o.setName('amount').setDescription('Amount or "all"').setRequired(true)),
    name: 'deposit', aliases: ['dep'], cooldown: 3,
    async execute(interaction, client) {
        const userId = interaction.user?.id || interaction.author?.id;
        const guildId = interaction.guild?.id || interaction.guildId;
        const config = await getGuildConfig(guildId);
        const amountStr = interaction.options?.getString('amount') || 'all';
        let eco = await UserEconomy.findOne({ userId, guildId });
        if (!eco) eco = new UserEconomy({ userId, guildId });
        let amount = amountStr === 'all' ? eco.wallet : parseInt(amountStr);
        if (isNaN(amount) || amount <= 0) {
            const reply = { embeds: [{ title: '❌ Invalid Amount', description: 'Enter a valid number or "all".', color: 0xEF4444 }] };
            return interaction.reply ? interaction.reply(reply) : interaction.channel.send(reply);
        }
        if (amount > eco.wallet) {
            const reply = { embeds: [{ title: '❌ Insufficient Funds', description: `You only have **${eco.wallet}** coins in wallet.`, color: 0xEF4444 }] };
            return interaction.reply ? interaction.reply(reply) : interaction.channel.send(reply);
        }
        eco.wallet -= amount; eco.bank += amount;
        await eco.save();
        const emoji = config.economy?.currencyEmoji || '🪙';
        const reply = { embeds: [{ title: '🏦 Deposited!', description: `Deposited **${emoji} ${amount}**.\nBank: **${eco.bank.toLocaleString()}** | Wallet: **${eco.wallet.toLocaleString()}**`, color: 0x00FF00 }] };
        return interaction.reply ? interaction.reply(reply) : interaction.channel.send(reply);
    }
};
