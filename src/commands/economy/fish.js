import { SlashCommandBuilder } from 'discord.js';
import UserEconomy from '../../models/UserEconomy.js';
import { getGuildConfig } from '../../middleware/commandHandler.js';
const fishTypes = [['🐟 Common Fish',false],['🐠 Tropical Fish',false],['🐡 Pufferfish',false],['🦑 Squid',false],['🦐 Shrimp',false],['🦞 Lobster 🎉',false],['🎣 Old Boot',true],['🗑️ Trash',true]];
export default {
    data: new SlashCommandBuilder().setName('fish').setDescription('Go fishing for coins'),
    name: 'fish', cooldown: 3,
    async execute(interaction, client) {
        const userId = interaction.user?.id || interaction.author?.id;
        const guildId = interaction.guild?.id || interaction.guildId;
        const config = await getGuildConfig(guildId);
        let eco = await UserEconomy.findOne({ userId, guildId });
        if (!eco) eco = new UserEconomy({ userId, guildId });
        const now = new Date();
        const cooldown = 30000;
        if (eco.lastFish && now - eco.lastFish < cooldown) {
            const remaining = Math.ceil((cooldown - (now - eco.lastFish)) / 1000);
            const reply = { embeds: [{ title: '⏰ Fishing Cooldown', description: `Wait **${remaining}s** before fishing again.`, color: 0xEF4444 }] };
            return interaction.reply ? interaction.reply(reply) : interaction.channel.send(reply);
        }
        const min = config.economy?.fishingMin || 10;
        const max = config.economy?.fishingMax || 100;
        const [caught, isJunk] = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        const amount = isJunk ? 0 : Math.floor(Math.random() * (max - min + 1)) + min;
        eco.wallet += amount;
        eco.lastFish = now;
        await eco.save();
        const emoji = config.economy?.currencyEmoji || '🪙';
        const reply = { embeds: [{ title: '🎣 Fishing Results', description: isJunk ? `You caught **${caught}**... worth nothing!` : `You caught **${caught}**!\nEarned **${emoji} ${amount}** coins!`, color: isJunk ? 0x6B7280 : 0x00FF00, footer: { text: `Wallet: ${eco.wallet.toLocaleString()} coins` } }] };
        return interaction.reply ? interaction.reply(reply) : interaction.channel.send(reply);
    }
};
