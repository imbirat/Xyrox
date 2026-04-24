import { ActivityType } from 'discord.js';

export default {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`✅ Logged in as ${client.user.tag}`);
        console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
        console.log(`👥 Watching ${client.users.cache.size} users`);
        
        // Set bot presence - always Watching /help | Xyrox
        client.user.setPresence({
            activities: [{
                name: '/help | Xyrox',
                type: ActivityType.Watching
            }],
            status: 'online'
        });
        
        // Rotate presence every 30 minutes (all Watching type)
        setInterval(() => {
            const activities = [
                { name: '/help | Xyrox', type: ActivityType.Watching },
                { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
                { name: 'AutoMod Active 🛡️', type: ActivityType.Watching }
            ];
            
            const activity = activities[Math.floor(Math.random() * activities.length)];
            client.user.setPresence({
                activities: [activity],
                status: 'online'
            });
        }, 1800000); // 30 minutes
    }
};
