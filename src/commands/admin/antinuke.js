import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Guild from '../../models/Guild.js';
import { clearGuildCache } from '../../middleware/commandHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Configure anti-nuke protection')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable anti-nuke protection')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable anti-nuke protection')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('View anti-nuke configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Manage whitelist')
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add', value: 'add' },
                            { name: 'Remove', value: 'remove' },
                            { name: 'List', value: 'list' }
                        )
                )
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to add/remove from whitelist')
                        .setRequired(false)
                )
        ),
    
    permissions: [PermissionFlagsBits.Administrator],
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        
        try {
            let guildConfig = await Guild.findOne({ guildId });
            if (!guildConfig) {
                guildConfig = await Guild.create({ guildId });
            }
            
            switch (subcommand) {
                case 'enable':
                    guildConfig.antinuke.enabled = true;
                    await guildConfig.save();
                    clearGuildCache(guildId);
                    
                    return interaction.reply({
                        embeds: [{
                            title: '✅ Anti-Nuke Enabled',
                            description: 'Anti-nuke protection has been enabled for this server.',
                            fields: [
                                {
                                    name: 'Protection Against',
                                    value: '• Mass bans/kicks\n• Channel deletions\n• Role deletions\n• Permission abuse'
                                }
                            ],
                            color: 0x00FF00,
                            timestamp: new Date()
                        }]
                    });
                
                case 'disable':
                    guildConfig.antinuke.enabled = false;
                    await guildConfig.save();
                    clearGuildCache(guildId);
                    
                    return interaction.reply({
                        content: '✅ Anti-nuke protection has been **disabled**.',
                        ephemeral: true
                    });
                
                case 'config':
                    const { antinuke } = guildConfig;
                    
                    return interaction.reply({
                        embeds: [{
                            title: '🛡️ Anti-Nuke Configuration',
                            fields: [
                                {
                                    name: 'Status',
                                    value: antinuke.enabled ? '✅ Enabled' : '❌ Disabled',
                                    inline: true
                                },
                                {
                                    name: 'Punishment',
                                    value: antinuke.punishment.replace('_', ' ').toUpperCase(),
                                    inline: true
                                },
                                {
                                    name: 'Whitelisted Users',
                                    value: antinuke.whitelistedUsers.length.toString(),
                                    inline: true
                                },
                                {
                                    name: 'Thresholds',
                                    value: [
                                        `Max Bans: ${antinuke.maxBans}`,
                                        `Max Kicks: ${antinuke.maxKicks}`,
                                        `Max Channel Deletes: ${antinuke.maxChannelDeletes}`,
                                        `Max Role Deletes: ${antinuke.maxRoleDeletes}`,
                                        `Timeframe: ${antinuke.timeframe / 1000}s`
                                    ].join('\n')
                                }
                            ],
                            color: 0x5865F2,
                            timestamp: new Date()
                        }],
                        ephemeral: true
                    });
                
                case 'whitelist':
                    const action = interaction.options.getString('action');
                    const user = interaction.options.getUser('user');
                    
                    if (action === 'list') {
                        const whitelistedUsers = guildConfig.antinuke.whitelistedUsers;
                        
                        if (whitelistedUsers.length === 0) {
                            return interaction.reply({
                                content: '📋 No users are whitelisted.',
                                ephemeral: true
                            });
                        }
                        
                        const userList = await Promise.all(
                            whitelistedUsers.slice(0, 10).map(async userId => {
                                try {
                                    const u = await interaction.client.users.fetch(userId);
                                    return `• ${u.tag} (${userId})`;
                                } catch {
                                    return `• Unknown User (${userId})`;
                                }
                            })
                        );
                        
                        return interaction.reply({
                            embeds: [{
                                title: '📋 Whitelisted Users',
                                description: userList.join('\n'),
                                footer: {
                                    text: whitelistedUsers.length > 10 ? 'Showing first 10 users' : ''
                                },
                                color: 0x5865F2
                            }],
                            ephemeral: true
                        });
                    }
                    
                    if (!user) {
                        return interaction.reply({
                            content: '❌ Please specify a user.',
                            ephemeral: true
                        });
                    }
                    
                    if (action === 'add') {
                        if (guildConfig.antinuke.whitelistedUsers.includes(user.id)) {
                            return interaction.reply({
                                content: '❌ This user is already whitelisted.',
                                ephemeral: true
                            });
                        }
                        
                        guildConfig.antinuke.whitelistedUsers.push(user.id);
                        await guildConfig.save();
                        clearGuildCache(guildId);
                        
                        return interaction.reply({
                            content: `✅ Added **${user.tag}** to the anti-nuke whitelist.`,
                            ephemeral: true
                        });
                    }
                    
                    if (action === 'remove') {
                        if (!guildConfig.antinuke.whitelistedUsers.includes(user.id)) {
                            return interaction.reply({
                                content: '❌ This user is not whitelisted.',
                                ephemeral: true
                            });
                        }
                        
                        guildConfig.antinuke.whitelistedUsers = 
                            guildConfig.antinuke.whitelistedUsers.filter(id => id !== user.id);
                        await guildConfig.save();
                        clearGuildCache(guildId);
                        
                        return interaction.reply({
                            content: `✅ Removed **${user.tag}** from the anti-nuke whitelist.`,
                            ephemeral: true
                        });
                    }
                    
                    break;
            }
            
        } catch (error) {
            console.error('Anti-nuke command error:', error);
            return interaction.reply({
                content: '❌ An error occurred while configuring anti-nuke.',
                ephemeral: true
            });
        }
    }
};
