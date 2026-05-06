import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import UserLevel, { xpForLevel } from '../../models/UserLevel.js';

async function recalcLevel(doc) {
    let level = 0;
    let remaining = doc.totalXP;
    while (remaining >= xpForLevel(level)) {
        remaining -= xpForLevel(level);
        level++;
    }
    doc.level = level;
    doc.xp = remaining;
    return doc;
}

export default {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription('Manage XP for users (Admin)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s => s.setName('add').setDescription('Add XP to a user')
            .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
            .addIntegerOption(o => o.setName('amount').setDescription('XP amount').setRequired(true).setMinValue(1)))
        .addSubcommand(s => s.setName('remove').setDescription('Remove XP from a user')
            .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
            .addIntegerOption(o => o.setName('amount').setDescription('XP amount').setRequired(true).setMinValue(1)))
        .addSubcommand(s => s.setName('set').setDescription('Set XP for a user')
            .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
            .addIntegerOption(o => o.setName('amount').setDescription('XP amount').setRequired(true).setMinValue(0))),
    
    permissions: [PermissionFlagsBits.Administrator],

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guild.id;

        let doc = await UserLevel.findOne({ userId: user.id, guildId });
        if (!doc) doc = new UserLevel({ userId: user.id, guildId, xp: 0, level: 0, totalXP: 0 });

        if (subcommand === 'add') {
            doc.totalXP += amount;
        } else if (subcommand === 'remove') {
            doc.totalXP = Math.max(0, doc.totalXP - amount);
        } else if (subcommand === 'set') {
            doc.totalXP = amount;
        }

        await recalcLevel(doc);
        await doc.save();

        return interaction.reply({
            embeds: [{
                title: '✅ XP Updated',
                description: `Updated **${user.username}**'s XP\n**Level:** ${doc.level} | **Total XP:** ${doc.totalXP.toLocaleString()}`,
                color: 0x00FF00
            }]
        });
    }
};
