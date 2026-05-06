import { SlashCommandBuilder, version as djsVersion } from 'discord.js';
import { platform, arch, uptime } from 'os';

const ADD_BOT_URL = 'https://discord.com/oauth2/authorize?client_id=1496858363688915115&permissions=8&integration_type=0&scope=bot';
const SUPPORT_URL = 'https://discord.gg/huXUSUeu6t';
const WEBSITE_URL = 'https://xyrox.vercel.app/';

export default {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Get information about the bot'),
    
    async execute(interaction) {
        const { client } = interaction;
        
        const formatUptime = (ms) => {
            const days = Math.floor(ms / 86400000);
            const hours = Math.floor(ms / 3600000) % 24;
            const minutes = Math.floor(ms / 60000) % 60;
            const seconds = Math.floor(ms / 1000) % 60;
            
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        };
        
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        };
        
        const totalMemory = process.memoryUsage().heapUsed;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        
        await interaction.reply({
            embeds: [{
                title: '🤖 Xyrox Bot Information',
                thumbnail: {
                    url: client.user.displayAvatarURL({ size: 256 })
                },
                fields: [
                    {
                        name: '📊 Statistics',
                        value: [
                            `**Servers:** ${client.guilds.cache.size}`,
                            `**Users:** ${totalUsers.toLocaleString()}`,
                            `**Channels:** ${client.channels.cache.size}`,
                            `**Commands:** ${client.slashCommands.size}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⏱️ Uptime',
                        value: [
                            `**Bot:** ${formatUptime(client.uptime)}`,
                            `**System:** ${formatUptime(uptime() * 1000)}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💻 System',
                        value: [
                            `**Platform:** ${platform()}`,
                            `**Architecture:** ${arch()}`,
                            `**Memory:** ${formatBytes(totalMemory)}`,
                            `**Node.js:** ${process.version}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔧 Versions',
                        value: [
                            `**Discord.js:** v${djsVersion}`,
                            `**Bot Version:** v1.0.0`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🌐 Links',
                        value: `[Website](${WEBSITE_URL}) • [Support](${SUPPORT_URL}) • [Invite](${ADD_BOT_URL})`,
                        inline: true
                    },
                    {
                        name: '📝 Features',
                        value: '• AutoMod System\n• Anti-Nuke Protection\n• Logging\n• Custom Commands\n• Reaction Roles\n• Ticket System',
                        inline: true
                    }
                ],
                color: 0x5865F2,
                footer: {
                    text: 'Made with ❤️ by Xyrox Team'
                },
                timestamp: new Date()
            }]
        });
    }
};
