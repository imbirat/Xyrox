import { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import Guild from '../../models/Guild.js';
import { clearGuildCache } from '../../middleware/commandHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Reaction role management')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(s => s.setName('create').setDescription('Create a reaction role panel')
            .addStringOption(o => o.setName('title').setDescription('Panel title').setRequired(true))
            .addStringOption(o => o.setName('type').setDescription('Panel type').setRequired(false)
                .addChoices({ name: '🔘 Buttons', value: 'button' }, { name: '📋 Select Menu', value: 'select' }, { name: '🎭 Reactions', value: 'reaction' })))
        .addSubcommand(s => s.setName('add').setDescription('Add role to a panel')
            .addStringOption(o => o.setName('message_id').setDescription('Panel message ID').setRequired(true))
            .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
            .addStringOption(o => o.setName('emoji').setDescription('Emoji').setRequired(true))
            .addStringOption(o => o.setName('label').setDescription('Label (for buttons/select)').setRequired(false)))
        .addSubcommand(s => s.setName('remove').setDescription('Delete a reaction role panel')
            .addStringOption(o => o.setName('message_id').setDescription('Panel message ID').setRequired(true))),

    permissions: [PermissionFlagsBits.ManageRoles],

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'create') {
            const title = interaction.options.getString('title');
            const type = interaction.options.getString('type') || 'button';

            const embed = { title: `🎭 ${title}`, description: 'Use the controls below to select your roles.', color: 0x5865F2, footer: { text: 'Add roles with /reactionrole add' } };
            const msg = await interaction.channel.send({ embeds: [embed] });

            await Guild.findOneAndUpdate({ guildId }, { $push: { reactionRoles: { messageId: msg.id, channelId: interaction.channelId, title, roles: [], type } } }, { upsert: true });
            clearGuildCache(guildId);

            return interaction.reply({ content: `✅ Panel created! Use \`/reactionrole add message_id:${msg.id}\` to add roles.`, ephemeral: true });
        }

        if (subcommand === 'add') {
            const messageId = interaction.options.getString('message_id');
            const role = interaction.options.getRole('role');
            const emoji = interaction.options.getString('emoji');
            const label = interaction.options.getString('label') || role.name;

            const guildDoc = await Guild.findOne({ guildId });
            const panel = guildDoc?.reactionRoles?.find(r => r.messageId === messageId);
            if (!panel) return interaction.reply({ content: '❌ Panel not found.', ephemeral: true });

            panel.roles.push({ emoji, roleId: role.id, label });
            await Guild.findOneAndUpdate({ guildId, 'reactionRoles.messageId': messageId }, { $push: { 'reactionRoles.$.roles': { emoji, roleId: role.id, label } } });
            clearGuildCache(guildId);

            // Update the message
            const channel = await client.channels.fetch(panel.channelId).catch(() => null);
            const message = channel ? await channel.messages.fetch(messageId).catch(() => null) : null;
            if (message) {
                const allRoles = [...panel.roles, { emoji, roleId: role.id, label }];
                if (panel.type === 'button') {
                    const rows = [];
                    for (let i = 0; i < allRoles.length; i += 5) {
                        const chunk = allRoles.slice(i, i + 5);
                        const btns = chunk.map(r => new ButtonBuilder().setCustomId(`rr_${r.roleId}`).setLabel(r.label).setEmoji(r.emoji).setStyle(ButtonStyle.Secondary));
                        rows.push(new ActionRowBuilder().addComponents(btns));
                    }
                    await message.edit({ components: rows.slice(0, 5) });
                } else if (panel.type === 'reaction') {
                    await message.react(emoji).catch(() => {});
                }
            }

            return interaction.reply({ content: `✅ Added ${role} with ${emoji} to the panel!`, ephemeral: true });
        }

        if (subcommand === 'remove') {
            const messageId = interaction.options.getString('message_id');
            await Guild.findOneAndUpdate({ guildId }, { $pull: { reactionRoles: { messageId } } });
            clearGuildCache(guildId);
            return interaction.reply({ content: '✅ Panel removed from database. Delete the message manually if needed.', ephemeral: true });
        }
    }
};
