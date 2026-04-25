import { ActivityType } from 'discord.js';

export default {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`✅ Logged in as ${client.user.tag}`);
        console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
        console.log(`👥 Watching ${client.users.cache.size} users`);
        
        // Set bot presence - FIXED: Always shows "/help | Xyrox" without changing
        client.user.setPresence({
            activities: [{
                name: '/help | Xyrox',
                type: ActivityType.Watching
            }],
            status: 'online'
        });
        
        console.log('🎮 Activity set to: Watching /help | Xyrox');
        
        // Optional: Re-set every hour to ensure it stays (in case Discord resets it)
        setInterval(() => {
            client.user.setPresence({
                activities: [{
                    name: '/help | Xyrox',
                    type: ActivityType.Watching
                }],
                status: 'online'
            });
            console.log('🔄 Activity refreshed: Watching /help | Xyrox');
        }, 3600000); // 1 hour
    }
};
