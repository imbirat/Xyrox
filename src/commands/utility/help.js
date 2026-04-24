import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

const ADD_BOT_URL = 'https://discord.com/oauth2/authorize?client_id=1496858363688915115&permissions=8&integration_type=0&scope=bot';
const SUPPORT_URL = 'https://discord.gg/huXUSUeu6t';
const WEBSITE_URL = 'https://xyrox.vercel.app/';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands'),
    
    async execute(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('Select a category')
            .addOptions([
                {
                    label: '🛡️ Moderation',
                    description: 'Moderation and auto-mod commands',
                    value: 'moderation'
                },
                {
                    label: '📝 Logging',
                    description: 'Server logging configuration',
                    value: 'logging'
                },
                {
                    label: '👋 Welcome System',
                    description: 'Welcome and leave messages',
                    value: 'welcome'
                },
                {
                    label: '🎭 Reaction Roles',
                    description: 'Reaction role system',
                    value: 'reactionroles'
                },
                {
                    label: '🤖 Custom Commands',
                    description: 'Create custom commands',
                    value: 'custom'
                },
                {
                    label: '🎟️ Tickets',
                    description: 'Support ticket system',
                    value: 'tickets'
                },
                {
                    label: '🧰 Utility',
                    description: 'Utility commands',
                    value: 'utility'
                },
                {
                    label: '🎉 Fun',
                    description: 'Fun and entertainment commands',
                    value: 'fun'
                }
            ]);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        const mainEmbed = {
            title: '🤖 Xyrox Bot - Help Menu',
            description: 'Welcome to Xyrox! Select a category from the menu below to view commands.',
            color: 0x5865F2,
            fields: [
                {
                    name: '📊 Quick Stats',
                    value: `• Servers: ${interaction.client.guilds.cache.size}\n• Commands: ${interaction.client.slashCommands.size}\n• Uptime: ${formatUptime(interaction.client.uptime)}`
                },
                {
                    name: '🔗 Links',
                    value: `[Website](${WEBSITE_URL}) • [Support Server](${SUPPORT_URL}) • [Invite Bot](${ADD_BOT_URL})`
                },
                {
                    name: '💡 Features',
                    value: '• Advanced AutoMod System\n• Anti-Nuke Protection\n• Reaction Roles\n• Custom Commands\n• Logging System\n• Ticket System\n• Welcome System'
                }
            ],
            footer: {
                text: 'Made with ❤️ by Xyrox Team'
            }
        };
        
        await interaction.reply({
            embeds: [mainEmbed],
            components: [row]
        });
        
        // Handle select menu interaction
        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id && i.customId === 'help_category',
            time: 60000
        });
        
        collector.on('collect', async i => {
            const category = i.values[0];
            const categoryEmbed = getCategoryEmbed(category);
            await i.update({ embeds: [categoryEmbed], components: [row] });
        });
        
        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};

function getCategoryEmbed(category) {
    const embeds = {
        moderation: {
            title: '🛡️ Moderation Commands',
            color: 0xFF0000,
            fields: [
                { name: '/automod', value: 'Configure AutoMod system' },
                { name: '/ban', value: 'Ban a user from the server' },
                { name: '/unban', value: 'Unban a user' },
                { name: '/kick', value: 'Kick a user from the server' },
                { name: '/timeout', value: 'Timeout a user' },
                { name: '/warn', value: 'Warn a user' },
                { name: '/warnings', value: 'View user warnings' },
                { name: '/clear', value: 'Clear messages in a channel' },
                { name: '/lock', value: 'Lock a channel' },
                { name: '/unlock', value: 'Unlock a channel' },
                { name: '/slowmode', value: 'Set slowmode in a channel' },
                { name: '/antinuke', value: 'Configure anti-nuke protection' }
            ]
        },
        logging: {
            title: '📝 Logging Commands',
            color: 0x00FF00,
            fields: [
                { name: '/logs setup', value: 'Setup logging system' },
                { name: '/logs disable', value: 'Disable logging' },
                { name: '/logs channel', value: 'Set logging channel' }
            ]
        },
        welcome: {
            title: '👋 Welcome System Commands',
            color: 0x00FFFF,
            fields: [
                { name: '/welcome setup', value: 'Setup welcome messages' },
                { name: '/welcome message', value: 'Edit welcome message' },
                { name: '/leave setup', value: 'Setup leave messages' }
            ]
        },
        reactionroles: {
            title: '🎭 Reaction Role Commands',
            color: 0xFF00FF,
            fields: [
                { name: '/reactionrole create', value: 'Create a reaction role' },
                { name: '/reactionrole add', value: 'Add a role to reaction role' },
                { name: '/reactionrole remove', value: 'Remove a role from reaction role' },
                { name: '/reactionrole delete', value: 'Delete a reaction role' }
            ]
        },
        custom: {
            title: '🤖 Custom Command Commands',
            color: 0xFFFF00,
            fields: [
                { name: '/customcommand create', value: 'Create a custom command' },
                { name: '/customcommand delete', value: 'Delete a custom command' },
                { name: '/customcommand edit', value: 'Edit a custom command' },
                { name: '/customcommand list', value: 'List all custom commands' }
            ]
        },
        tickets: {
            title: '🎟️ Ticket System Commands',
            color: 0x0099FF,
            fields: [
                { name: '/ticket setup', value: 'Setup ticket system' },
                { name: '/ticket close', value: 'Close a ticket' },
                { name: '/ticket panel', value: 'Create a ticket panel' },
                { name: '/ticket transcript', value: 'Generate ticket transcript' }
            ]
        },
        utility: {
            title: '🧰 Utility Commands',
            color: 0x808080,
            fields: [
                { name: '/ping', value: 'Check bot latency' },
                { name: '/userinfo', value: 'Get user information' },
                { name: '/serverinfo', value: 'Get server information' },
                { name: '/avatar', value: 'Get user avatar' },
                { name: '/botinfo', value: 'Get bot information' },
                { name: '/invite', value: 'Get bot invite link' }
            ]
        },
        fun: {
            title: '🎉 Fun Commands',
            color: 0xFFC0CB,
            fields: [
                { name: '/8ball', value: 'Ask the magic 8ball' },
                { name: '/coinflip', value: 'Flip a coin' },
                { name: '/roll', value: 'Roll a dice' }
            ]
        }
    };
    
    return embeds[category] || embeds.moderation;
}

function formatUptime(uptime) {
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor(uptime / 3600000) % 24;
    const minutes = Math.floor(uptime / 60000) % 60;
    
    return `${days}d ${hours}h ${minutes}m`;
}
