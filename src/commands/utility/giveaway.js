import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Guild from '../../models/Guild.js';
import { clearGuildCache } from '../../middleware/commandHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s => s.setName('start').setDescription('Start a giveaway')
            .addStringOption(o => o.setName('prize').setDescription('What to give away').setRequired(true))
            .addStringOption(o => o.setName('duration').setDescription('Duration e.g. 1h, 30m, 1d').setRequired(true))
            .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setRequired(false).setMinValue(1).setMaxValue(20)))
        .addSubcommand(s => s.setName('end').setDescription('End a giveaway early')
            .addStringOption(o => o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
        .addSubcommand(s => s.setName('reroll').setDescription('Reroll a giveaway')
            .addStringOption(o => o.setName('message_id').setDescription('Giveaway message ID').setRequired(true))),

    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'start') {
            const prize = interaction.options.getString('prize');
            const durationStr = interaction.options.getString('duration');
            const winnerCount = interaction.options.getInteger('winners') || 1;

            // Parse duration
            const durationMs = parseDuration(durationStr);
            if (!durationMs) return interaction.reply({ content: '❌ Invalid duration. Use format like `1h`, `30m`, `2d`.', ephemeral: true });

            const endTime = new Date(Date.now() + durationMs);
            const embed = {
                title: `🎉 GIVEAWAY — ${prize}`,
                description: [
                    `React with 🎉 to enter!`,
                    ``,
                    `**Winners:** ${winnerCount}`,
                    `**Hosted by:** ${interaction.user}`,
                    `**Ends:** <t:${Math.floor(endTime.getTime() / 1000)}:R>`,
                ].join('\n'),
                color: 0xFF73FA,
                footer: { text: `Ends at` },
                timestamp: endTime
            };

            const msg = await interaction.channel.send({ embeds: [embed] });
            await msg.react('🎉');

            const giveawayData = { messageId: msg.id, channelId: interaction.channelId, prize, winnerCount, endTime, hostId: interaction.user.id, entries: [], ended: false };
            await Guild.findOneAndUpdate({ guildId }, { $push: { giveaways: giveawayData } }, { upsert: true });
            clearGuildCache(guildId);

            await interaction.reply({ content: `✅ Giveaway started! [Jump to giveaway](${msg.url})`, ephemeral: true });

            // Schedule end
            setTimeout(() => endGiveaway(client, guildId, msg.id), durationMs);
        }

        if (subcommand === 'end') {
            const messageId = interaction.options.getString('message_id');
            await endGiveaway(client, guildId, messageId);
            await interaction.reply({ content: '✅ Giveaway ended!', ephemeral: true });
        }

        if (subcommand === 'reroll') {
            const messageId = interaction.options.getString('message_id');
            const guildDoc = await Guild.findOne({ guildId });
            const giveaway = guildDoc?.giveaways?.find(g => g.messageId === messageId);
            if (!giveaway || !giveaway.ended) return interaction.reply({ content: '❌ Could not find ended giveaway.', ephemeral: true });
            const entries = giveaway.entries.filter(id => id !== giveaway.hostId);
            if (entries.length === 0) return interaction.reply({ content: '❌ No entries to reroll from.', ephemeral: true });
            const winners = pickWinners(entries, giveaway.winnerCount);
            const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
            if (channel) await channel.send({ content: `🎉 Reroll! New winner(s): ${winners.map(id => `<@${id}>`).join(', ')} for **${giveaway.prize}**!` });
            await interaction.reply({ content: '✅ Rerolled!', ephemeral: true });
        }
    }
};

function parseDuration(str) {
    const match = str.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return null;
    const n = parseInt(match[1]);
    const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2].toLowerCase()];
    return n * unit;
}

function pickWinners(entries, count) {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    return [...new Set(shuffled)].slice(0, count);
}

async function endGiveaway(client, guildId, messageId) {
    try {
        const guildDoc = await Guild.findOne({ guildId });
        const giveaway = guildDoc?.giveaways?.find(g => g.messageId === messageId && !g.ended);
        if (!giveaway) return;

        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel) return;

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return;

        // Collect reaction entries
        const reaction = message.reactions.cache.get('🎉');
        const users = reaction ? await reaction.users.fetch() : new Map();
        const entries = [...users.keys()].filter(id => id !== client.user.id);

        const winners = entries.length > 0 ? pickWinners(entries, giveaway.winnerCount) : [];

        const resultEmbed = {
            title: `🎉 GIVEAWAY ENDED — ${giveaway.prize}`,
            description: winners.length > 0
                ? `**Winner(s):** ${winners.map(id => `<@${id}>`).join(', ')}\n**Hosted by:** <@${giveaway.hostId}>\n**Entries:** ${entries.length}`
                : '**No valid entries!**',
            color: 0x6B7280,
            footer: { text: 'Giveaway ended' },
            timestamp: new Date()
        };

        await message.edit({ embeds: [resultEmbed] });
        if (winners.length > 0) {
            await channel.send({ content: `🎉 Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!` });
        }

        await Guild.findOneAndUpdate({ guildId, 'giveaways.messageId': messageId }, { $set: { 'giveaways.$.ended': true, 'giveaways.$.winners': winners, 'giveaways.$.entries': entries } });
    } catch (err) {
        console.error('Giveaway end error:', err);
    }
}
