import { SlashCommandBuilder } from 'discord.js';
import UserEconomy from '../../models/UserEconomy.js';
import { getGuildConfig } from '../../middleware/commandHandler.js';

export default {
    data: new SlashCommandBuilder().setName('daily').setDescription('Claim your daily coins'),
    name: 'daily', aliases: ['dailyreward'], cooldown: 3,
    async execute(interaction, client) {
        const userId = interaction.user?.id || interaction.author?.id;
        const guildId = interaction.guild?.id || interaction.guildId;
        const config = await getGuildConfig(guildId);
        let eco = await UserEconomy.findOne({ userId, guildId });
        if (!eco) eco = new UserEconomy({ userId, guildId });
        const now = new Date();
        const cooldown = 24 * 60 * 60 * 1000;
        if (eco.lastDaily && now - eco.lastDaily < cooldown) {
            const remaining = cooldown - (now - eco.lastDaily);
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const reply = { embeds: [{ title: '⏰ Daily Cooldown', description: `Come back in **${h}h ${m}m**.`, color: 0xEF4444 }] };
            return interaction.reply ? interaction.reply(reply) : interaction.channel.send(reply);
        }
        const amount = config.economy?.dailyAmount || 100;
        eco.wallet += amount;
        eco.lastDaily = now;
        await eco.save();
        const emoji = config.economy?.currencyEmoji || '🪙';
        const reply = { embeds: [{ title: '✅ Daily Claimed!', description: `You received **${emoji} ${amount}**!\nWallet: **${eco.wallet.toLocaleString()}**`, color: 0x00FF00 }] };
        return interaction.reply ? interaction.reply(reply) : interaction.channel.send(reply);
    }
};
