import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage user roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand.setName('add').setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('user').setDescription('User to add role to').setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role').setDescription('Role to add').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove').setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('user').setDescription('User to remove role from').setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role').setDescription('Role to remove').setRequired(true)
                )
        ),
    
    permissions: [PermissionFlagsBits.ManageRoles],
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
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
                return interaction.reply({ content: '❌ This role is managed by an integration and cannot be assigned manually.', ephemeral: true });
            }
            
            if (subcommand === 'add') {
                if (member.roles.cache.has(role.id)) {
                    return interaction.reply({ content: `❌ **${user.username}** already has the ${role} role.`, ephemeral: true });
                }
                await member.roles.add(role, `Role added by ${interaction.user.username}`);
                return interaction.reply({
                    embeds: [{
                        title: '✅ Role Added',
                        description: `Added ${role} to **${user.username}**`,
                        color: 0x00FF00,
                        timestamp: new Date()
                    }]
                });
            }
            
            if (subcommand === 'remove') {
                if (!member.roles.cache.has(role.id)) {
                    return interaction.reply({ content: `❌ **${user.username}** doesn't have the ${role} role.`, ephemeral: true });
                }
                await member.roles.remove(role, `Role removed by ${interaction.user.username}`);
                return interaction.reply({
                    embeds: [{
                        title: '✅ Role Removed',
                        description: `Removed ${role} from **${user.username}**`,
                        color: 0xFF9900,
                        timestamp: new Date()
                    }]
                });
            }
            
        } catch (error) {
            console.error('Role command error:', error);
            return interaction.reply({ content: '❌ Failed to manage roles. Please check my permissions.', ephemeral: true });
        }
    }
};
