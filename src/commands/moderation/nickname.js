import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('nickname')
        .setDescription('Manage user nicknames')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        .addSubcommand(subcommand =>
            subcommand.setName('set').setDescription("Set a user's nickname")
                .addUserOption(option =>
                    option.setName('user').setDescription('User to set nickname for').setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('nickname').setDescription('New nickname').setRequired(true).setMaxLength(32)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('reset').setDescription("Reset a user's nickname")
                .addUserOption(option =>
                    option.setName('user').setDescription('User to reset nickname for').setRequired(true)
                )
        ),
    
    permissions: [PermissionFlagsBits.ManageNicknames],
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        
        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({ content: "❌ You cannot manage this user's nickname (role hierarchy).", ephemeral: true });
            }
            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ content: "❌ I cannot manage this user's nickname (role hierarchy).", ephemeral: true });
            }
            
            if (subcommand === 'set') {
                const nickname = interaction.options.getString('nickname');
                const oldNickname = member.nickname || member.user.username;
                
                await member.setNickname(nickname, `Nickname changed by ${interaction.user.username}`);
                
                return interaction.reply({
                    embeds: [{
                        title: '✅ Nickname Changed',
                        description: `Changed **${user.username}**'s nickname`,
                        fields: [
                            { name: 'Old Nickname', value: oldNickname, inline: true },
                            { name: 'New Nickname', value: nickname, inline: true }
                        ],
                        color: 0x00FF00,
                        timestamp: new Date()
                    }]
                });
            }
            
            if (subcommand === 'reset') {
                if (!member.nickname) {
                    return interaction.reply({ content: `❌ **${user.username}** doesn't have a nickname.`, ephemeral: true });
                }
                
                await member.setNickname(null, `Nickname reset by ${interaction.user.username}`);
                
                return interaction.reply({
                    embeds: [{
                        title: '✅ Nickname Reset',
                        description: `Reset **${user.username}**'s nickname to their username.`,
                        color: 0x00FF00,
                        timestamp: new Date()
                    }]
                });
            }
            
        } catch (error) {
            console.error('Nickname command error:', error);
            return interaction.reply({ content: '❌ Failed to manage nickname. Please check my permissions.', ephemeral: true });
        }
    }
};
