import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

const ADD_BOT_URL = 'https://discord.com/oauth2/authorize?client_id=1496858363688915115&permissions=8&integration_type=0&scope=bot';
const SUPPORT_URL = 'https://discord.gg/huXUSUeu6t';
const WEBSITE_URL = 'https://xyrox.vercel.app/';

const CATEGORIES = {
    moderation: {
        label: '🛡️ Moderation',
        description: 'Ban, kick, warn, mute & more',
        color: 0xEF4444,
        commands: [
            ['/ban <user> [reason]',          'Permanently ban a member'],
            ['/unban <user_id>',              'Unban a member'],
            ['/kick <user> [reason]',         'Kick a member from the server'],
            ['/timeout <user> <duration>',    'Timeout a member'],
            ['/warn <user> <reason>',         'Issue a warning to a member'],
            ['/warnings <user>',              'View a member\'s warnings'],
            ['/clear <amount>',               'Bulk delete messages (1–100)'],
            ['/lock [channel]',               'Lock a channel'],
            ['/unlock [channel]',             'Unlock a channel'],
            ['/slowmode <seconds>',           'Set channel slowmode'],
            ['/nickname <user> [nick]',       'Change or reset a member\'s nickname'],
            ['/role add <user> <role>',       'Add a role to a member'],
            ['/role remove <user> <role>',    'Remove a role from a member'],
            ['/role all <role>',              'Give a role to every member (admin)'],
            ['/role allroles',                'List all roles in the server'],
        ]
    },
    automod: {
        label: '🤖 Auto Mod',
        description: 'Automatic moderation filters',
        color: 0xF97316,
        commands: [
            ['/automod enable',               'Enable the AutoMod system'],
            ['/automod disable',              'Disable the AutoMod system'],
            ['/automod antispam',             'Configure spam detection'],
            ['/automod anticaps',             'Configure caps filter'],
            ['/automod antilinks',            'Configure link filter'],
            ['/automod antiinvites',          'Block Discord invite links'],
            ['/automod badwords',             'Manage banned words list'],
            ['/automod whitelist',            'Whitelist channels or roles'],
            ['/antinuke enable',              'Enable anti-nuke protection'],
            ['/antinuke whitelist <user>',    'Whitelist a trusted admin'],
        ]
    },
    leveling: {
        label: '⭐ Leveling',
        description: 'XP, levels and leaderboards',
        color: 0xA78BFA,
        commands: [
            ['/profile [user]',               'View your or another member\'s level & stats'],
            ['/leaderboard levels',           'Server level leaderboard (top 10)'],
            ['/xp add <user> <amount>',       'Admin: add XP to a member'],
            ['/xp remove <user> <amount>',    'Admin: remove XP from a member'],
            ['/xp set <user> <amount>',       'Admin: set a member\'s total XP'],
        ]
    },
    economy: {
        label: '🪙 Economy',
        description: 'Currency, fishing & bank',
        color: 0xFBBF24,
        commands: [
            ['/daily',                        'Claim your daily coin reward (24h cooldown)'],
            ['/fish',                         'Go fishing for coins (30s cooldown)'],
            ['/bank [user]',                  'Check wallet & bank balance'],
            ['/deposit <amount|all>',         'Deposit coins from wallet into bank'],
            ['/leaderboard economy',          'Server economy leaderboard (top 10)'],
            ['/profile [user]',               'View economy stats alongside level info'],
        ]
    },
    giveaway: {
        label: '🎉 Giveaways',
        description: 'Create & manage giveaways',
        color: 0xFB923C,
        commands: [
            ['/giveaway start <prize> <duration> [winners]', 'Start a timed giveaway'],
            ['/giveaway end <message_id>',    'End a giveaway early'],
            ['/giveaway reroll <message_id>', 'Pick new winner(s) for an ended giveaway'],
        ]
    },
    tickets: {
        label: '🎫 Tickets',
        description: 'Support ticket system',
        color: 0xEC4899,
        commands: [
            ['/ticket setup [title] [desc]',  'Create a ticket panel in the current channel'],
            ['/ticket close',                 'Close the current ticket channel'],
            ['/ticket add <user>',            'Add a member to the current ticket'],
            ['/ticket remove <user>',         'Remove a member from the current ticket'],
        ]
    },
    reactionroles: {
        label: '🎭 Reaction Roles',
        description: 'Self-assignable role panels',
        color: 0xEAB308,
        commands: [
            ['/reactionrole create <title> [type]', 'Create a panel (button / reaction / select)'],
            ['/reactionrole add <msg_id> <role> <emoji> [label]', 'Add a role to a panel'],
            ['/reactionrole remove <msg_id>', 'Delete a reaction role panel'],
        ]
    },
    utility: {
        label: '🧰 Utility',
        description: 'Info & general purpose',
        color: 0x94A3B8,
        commands: [
            ['/help',                         'Show this help menu'],
            ['/ping',                         'Check bot latency & API response time'],
            ['/userinfo [user]',              'View detailed info about a member'],
            ['/serverinfo',                   'View detailed info about this server'],
            ['/avatar [user]',                'Get a member\'s full-size avatar'],
            ['/botinfo',                      'View Xyrox bot statistics'],
            ['/invite',                       'Get the bot invite & support links'],
            ['/afk [reason]',                 'Set AFK status — auto-removed when you type'],
            ['/leaderboard [type]',           'View levels or economy leaderboard'],
            ['/profile [user]',               'View your level, rank & economy profile'],
        ]
    },
};

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Browse all Xyrox commands by category')
        .addStringOption(o =>
            o.setName('category')
             .setDescription('Jump directly to a category')
             .setRequired(false)
             .addChoices(
                 { name: '🛡️ Moderation',    value: 'moderation' },
                 { name: '🤖 Auto Mod',       value: 'automod' },
                 { name: '⭐ Leveling',        value: 'leveling' },
                 { name: '🪙 Economy',         value: 'economy' },
                 { name: '🎉 Giveaways',       value: 'giveaway' },
                 { name: '🎫 Tickets',         value: 'tickets' },
                 { name: '🎭 Reaction Roles',  value: 'reactionroles' },
                 { name: '🧰 Utility',         value: 'utility' },
             )
        ),

    name: 'help',
    aliases: ['commands', 'cmds'],
    cooldown: 5,

    async execute(interaction, client) {
        const jumpTo = interaction.options?.getString?.('category');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('📂 Select a category…')
            .addOptions(
                Object.entries(CATEGORIES).map(([key, cat]) => ({
                    label: cat.label,
                    description: cat.description,
                    value: key,
                    default: key === jumpTo,
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const totalCommands = Object.values(CATEGORIES).reduce((n, c) => n + c.commands.length, 0);
        const uptime = formatUptime(interaction.client.uptime);
        const servers = interaction.client.guilds.cache.size;

        // If a category was passed directly, show it straight away
        const initialEmbed = jumpTo
            ? buildCategoryEmbed(jumpTo)
            : buildHomeEmbed(servers, totalCommands, uptime);

        const reply = await (interaction.reply
            ? interaction.reply({ embeds: [initialEmbed], components: [row], fetchReply: true })
            : interaction.channel.send({ embeds: [initialEmbed], components: [row] }));

        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === (interaction.user?.id || interaction.author?.id) && i.customId === 'help_category',
            time: 120_000,
        });

        collector.on('collect', async i => {
            await i.update({ embeds: [buildCategoryEmbed(i.values[0])], components: [row] });
        });

        collector.on('end', () => {
            const disabledMenu = new StringSelectMenuBuilder()
                .setCustomId('help_category_disabled')
                .setPlaceholder('⏰ Menu expired — run /help again')
                .setDisabled(true)
                .addOptions([{ label: 'expired', value: 'expired' }]);
            const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);
            reply.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};

// ─── Home embed ───────────────────────────────────────────────────────────────
function buildHomeEmbed(servers, totalCommands, uptime) {
    return {
        title: '✨ Xyrox — Help Menu',
        description: [
            'A powerful all-in-one Discord bot for moderation, leveling, tickets, economy, giveaways and more.',
            '',
            '> Use the dropdown below to browse commands by category.',
            `> Or run \`/help category:<name>\` to jump straight there.`,
        ].join('\n'),
        color: 0x7C3AED,
        fields: [
            {
                name: '📦 Categories',
                value: Object.values(CATEGORIES)
                    .map(c => `${c.label}`)
                    .join('  ·  '),
                inline: false,
            },
            {
                name: '📊 Stats',
                value: `**${servers}** servers  ·  **${totalCommands}** commands  ·  Up **${uptime}**`,
                inline: false,
            },
            {
                name: '🔗 Links',
                value: `[Dashboard](${WEBSITE_URL})  ·  [Support Server](${SUPPORT_URL})  ·  [Invite Xyrox](${ADD_BOT_URL})`,
                inline: false,
            },
        ],
        footer: { text: 'Xyrox  •  Select a category below' },
        timestamp: new Date().toISOString(),
    };
}

// ─── Category embed ───────────────────────────────────────────────────────────
function buildCategoryEmbed(key) {
    const cat = CATEGORIES[key];
    if (!cat) return buildHomeEmbed(0, 0, '0m');

    // Split commands into two columns if > 8 entries
    const half = Math.ceil(cat.commands.length / 2);
    const col1 = cat.commands.slice(0, half);
    const col2 = cat.commands.slice(half);

    const fmt = cmds => cmds.map(([cmd, desc]) =>
        `\`${cmd}\`\n┕ ${desc}`
    ).join('\n');

    const fields = col2.length
        ? [
            { name: '\u200b', value: fmt(col1), inline: true },
            { name: '\u200b', value: fmt(col2), inline: true },
          ]
        : [
            { name: '\u200b', value: fmt(col1), inline: false },
          ];

    return {
        title: `${cat.label} Commands`,
        color: cat.color,
        fields,
        footer: { text: `${cat.commands.length} commands  •  /help to go home  •  Xyrox` },
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatUptime(ms) {
    if (!ms) return '0m';
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor(ms / 3_600_000) % 24;
    const m = Math.floor(ms / 60_000) % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}
