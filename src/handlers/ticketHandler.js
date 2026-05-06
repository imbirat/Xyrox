import { PermissionFlagsBits, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import Guild from '../models/Guild.js';
import { getGuildConfig } from '../middleware/commandHandler.js';

export default {
    async handleButton(interaction, client) {
        const buttonId = interaction.customId;

        if (buttonId === 'ticket_create_panel') {
            await createTicket(interaction, client);
        } else if (buttonId.startsWith('ticket_close_')) {
            await closeTicket(interaction, client);
        } else if (buttonId.startsWith('ticket_claim_')) {
            await claimTicket(interaction, client);
        }
    },

    async handleModal(interaction, client) {
        // Reserved for future ticket modal submissions
    }
};

async function createTicket(interaction, client) {
    try {
        const guildId = interaction.guild.id;
        const config = await getGuildConfig(guildId);

        if (!config.tickets?.enabled) {
            return interaction.reply({ content: '❌ The ticket system is disabled.', ephemeral: true });
        }

        // Check if user already has a ticket
        const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
        if (existing) {
            return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });
        }

        await interaction.reply({ content: '🎫 Creating your ticket...', ephemeral: true });

        const categoryId = config.tickets?.categoryId;
        const supportRoleId = config.tickets?.supportRoleId;

        const channelName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`;

        const permissionOverwrites = [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
        ];
        if (supportRoleId) {
            permissionOverwrites.push({ id: supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
        }

        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: categoryId || null,
            permissionOverwrites
        });

        const closeBtn = new ButtonBuilder().setCustomId(`ticket_close_${channel.id}`).setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger);
        const claimBtn = new ButtonBuilder().setCustomId(`ticket_claim_${channel.id}`).setLabel('Claim').setEmoji('✋').setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder().addComponents(closeBtn, claimBtn);

        await channel.send({
            content: `${interaction.user} ${supportRoleId ? `<@&${supportRoleId}>` : ''}`,
            embeds: [{
                title: '🎫 Ticket Created',
                description: `Hello ${interaction.user}! Support will be with you shortly.\n\nPlease describe your issue and wait for a response.`,
                color: 0x5865F2,
                footer: { text: `Ticket for ${interaction.user.username}` },
                timestamp: new Date()
            }],
            components: [row]
        });

        await interaction.editReply({ content: `✅ Ticket created! ${channel}` });
    } catch (err) {
        console.error('Ticket create error:', err);
        if (!interaction.replied) await interaction.reply({ content: '❌ Failed to create ticket.', ephemeral: true });
    }
}

async function closeTicket(interaction, client) {
    try {
        await interaction.reply({
            embeds: [{ title: '🔒 Closing Ticket', description: 'This ticket will be deleted in 5 seconds.', color: 0xEF4444 }]
        });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    } catch (err) {
        console.error('Ticket close error:', err);
    }
}

async function claimTicket(interaction, client) {
    try {
        await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
            ViewChannel: true, SendMessages: true, ReadMessageHistory: true
        });
        await interaction.reply({ embeds: [{ description: `✋ Ticket claimed by ${interaction.user}`, color: 0x00FF00 }] });
    } catch (err) {
        console.error('Ticket claim error:', err);
    }
}
