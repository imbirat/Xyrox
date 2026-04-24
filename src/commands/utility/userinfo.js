import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user')
        .addUserOption(option =>
            option.setName('user').setDescription('User to get information about').setRequired(false)
        ),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        if (!member) {
            return interaction.reply({ content: '❌ Could not find that member in this server.', ephemeral: true });
        }
        
        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, 10);
        
        const roleString = roles.length > 0 ? roles.join(', ') : 'No roles';
        const moreRoles = member.roles.cache.size - 11 > 0 ? `\n+${member.roles.cache.size - 11} more` : '';
        
        const badges = [];
        if (user.flags) {
            const userFlags = user.flags.toArray();
            const flagEmojis = {
                'Staff': '👨‍💼',
                'Partner': '🤝',
                'Hypesquad': '🎉',
                'BugHunterLevel1': '🐛',
                'BugHunterLevel2': '🐛🐛',
                'HypeSquadOnlineHouse1': '🏠',
                'HypeSquadOnlineHouse2': '🏠',
                'HypeSquadOnlineHouse3': '🏠',
                'PremiumEarlySupporter': '⭐',
                'VerifiedDeveloper': '✅',
                'CertifiedModerator': '🛡️'
            };
            userFlags.forEach(flag => {
                if (flagEmojis[flag]) badges.push(flagEmojis[flag]);
            });
        }
        
        await interaction.reply({
            embeds: [{
                title: `👤 ${user.username}`,
                thumbnail: {
                    url: user.displayAvatarURL({ extension: 'gif', forceStatic: false, size: 1024 })
                },
                fields: [
                    { name: '🆔 User ID', value: user.id, inline: true },
                    { name: '📛 Nickname', value: member.nickname || 'None', inline: true },
                    { name: '🎨 Color', value: member.displayHexColor, inline: true },
                    { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: '🏆 Highest Role', value: member.roles.highest.toString(), inline: true },
                    { name: `🎭 Roles [${member.roles.cache.size - 1}]`, value: roleString + moreRoles }
                ],
                color: member.displayColor || 0x5865F2,
                footer: { text: badges.length > 0 ? `Badges: ${badges.join(' ')}` : '' },
                timestamp: new Date()
            }]
        });
    }
};
