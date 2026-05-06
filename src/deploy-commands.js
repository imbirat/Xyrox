import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// Load all command files
const commandFolders = readdirSync(join(__dirname, 'commands'));

for (const folder of commandFolders) {
    const commandFiles = readdirSync(join(__dirname, 'commands', folder))
        .filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = await import(`./commands/${folder}/${file}`);
        if (command.default?.data) {
            commands.push(command.default.data.toJSON());
            console.log(`✅ Loaded: ${command.default.data.name}`);
        }
    }
}

// Deploy commands
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log(`\n🚀 Started refreshing ${commands.length} application (/) commands.`);

        // Register commands globally
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.\n`);
        
        // List deployed commands
        console.log('📋 Deployed Commands:');
        data.forEach(cmd => {
            console.log(`   - /${cmd.name}: ${cmd.description}`);
        });
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();
