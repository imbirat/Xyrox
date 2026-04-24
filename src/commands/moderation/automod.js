import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Guild from '../../models/Guild.js';
import { clearGuildCache } from '../../middleware/commandHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure AutoMod system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable AutoMod system')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable AutoMod system')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('View AutoMod configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggle specific AutoMod rule')
                .addStringOption(option =>
                    option
                        .setName('rule')
                        .setDescription('Rule to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Anti-Spam', value: 'antiSpam' },
                            { name: 'Anti-Caps', value: 'antiCaps' },
                            { name: 'Anti-Links', value: 'antiLinks' },
                            { name: 'Anti-Invites', value: 'antiInvites' },
                            { name: 'Anti-Mention Spam', value: 'antiMentionSpam' },
                            { name: 'Anti-Bad Words', value: 'antiBadWords' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('punishment')
                .setDescription('Set punishment for AutoMod violations')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of punishment')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Mute', value: 'mute' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('addword')
                .setDescription('Add a word to bad words filter')
                .addStringOption(option =>
                    option
                        .setName('word')
                        .setDescription('Word to add to filter')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removeword')
                .setDescription('Remove a word from bad words filter')
                .addStringOption(option =>
                    option
                        .setName('word')
                        .setDescription('Word to remove from filter')
                        .setRequired(true)
                )
        ),
    
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 3,
    
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
                    guildConfig.automod.enabled = true;
                    await guildConfig.save();
                    clearGuildCache(guildId);
                    
                    // Emit to dashboard
                    interaction.client.io.emit('automod-updated', {
                        guildId,
                        enabled: true
                    });
                    
                    return interaction.reply({
                        content: '✅ AutoMod system has been **enabled**!',
                        ephemeral: true
                    });
                
                case 'disable':
                    guildConfig.automod.enabled = false;
                    await guildConfig.save();
                    clearGuildCache(guildId);
                    
                    interaction.client.io.emit('automod-updated', {
                        guildId,
                        enabled: false
                    });
                    
                    return interaction.reply({
                        content: '✅ AutoMod system has been **disabled**.',
                        ephemeral: true
                    });
                
                case 'config':
                    const { automod } = guildConfig;
                    const embed = {
                        title: '🛡️ AutoMod Configuration',
                        color: 0x5865F2,
                        fields: [
                            {
                                name: 'Status',
                                value: automod.enabled ? '✅ Enabled' : '❌ Disabled',
                                inline: true
                            },
                            {
                                name: 'Punishment',
                                value: automod.punishment.toUpperCase(),
                                inline: true
                            },
                            {
                                name: 'Max Warnings',
                                value: automod.maxWarnings.toString(),
                                inline: true
                            },
                            {
                                name: 'Active Rules',
                                value: [
                                    automod.antiSpam ? '✅ Anti-Spam' : '❌ Anti-Spam',
                                    automod.antiCaps ? '✅ Anti-Caps' : '❌ Anti-Caps',
                                    automod.antiLinks ? '✅ Anti-Links' : '❌ Anti-Links',
                                    automod.antiInvites ? '✅ Anti-Invites' : '❌ Anti-Invites',
                                    automod.antiMentionSpam ? '✅ Anti-Mention Spam' : '❌ Anti-Mention Spam',
                                    automod.antiBadWords ? '✅ Anti-Bad Words' : '❌ Anti-Bad Words'
                                ].join('\n')
                            },
                            {
                                name: 'Bad Words Filter',
                                value: automod.badWords.length > 0 
                                    ? `${automod.badWords.length} words filtered`
                                    : 'No words filtered'
                            }
                        ],
                        footer: {
                            text: 'Configure more settings in the dashboard'
                        }
                    };
                    
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                
                case 'toggle':
                    const rule = interaction.options.getString('rule');
                    guildConfig.automod[rule] = !guildConfig.automod[rule];
                    await guildConfig.save();
                    clearGuildCache(guildId);
                    
                    const ruleNames = {
                        antiSpam: 'Anti-Spam',
                        antiCaps: 'Anti-Caps',
                        antiLinks: 'Anti-Links',
                        antiInvites: 'Anti-Invites',
                        antiMentionSpam: 'Anti-Mention Spam',
                        antiBadWords: 'Anti-Bad Words'
                    };
                    
                    return interaction.reply({
                        content: `✅ **${ruleNames[rule]}** has been ${guildConfig.automod[rule] ? 'enabled' : 'disabled'}.`,
                        ephemeral: true
                    });
                
                case 'punishment':
                    const punishmentType = interaction.options.getString('type');
                    guildConfig.automod.punishment = punishmentType;
                    await guildConfig.save();
                    clearGuildCache(guildId);
                    
                    return interaction.reply({
                        content: `✅ AutoMod punishment set to **${punishmentType.toUpperCase()}**.`,
                        ephemeral: true
                    });
                
                case 'addword':
                    const wordToAdd = interaction.options.getString('word').toLowerCase();
                    
                    if (guildConfig.automod.badWords.includes(wordToAdd)) {
                        return interaction.reply({
                            content: '❌ This word is already in the filter.',
                            ephemeral: true
                        });
                    }
                    
                    guildConfig.automod.badWords.push(wordToAdd);
                    await guildConfig.save();
                    clearGuildCache(guildId);
                    
                    return interaction.reply({
                        content: `✅ Added "**${wordToAdd}**" to bad words filter.`,
                        ephemeral: true
                    });
                
                case 'removeword':
                    const wordToRemove = interaction.options.getString('word').toLowerCase();
                    
                    if (!guildConfig.automod.badWords.includes(wordToRemove)) {
                        return interaction.reply({
                            content: '❌ This word is not in the filter.',
                            ephemeral: true
                        });
                    }
                    
                    guildConfig.automod.badWords = guildConfig.automod.badWords.filter(
                        w => w !== wordToRemove
                    );
                    await guildConfig.save();
                    clearGuildCache(guildId);
                    
                    return interaction.reply({
                        content: `✅ Removed "**${wordToRemove}**" from bad words filter.`,
                        ephemeral: true
                    });
            }
            
        } catch (error) {
            console.error('AutoMod command error:', error);
            return interaction.reply({
                content: '❌ An error occurred while configuring AutoMod.',
                ephemeral: true
            });
        }
    }
};
