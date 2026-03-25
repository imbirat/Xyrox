// ---------------------------- IMPORTS ----------------------------
const { 
  Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
  PermissionsBitField, EmbedBuilder, InteractionType
} = require('discord.js');
const express = require('express');
const fs = require('fs');

// ---------------------------- EXPRESS SERVER ----------------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(PORT, () => console.log(`Express server running on port ${PORT}`));

// ---------------------------- CLIENT ----------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const PREFIX = "?";

// ---------------------------- DATA FILES ----------------------------
const LEVELS_FILE = './levels.json';
const WARNINGS_FILE = './warnings.json';
const XPCHANNELS_FILE = './xpChannels.json';
const AFK_FILE = './afk.json';
const AUTOROLE_FILE = './autoroles.json';
const WELCOME_FILE = './welcome.json';

let levels = fs.existsSync(LEVELS_FILE) ? JSON.parse(fs.readFileSync(LEVELS_FILE)) : {};
let warnings = fs.existsSync(WARNINGS_FILE) ? JSON.parse(fs.readFileSync(WARNINGS_FILE)) : {};
let xpChannels = fs.existsSync(XPCHANNELS_FILE) ? JSON.parse(fs.readFileSync(XPCHANNELS_FILE)) : {};
let afkData = fs.existsSync(AFK_FILE) ? JSON.parse(fs.readFileSync(AFK_FILE)) : {};
let autoRoles = fs.existsSync(AUTOROLE_FILE) ? JSON.parse(fs.readFileSync(AUTOROLE_FILE)) : {};
let welcomeChannels = fs.existsSync(WELCOME_FILE) ? JSON.parse(fs.readFileSync(WELCOME_FILE)) : {};

function saveData() {
  fs.writeFileSync(LEVELS_FILE, JSON.stringify(levels, null, 2));
  fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));
  fs.writeFileSync(XPCHANNELS_FILE, JSON.stringify(xpChannels, null, 2));
  fs.writeFileSync(AFK_FILE, JSON.stringify(afkData, null, 2));
  fs.writeFileSync(AUTOROLE_FILE, JSON.stringify(autoRoles, null, 2));
  fs.writeFileSync(WELCOME_FILE, JSON.stringify(welcomeChannels, null, 2));
}

// ---------------------------- SLASH COMMANDS ----------------------------
const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Shows all bot commands"),
  new SlashCommandBuilder().setName("ping").setDescription("Check bot latency"),
  new SlashCommandBuilder().setName("afk").setDescription("Set yourself as AFK")
    .addStringOption(o => o.setName("reason").setDescription("Reason for going AFK")),
  new SlashCommandBuilder().setName("level").setDescription("Check your level/profile")
    .addUserOption(o => o.setName("user").setDescription("Check someone else's profile")),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Shows top 10 users by level"),
  new SlashCommandBuilder().setName("addxp").setDescription("Add XP to a user")
    .addUserOption(o => o.setName("user").setDescription("User to add XP").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("XP amount").setRequired(true)),
  new SlashCommandBuilder().setName("removexp").setDescription("Remove XP from a user")
    .addUserOption(o => o.setName("user").setDescription("User to remove XP").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("XP amount").setRequired(true)),
  new SlashCommandBuilder().setName("kick").setDescription("Kick a member (admin only)")
    .addUserOption(o => o.setName("user").setDescription("User to kick").setRequired(true)),
  new SlashCommandBuilder().setName("ban").setDescription("Ban a member (admin only)")
    .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true)),
  new SlashCommandBuilder().setName("mute").setDescription("Mute a member temporarily (admin only)")
    .addUserOption(o => o.setName("user").setDescription("User to mute").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes").setRequired(true)),
  new SlashCommandBuilder().setName("unmute").setDescription("Unmute a member manually (admin only)")
    .addUserOption(o => o.setName("user").setDescription("User to unmute").setRequired(true)),
  new SlashCommandBuilder().setName("warn").setDescription("Warn a member (admin only)")
    .addUserOption(o => o.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
  new SlashCommandBuilder().setName("warnings").setDescription("Check warnings for a user")
    .addUserOption(o => o.setName("user").setDescription("User to check").setRequired(true)),
  new SlashCommandBuilder().setName("announce").setDescription("Make an announcement (admin only)")
    .addStringOption(o => o.setName("message").setDescription("Message to announce").setRequired(true)),
  new SlashCommandBuilder().setName("setautorole").setDescription("Set role to auto-assign to new members")
    .addRoleOption(o => o.setName("role").setDescription("Role to auto-assign").setRequired(true)),
  new SlashCommandBuilder().setName("setwelcome").setDescription("Set welcome channel (admin only)")
    .addChannelOption(o => o.setName("channel").setDescription("Channel for welcome messages").setRequired(true)),
  new SlashCommandBuilder().setName("setxpchannel").setDescription("Set channel for level-up messages")
    .addChannelOption(o => o.setName("channel").setDescription("Channel for level-up messages").setRequired(true)),
  new SlashCommandBuilder().setName("rules").setDescription("Show server rules"),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log("Registering global commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Slash commands registered globally!");
  } catch (err) { console.error(err); }
})();

