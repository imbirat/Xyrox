import Guild from '../models/Guild.js';

export default {
    name: 'guildDelete',
    async execute(guild, client) {
        console.log(`❌ Removed from guild: ${guild.name} (${guild.id})`);
        
        try {
            // Optionally delete guild data (or keep for when bot rejoins)
            // Uncomment below to delete data when bot is removed
            /*
            await Guild.findOneAndDelete({ guildId: guild.id });
            console.log(`🗑️ Deleted config for ${guild.name}`);
            */
            
        } catch (error) {
            console.error('Error handling guild removal:', error);
        }
    }
};
