import { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import Guild from '../../models/Guild.js';
import { getGuildConfig, clearGuildCache } from '../../middleware/commandHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system management')
        .addSubcommand(s => s.setName('setup').setDescription('Create a ticket panel in this channel')
            .addStringOption(o => o.setName('title').setDescription('Panel title').setRequired(false))
            .addStringOption(o => o.setName('description').setDescription('Panel description').setRequired(false))
            .addStringOption(o => o.setName('button_label').setDescription('Button label').setRequired(false)))
        .addSubcommand(s => s.setName('close').setDescription('Close the current ticket'))
        .addSubcommand(s => s.setName('add').setDescription('Add user to ticket')
            .addUserOption(o => o.setName('user').setDescription('User to add').setRequired(true)))
        .addSubcommand(s => s.setName('remove').setDescription('Remove user from ticket')
            .addUserOption(o => o.setName('user').setDescription('User to remove').setRequired(true))),

    permissions: [PermissionFlagsBits.ManageChannels],

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const config = await getGuildConfig(guildId);

        if (subcommand === 'setup') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ You need Administrator to set up tickets.', ephemeral: true });
            }
            const title = interaction.options.getString('title') || '🎫 Support Tickets';
            const description = interaction.options.getString('description') || 'Click the button below to open a support ticket.';
            const buttonLabel = interaction.options.getString('button_label') || 'Create Ticket';

            const embed = { title, description, color: 0x5865F2, footer: { text: interaction.guild.name } };
            const button = new ButtonBuilder().setCustomId('ticket_create_panel').setLabel(buttonLabel).setEmoji('🎫').setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder().addComponents(button);

            const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

            await Guild.findOneAndUpdate({ guildId }, {
                $set: { 'tickets.enabled': true },
                $push: { 'tickets.panels': { messageId: msg.id, channelId: interaction.channelId, title, description, button: { label: buttonLabel } } }
            }, { upsert: true });
            clearGuildCache(guildId);

            return interaction.reply({ content: '✅ Ticket panel created!', ephemeral: true });
        }

        if (subcommand === 'close') {
            const channel = interaction.channel;
            if (!channel.name.startsWith('ticket-')) return interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
            await interaction.reply({ embeds: [{ title: '🔒 Closing Ticket', description: 'This ticket will be closed in 5 seconds.', color: 0xEF4444 }] });
            setTimeout(() => channel.delete().catch(() => {}), 5000);
        }

        if (subcommand === 'add') {
            const user = interaction.options.getUser('user');
            await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true });
            return interaction.reply({ embeds: [{ description: `✅ Added ${user} to the ticket.`, color: 0x00FF00 }] });
        }

        if (subcommand === 'remove') {
            const user = interaction.options.getUser('user');
            await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false });
            return interaction.reply({ embeds: [{ description: `✅ Removed ${user} from the ticket.`, color: 0xFBBF24 }] });
        }
    }
};