// ---------------------------- READY ----------------------------
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({ status: 'online', activities: [{ name: '?help | Xyrix', type: 0 }] });
});

// ---------------------------- WELCOME + AUTO-ROLE ----------------------------
client.on("guildMemberAdd", member => {
  const roleId = autoRoles[member.guild.id];
  if(roleId){ const role = member.guild.roles.cache.get(roleId); if(role) member.roles.add(role).catch(console.error); }

  const channelId = welcomeChannels[member.guild.id];
  if(!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if(!channel) return;

  const embed = new EmbedBuilder()
    .setColor('#2f3136')
    .setTitle(`Welcome ${member.user}!`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`Welcome to ${member.guild.name}! Read rules and enjoy.`)
    .setFooter({ text: `We have ${member.guild.memberCount} members now!` })
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

// ---------------------------- HELPERS ----------------------------
async function fetchUser(arg, guild) { return guild.members.cache.get(arg)?.user; }

// ---------------------------- PREFIX COMMAND HANDLER ----------------------------
client.on("messageCreate", async message => {
  if(message.author.bot) return;
  const guild = message.guild;
  const member = message.member;

  // ----- AFK & LEVELING -----
  if(afkData[message.author.id]) { delete afkData[message.author.id]; saveData(); message.channel.send(`✅ Welcome back ${message.author.tag}, AFK removed.`); }
  message.mentions.users.forEach(user => { if(afkData[user.id]) message.channel.send(`⚠️ ${user.tag} is currently AFK: ${afkData[user.id]}`); });

  if(!levels[guild.id]) levels[guild.id] = {};
  if(!levels[guild.id][message.author.id]) levels[guild.id][message.author.id] = { xp:0, level:1 };
  const data = levels[guild.id][message.author.id];
  const xpGain = Math.floor(Math.random()*10)+5;
  data.xp += xpGain;
  const nextLevelXP = data.level*100;
  if(data.xp >= nextLevelXP){
    data.level++;
    data.xp -= nextLevelXP;
    const lvlChannelId = xpChannels[guild.id]?.[0] || message.channel.id;
    const lvlChannel = guild.channels.cache.get(lvlChannelId);
    if(lvlChannel) lvlChannel.send(`🎉 Congrats ${message.author}! You reached level ${data.level}!`);
  }
  saveData();

  if(!message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

  // ----------------- COMMANDS -----------------
  const commandHandlers = {
    ping: async () => { const msg = await message.channel.send("🏓 Pinging..."); msg.edit(`🏓 Pong! ${msg.createdTimestamp - message.createdTimestamp}ms`); },
    rules: async () => { 
      const rulesChannel = guild.channels.cache.find(ch=>ch.name.toLowerCase()==="rules"); 
      message.channel.send({ embeds:[new EmbedBuilder().setTitle("📜 Server Rules").setColor("Blue")
        .setDescription(rulesChannel ? `Please read ${rulesChannel}` : "Follow general guidelines") ]});
    },
    help: async () => { message.channel.send({ embeds:[new EmbedBuilder().setTitle("🤖 Bot Commands").setColor("Blue")
      .addFields(
        { name: "Utility", value: "`?help`, `?ping`, `?afk <reason>`" },
        { name: "Levels", value: "`?level [user]`, `?leaderboard`, `?addxp @user <amount>`, `?removexp @user <amount>`" },
        { name: "Moderation", value: "`?kick`, `?ban`, `?mute`, `?unmute`, `?warn`, `?warnings`, `?announce`" },
        { name: "Server Setup", value: "`?setautorole <role>`, `?setwelcome <channel>`, `?setxpchannel <channel>`" }
      )] }); 
    }
    // Add all other commands here following prefix pattern...
  };
  
  if(commandHandlers[cmd]) return commandHandlers[cmd]();
});

// ---------------------------- SLASH COMMAND HANDLER ----------------------------
client.on("interactionCreate", async interaction => {
  if(interaction.type !== InteractionType.ApplicationCommand) return;
  const { commandName, options, member, guild } = interaction;
  const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

  // ----------------- COMMANDS -----------------
  if(commandName==="help") return interaction.reply({ embeds:[new EmbedBuilder().setTitle("🤖 Bot Commands").setColor("Blue")], ephemeral:true });
  if(commandName==="rules") {
    const rulesChannel = guild.channels.cache.find(ch=>ch.name.toLowerCase()==="rules");
    return interaction.reply({ embeds:[new EmbedBuilder().setTitle("📜 Server Rules").setColor("Blue")
      .setDescription(rulesChannel ? `Please read ${rulesChannel}` : "Follow general guidelines")], ephemeral:true });
  }

  // Add all other slash command logic similar to prefix commands...
});

// ---------------------------- LOGIN ----------------------------
client.login(TOKEN);
