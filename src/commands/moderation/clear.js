import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages in a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false)
        ),
    
    permissions: [PermissionFlagsBits.ManageMessages],
    
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            let messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
            
            // Filter by user if specified
            if (targetUser) {
                messages = messages.filter(msg => msg.author.id === targetUser.id);
            }
            
            // Filter messages older than 14 days (Discord API limitation)
            const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            messages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            
            if (messages.size === 0) {
                return interaction.editReply({
                    content: '❌ No messages found to delete (messages must be less than 14 days old).'
                });
            }
            
            // Bulk delete messages
            const deleted = await interaction.channel.bulkDelete(messages, true);
            
            const response = targetUser
                ? `✅ Deleted **${deleted.size}** messages from **${targetUser.tag}**.`
                : `✅ Deleted **${deleted.size}** messages.`;
            
            await interaction.editReply({ content: response });
            
            // Delete confirmation after 5 seconds
            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Clear command error:', error);
            return interaction.editReply({
                content: '❌ Failed to delete messages. Please check my permissions.'
            });
        }
    }
};
