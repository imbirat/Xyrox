import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(s => s.setName('add').setDescription('Add role to user')
            .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
            .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand(s => s.setName('remove').setDescription('Remove role from user')
            .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
            .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand(s => s.setName('all').setDescription('Add a role to ALL members (admin only)')
            .addRoleOption(o => o.setName('role').setDescription('Role to give everyone').setRequired(true)))
        .addSubcommand(s => s.setName('allroles').setDescription('List all roles in this server')),
    
    permissions: [PermissionFlagsBits.ManageRoles],
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'allroles') {
            const roles = interaction.guild.roles.cache
                .filter(r => r.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => `${r} — \`${r.id}\` — ${r.members.size} members`)
                .slice(0, 25);
            return interaction.reply({
                embeds: [{
                    title: `📋 Roles in ${interaction.guild.name}`,
                    description: roles.join('\n') || 'No roles found.',
                    color: 0x5865F2,
                    footer: { text: `${interaction.guild.roles.cache.size - 1} total roles` }
                }]
            });
        }

        if (subcommand === 'all') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ You need Administrator permission to use this.', ephemeral: true });
            }
            const role = interaction.options.getRole('role');
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ content: '❌ I cannot manage this role (role hierarchy).', ephemeral: true });
            }
            await interaction.reply({ embeds: [{ title: '⏳ Adding role to all members...', description: `This may take a while for large servers.`, color: 0xFBBF24 }] });
            const members = await interaction.guild.members.fetch();
            let count = 0;
            for (const [, member] of members) {
                if (!member.roles.cache.has(role.id) && !member.user.bot) {
                    await member.roles.add(role).catch(() => {});
                    count++;
                    await new Promise(r => setTimeout(r, 100));
                }
            }
            return interaction.editReply({ embeds: [{ title: '✅ Done!', description: `Added ${role} to **${count}** members.`, color: 0x00FF00 }] });
        }

        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        try {
            const member = await interaction.guild.members.fetch(user.id);
            if (role.position >= interaction.member.roles.highest.position) {
                return interaction.reply({ content: '❌ You cannot manage this role (role hierarchy).', ephemeral: true });
            }
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ content: '❌ I cannot manage this role (role hierarchy).', ephemeral: true });
            }
            if (role.managed) {
                return interaction.reply({ content: '❌ This role is managed by an integration.', ephemeral: true });
            }
            if (subcommand === 'add') {
                if (member.roles.cache.has(role.id)) return interaction.reply({ content: `❌ **${user.username}** already has ${role}.`, ephemeral: true });
                await member.roles.add(role);
                return interaction.reply({ embeds: [{ title: '✅ Role Added', description: `Added ${role} to **${user.username}**`, color: 0x00FF00, timestamp: new Date() }] });
            }
            if (subcommand === 'remove') {
                if (!member.roles.cache.has(role.id)) return interaction.reply({ content: `❌ **${user.username}** doesn't have ${role}.`, ephemeral: true });
                await member.roles.remove(role);
                return interaction.reply({ embeds: [{ title: '✅ Role Removed', description: `Removed ${role} from **${user.username}**`, color: 0xFF9900, timestamp: new Date() }] });
            }
        } catch (error) {
            console.error('Role command error:', error);
            return interaction.reply({ content: '❌ Failed to manage roles.', ephemeral: true });
        }
    }
};
