import { getGuildConfig } from '../middleware/commandHandler.js';

export default {
    async handleButton(interaction, client) {
        try {
            const roleId = interaction.customId.replace('rr_', '');
            const config = await getGuildConfig(interaction.guild.id);
            const panel = config.reactionRoles?.find(r => r.roles?.some(role => role.roleId === roleId));
            if (!panel) return interaction.reply({ content: '❌ This reaction role panel is outdated.', ephemeral: true });

            const member = interaction.member;
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                const roleName = interaction.guild.roles.cache.get(roleId)?.name || 'Unknown';
                return interaction.reply({ content: `✅ Removed role **${roleName}**.`, ephemeral: true });
            } else {
                await member.roles.add(roleId);
                const roleName = interaction.guild.roles.cache.get(roleId)?.name || 'Unknown';
                return interaction.reply({ content: `✅ Added role **${roleName}**.`, ephemeral: true });
            }
        } catch (err) {
            console.error('Reaction role button error:', err);
            return interaction.reply({ content: '❌ Failed to assign role.', ephemeral: true });
        }
    },

    async handleSelectMenu(interaction, client) {
        try {
            const config = await getGuildConfig(interaction.guild.id);
            const selectedRoleId = interaction.values[0];
            const member = interaction.member;

            if (member.roles.cache.has(selectedRoleId)) {
                await member.roles.remove(selectedRoleId);
                const roleName = interaction.guild.roles.cache.get(selectedRoleId)?.name || 'Unknown';
                return interaction.reply({ content: `✅ Removed role **${roleName}**.`, ephemeral: true });
            } else {
                await member.roles.add(selectedRoleId);
                const roleName = interaction.guild.roles.cache.get(selectedRoleId)?.name || 'Unknown';
                return interaction.reply({ content: `✅ Added role **${roleName}**.`, ephemeral: true });
            }
        } catch (err) {
            console.error('Reaction role select error:', err);
            return interaction.reply({ content: '❌ Failed to assign role.', ephemeral: true });
        }
    },

    async handleReaction(reaction, user, client, remove = false) {
        try {
            if (user.bot) return;
            const guild = reaction.message.guild;
            if (!guild) return;
            const config = await getGuildConfig(guild.id);
            const panel = config.reactionRoles?.find(r => r.messageId === reaction.message.id && r.type === 'reaction');
            if (!panel) return;
            const emojiStr = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
            const roleEntry = panel.roles?.find(r => r.emoji === emojiStr || r.emoji === reaction.emoji.name);
            if (!roleEntry) return;
            const member = await guild.members.fetch(user.id).catch(() => null);
            if (!member) return;
            if (remove) {
                await member.roles.remove(roleEntry.roleId).catch(() => {});
            } else {
                await member.roles.add(roleEntry.roleId).catch(() => {});
            }
        } catch (err) {
            console.error('Reaction role reaction error:', err);
        }
    }
};
