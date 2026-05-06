import Guild from '../models/Guild.js';

export default {
    name: 'guildCreate',
    async execute(guild, client) {
        console.log(`✅ Joined new guild: ${guild.name} (${guild.id})`);
        
        try {
            // Create default configuration for new guild
            await Guild.create({
                guildId: guild.id,
                guildName: guild.name,
                commandMode: 'slash',
                prefix: '?'
            });
            
            console.log(`📝 Created default config for ${guild.name}`);
            
            // Send welcome message to server owner or first text channel
            const owner = await guild.fetchOwner();
            
            const welcomeEmbed = {
                title: '👋 Thanks for adding Xyrox!',
                description: 'Xyrox is now ready to help manage your server.',
                fields: [
                    {
                        name: '🚀 Getting Started',
                        value: 'Use `/help` to see all available commands'
                    },
                    {
                        name: '🛡️ AutoMod',
                        value: 'Use `/automod enable` to activate automatic moderation'
                    },
                    {
                        name: '🌐 Dashboard',
                        value: '[Configure via Dashboard](https://dashboard.xyrox.bot)'
                    },
                    {
                        name: '💬 Support',
                        value: '[Join our Support Server](https://discord.gg/xyrox)'
                    }
                ],
                color: 0x5865F2,
                footer: {
                    text: 'Made with ❤️ by Xyrox Team'
                }
            };
            
            // Try to send DM to owner
            try {
                await owner.send({ embeds: [welcomeEmbed] });
            } catch (error) {
                // If DM fails, send to first available text channel
                const channel = guild.channels.cache.find(
                    ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages')
                );
                
                if (channel) {
                    await channel.send({ embeds: [welcomeEmbed] });
                }
            }
            
        } catch (error) {
            console.error('Error handling guild join:', error);
        }
    }
};
