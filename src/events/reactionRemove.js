import reactionRoleHandler from '../handlers/reactionRoleHandler.js';
import { getGuildConfig } from '../middleware/commandHandler.js';

export default {
    name: 'messageReactionRemove',
    async execute(reaction, user, client) {
        if (user.bot) return;
        if (reaction.partial) {
            try { await reaction.fetch(); } catch { return; }
        }
        if (!reaction.message.guild) return;
        const config = await getGuildConfig(reaction.message.guild.id);
        await reactionRoleHandler.handleReaction(reaction, user, config, true);
    }
};
