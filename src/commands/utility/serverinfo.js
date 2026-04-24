import { SlashCommandBuilder, ChannelType } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the server'),
    
    async execute(interaction) {
        const { guild } = interaction;
        
        const owner = await guild.fetchOwner();
        const channels = guild.channels.cache;
        const roles = guild.roles.cache;
        
        const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
        const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;
        
        const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
        
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };
        
        await interaction.reply({
            embeds: [{
                title: `📊 ${guild.name}`,
                thumbnail: {
                    url: guild.iconURL({ extension: 'gif', forceStatic: false, size: 1024 }) || ''
                },
                fields: [
                    { name: '👑 Owner', value: owner.user.username, inline: true },
                    { name: '🆔 Server ID', value: guild.id, inline: true },
                    { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '👥 Members', value: `${guild.memberCount} total\n${onlineMembers} online`, inline: true },
                    { name: '📢 Channels', value: `${textChannels} Text\n${voiceChannels} Voice\n${categories} Categories`, inline: true },
                    { name: '🎭 Roles', value: roles.size.toString(), inline: true },
                    { name: '😊 Emojis', value: guild.emojis.cache.size.toString(), inline: true },
                    { name: '🔒 Verification Level', value: verificationLevels[guild.verificationLevel], inline: true },
                    { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount || 0} boosts (Tier ${guild.premiumTier})`, inline: true }
                ],
                color: 0x5865F2,
                timestamp: new Date()
            }]
        });
    }
};
