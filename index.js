const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  PermissionsBitField, 
  EmbedBuilder
} = require('discord.js');
const express = require('express');
const fs = require('fs');

// ---------- EXPRESS ----------
const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(3000, () => console.log("Express server running"));

// ---------- CLIENT ----------
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

// ---------- DATA FILES ----------
const LEVELS_FILE    = './levels.json';
const WARNINGS_FILE  = './warnings.json';
const XPCHANNELS_FILE= './xpChannels.json';
const AFK_FILE       = './afk.json';
const AUTOROLE_FILE  = './autoroles.json';
const WELCOME_FILE   = './welcome.json';
const ECON_FILE      = './economy.json';
const SHOP_FILE      = './shop.json';
const AUTOMOD_FILE   = './automod.json';

let levels         = fs.existsSync(LEVELS_FILE)    ? JSON.parse(fs.readFileSync(LEVELS_FILE))    : {};
let warnings       = fs.existsSync(WARNINGS_FILE)  ? JSON.parse(fs.readFileSync(WARNINGS_FILE))  : {};
let xpChannels     = fs.existsSync(XPCHANNELS_FILE)? JSON.parse(fs.readFileSync(XPCHANNELS_FILE)): {};
let afkData        = fs.existsSync(AFK_FILE)       ? JSON.parse(fs.readFileSync(AFK_FILE))       : {};
let autoRoles      = fs.existsSync(AUTOROLE_FILE)  ? JSON.parse(fs.readFileSync(AUTOROLE_FILE))  : {};
let welcomeChannels= fs.existsSync(WELCOME_FILE)   ? JSON.parse(fs.readFileSync(WELCOME_FILE))   : {};
let economy        = fs.existsSync(ECON_FILE)      ? JSON.parse(fs.readFileSync(ECON_FILE))      : {};
let shop           = fs.existsSync(SHOP_FILE)      ? JSON.parse(fs.readFileSync(SHOP_FILE))      : {};

// automod structure per guild:
// { enabled, logChannel, blockedWords[], blockLinks, spamLimit }
let automodConfig  = fs.existsSync(AUTOMOD_FILE)   ? JSON.parse(fs.readFileSync(AUTOMOD_FILE))   : {};

// ---------- SAVE FUNCTIONS ----------
function saveData(){
  fs.writeFileSync(LEVELS_FILE,    JSON.stringify(levels, null, 2));
  fs.writeFileSync(WARNINGS_FILE,  JSON.stringify(warnings, null, 2));
  fs.writeFileSync(XPCHANNELS_FILE,JSON.stringify(xpChannels, null, 2));
  fs.writeFileSync(AFK_FILE,       JSON.stringify(afkData, null, 2));
  fs.writeFileSync(AUTOROLE_FILE,  JSON.stringify(autoRoles, null, 2));
  fs.writeFileSync(WELCOME_FILE,   JSON.stringify(welcomeChannels, null, 2));
}
function saveEconomy()  { fs.writeFileSync(ECON_FILE,    JSON.stringify(economy, null, 2)); }
function saveShop()     { fs.writeFileSync(SHOP_FILE,    JSON.stringify(shop, null, 2)); }
function saveAutomod()  { fs.writeFileSync(AUTOMOD_FILE, JSON.stringify(automodConfig, null, 2)); }
function ensureUser(id) { if(!economy[id]) economy[id] = { cash:0, lastDaily:0, inventory:[] }; }

// ---------- AUTOMOD HELPERS ----------
function getAutomod(guildId) {
  if (!automodConfig[guildId]) {
    automodConfig[guildId] = {
      enabled: false,
      logChannel: null,
      blockedWords: [],
      blockLinks: false,
      spamLimit: 5
    };
  }
  return automodConfig[guildId];
}

// Spam tracker: guildId -> userId -> [timestamps]
const spamTracker = new Map();

function trackSpam(guildId, userId) {
  const key = `${guildId}:${userId}`;
  const now = Date.now();
  if (!spamTracker.has(key)) spamTracker.set(key, []);
  const times = spamTracker.get(key).filter(t => now - t < 5000);
  times.push(now);
  spamTracker.set(key, times);
  return times.length;
}

async function sendAutomodLog(guild, embed, cfg) {
  if (!cfg.logChannel) return;
  const ch = guild.channels.cache.get(cfg.logChannel);
  if (ch) ch.send({ embeds: [embed] }).catch(() => {});
}

// ---------- SLASH COMMANDS ----------
const commands = [
  // --- Basic ---
  new SlashCommandBuilder().setName("help").setDescription("Shows all bot commands"),
  new SlashCommandBuilder().setName("ping").setDescription("Check bot latency"),
  new SlashCommandBuilder().setName("afk").setDescription("Set yourself as AFK").addStringOption(o=>o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("level").setDescription("Check your level/profile").addUserOption(o=>o.setName("user").setDescription("User to check")),

  // --- XP Commands ---
  new SlashCommandBuilder().setName("addxp").setDescription("Add XP to a user")
    .addUserOption(o=>o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o=>o.setName("amount").setDescription("XP").setRequired(true)),
  new SlashCommandBuilder().setName("removexp").setDescription("Remove XP from a user")
    .addUserOption(o=>o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o=>o.setName("amount").setDescription("XP").setRequired(true)),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Top 10 users by level"),
  new SlashCommandBuilder().setName("setxpchannel").setDescription("Set channel where level-up notifications are sent").addChannelOption(o=>o.setName("channel").setDescription("Notification channel").setRequired(true)),
  new SlashCommandBuilder().setName("setautorole").setDescription("Set auto role").addRoleOption(o=>o.setName("role").setDescription("Role").setRequired(true)),
  new SlashCommandBuilder().setName("setwelcome").setDescription("Set welcome channel").addChannelOption(o=>o.setName("channel").setDescription("Channel").setRequired(true)),

  // --- Moderation ---
  new SlashCommandBuilder().setName("clear").setDescription("Delete messages from a channel")
    .addIntegerOption(o=>o.setName("amount").setDescription("Number of messages to delete (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName("announce").setDescription("Make an announcement").addStringOption(o=>o.setName("message").setDescription("Message").setRequired(true)),
  new SlashCommandBuilder().setName("kick").setDescription("Kick user").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("ban").setDescription("Ban user").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("warn").setDescription("Warn user").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(true)),
  new SlashCommandBuilder().setName("warnings").setDescription("Check warnings").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("mute").setDescription("Mute user").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true)).addIntegerOption(o=>o.setName("minutes").setDescription("Minutes").setRequired(true)),
  new SlashCommandBuilder().setName("unmute").setDescription("Unmute user").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true)),

  // --- Economy ---
  new SlashCommandBuilder().setName("cash").setDescription("Check your cash").addUserOption(o=>o.setName("user").setDescription("User")),
  new SlashCommandBuilder().setName("daily").setDescription("Claim daily reward"),
  new SlashCommandBuilder().setName("give").setDescription("Give cash").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true)).addIntegerOption(o=>o.setName("amount").setDescription("Amount").setRequired(true)),
  new SlashCommandBuilder().setName("fish").setDescription("Go fishing for cash"),
  new SlashCommandBuilder().setName("rob").setDescription("Rob another user").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("gamble").setDescription("Gamble cash").addIntegerOption(o=>o.setName("amount").setDescription("Amount").setRequired(true)),
  new SlashCommandBuilder().setName("shop").setDescription("View shop items"),
  new SlashCommandBuilder().setName("buy").setDescription("Buy an item from the shop").addStringOption(o=>o.setName("item").setDescription("Item name").setRequired(true)),

  // --- Auto Mod ---
  new SlashCommandBuilder().setName("automod").setDescription("Configure auto-moderation")
    .addSubcommand(sub => sub.setName("enable").setDescription("Enable auto-mod"))
    .addSubcommand(sub => sub.setName("disable").setDescription("Disable auto-mod"))
    .addSubcommand(sub => sub.setName("addword").setDescription("Add a blocked word")
      .addStringOption(o => o.setName("word").setDescription("Word to block").setRequired(true)))
    .addSubcommand(sub => sub.setName("removeword").setDescription("Remove a blocked word")
      .addStringOption(o => o.setName("word").setDescription("Word to unblock").setRequired(true)))
    .addSubcommand(sub => sub.setName("listwords").setDescription("List all blocked words"))
    .addSubcommand(sub => sub.setName("setlog").setDescription("Set the auto-mod log channel")
      .addChannelOption(o => o.setName("channel").setDescription("Log channel").setRequired(true)))
    .addSubcommand(sub => sub.setName("setspam").setDescription("Set spam message limit (per 5s)")
      .addIntegerOption(o => o.setName("limit").setDescription("Message limit (default 5)").setRequired(true).setMinValue(2).setMaxValue(20)))
    .addSubcommand(sub => sub.setName("setlinks").setDescription("Toggle Discord invite link blocking")
      .addBooleanOption(o => o.setName("enabled").setDescription("true = block links").setRequired(true)))
    .addSubcommand(sub => sub.setName("status").setDescription("Show current auto-mod settings")),

].map(cmd => cmd.toJSON());

// ---------- REGISTER COMMANDS ----------
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log("Registering commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("Commands registered!");
  } catch(err) { console.error(err); }
})();

// ---------- READY ----------
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({ status: 'idle', activities:[{ name: '/help | Xyrox', type: 0 }] });
});

// ---------- HELPER FUNCTIONS ----------
const xpCooldowns = new Map();

function addXP(guildId, userId, amount) {
  if(!levels[guildId]) levels[guildId] = {};
  if(!levels[guildId][userId]) levels[guildId][userId] = { xp:0, level:1 };
  const userData = levels[guildId][userId];
  userData.xp += amount;
  const xpNeeded = userData.level * 100;
  if(userData.xp >= xpNeeded){
    userData.level++;
    userData.xp -= xpNeeded;
    saveData();
    return true;
  }
  saveData();
  return false;
}

function xpOnCooldown(userId) {
  const now = Date.now();
  const last = xpCooldowns.get(userId) || 0;
  if(now - last < 60000) return true;
  xpCooldowns.set(userId, now);
  return false;
}

// ---------- WELCOME EVENT ----------
client.on("guildMemberAdd", async member => {
  const guildId = member.guild.id;
  if(autoRoles[guildId]){
    const role = member.guild.roles.cache.get(autoRoles[guildId]);
    if(role) member.roles.add(role).catch(console.error);
  }
  if(!welcomeChannels[guildId]) return;
  const channel = member.guild.channels.cache.get(welcomeChannels[guildId]);
  if(!channel) return;
  const memberCount = member.guild.memberCount;
  const welcomeEmbed = new EmbedBuilder()
    .setColor("Gold")
    .setTitle(`🎉 WELCOME ${member.user.username}! 🎉`)
    .setDescription(
      `✨ ───────────────── ✨\n` +
      `🔥 You joined **${member.guild.name}**\n` +
      `💎 Enjoy your stay & have fun!\n\n` +
      `🚀 Start chatting now\n` +
      `📜 Read the rules\n` +
      `🎯 Get your roles\n\n` +
      `👥 Member #${memberCount}\n\n` +
      `✨ ───────────────── ✨\n\n` +
      `💥 We're glad to have you here! 💥`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setFooter({ text: `Member #${memberCount} • ${new Date(member.joinedTimestamp).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}, ${new Date(member.joinedTimestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` })
    .setTimestamp(member.joinedAt);
  channel.send({ embeds: [welcomeEmbed] });
});

// ---------- MESSAGE EVENT (XP + AFK + prefix + AUTO-MOD) ----------
client.on("messageCreate", async message => {
  if(message.author.bot) return;
  if(!message.guild) return;

  const guildId = message.guild.id;
  const userId  = message.author.id;
  const cfg     = getAutomod(guildId);

  // ---- AUTO-MOD CHECKS ----
  if(cfg.enabled && !message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)){

    // 1) Blocked words
    const lowerContent = message.content.toLowerCase();
    const foundWord = cfg.blockedWords.find(w => lowerContent.includes(w.toLowerCase()));
    if(foundWord){
      await message.delete().catch(() => {});
      // Issue auto-warning
      if(!warnings[guildId]) warnings[guildId] = {};
      if(!warnings[guildId][userId]) warnings[guildId][userId] = [];
      warnings[guildId][userId].push({ reason: `[AutoMod] Blocked word: "${foundWord}"`, date: new Date().toISOString() });
      saveData();
      const warnEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🚫 AutoMod — Blocked Word")
        .addFields(
          { name: "User", value: `${message.author} (${message.author.tag})`, inline: true },
          { name: "Channel", value: `${message.channel}`, inline: true },
          { name: "Trigger", value: `\`${foundWord}\``, inline: true },
          { name: "Message", value: message.content.slice(0, 200) || "—" }
        )
        .setTimestamp();
      await sendAutomodLog(message.guild, warnEmbed, cfg);
      message.channel.send(`⚠️ ${message.author}, your message was removed — it contained a blocked word.`)
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      return;
    }

    // 2) Spam detection
    const msgCount = trackSpam(guildId, userId);
    if(msgCount >= cfg.spamLimit){
      // Delete recent messages from this user
      const fetched = await message.channel.messages.fetch({ limit: 20 }).catch(() => null);
      if(fetched){
        const userMsgs = fetched.filter(m => m.author.id === userId);
        message.channel.bulkDelete(userMsgs, true).catch(() => {});
      }
      // Mute for 2 minutes
      try {
        await message.member.timeout(2 * 60 * 1000, "AutoMod: spam detected");
      } catch {}
      // Reset tracker
      spamTracker.set(`${guildId}:${userId}`, []);
      const spamEmbed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("⚡ AutoMod — Spam Detected")
        .addFields(
          { name: "User", value: `${message.author} (${message.author.tag})`, inline: true },
          { name: "Channel", value: `${message.channel}`, inline: true },
          { name: "Action", value: "Muted for 2 minutes, recent messages deleted", inline: false }
        )
        .setTimestamp();
      await sendAutomodLog(message.guild, spamEmbed, cfg);
      message.channel.send(`⚠️ ${message.author}, you were muted for 2 minutes due to spam.`)
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      return;
    }

    // 3) Discord invite links
    if(cfg.blockLinks && /discord\.gg\/|discord\.com\/invite\//i.test(message.content)){
      await message.delete().catch(() => {});
      if(!warnings[guildId]) warnings[guildId] = {};
      if(!warnings[guildId][userId]) warnings[guildId][userId] = [];
      warnings[guildId][userId].push({ reason: "[AutoMod] Discord invite link", date: new Date().toISOString() });
      saveData();
      const linkEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🔗 AutoMod — Invite Link Blocked")
        .addFields(
          { name: "User", value: `${message.author} (${message.author.tag})`, inline: true },
          { name: "Channel", value: `${message.channel}`, inline: true }
        )
        .setTimestamp();
      await sendAutomodLog(message.guild, linkEmbed, cfg);
      message.channel.send(`⚠️ ${message.author}, posting Discord invite links is not allowed here.`)
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      return;
    }
  }

  // ---- AFK CHECK ----
  if(message.mentions.users.size > 0){
    message.mentions.users.forEach(user => {
      if(afkData[user.id]) message.reply(`💤 **${user.tag}** is AFK: ${afkData[user.id]}`);
    });
  }
  if(afkData[userId]){
    delete afkData[userId];
    saveData();
    message.reply("✅ Welcome back! Your AFK has been removed.").then(m => setTimeout(() => m.delete(), 5000));
  }

  // ---- XP GAIN ----
  if(guildId && !xpOnCooldown(userId)){
    const xpGain = Math.floor(Math.random() * 10) + 5;
    const leveledUp = addXP(guildId, userId, xpGain);
    if(leveledUp){
      const lvl = levels[guildId][userId].level;
      const levelUpMsg = new EmbedBuilder()
        .setColor("Gold")
        .setTitle("🎁 Level Up!")
        .setDescription(`🎉 ${message.author} just leveled up to **Level ${lvl}**!\n📈 Keep chatting to reach the next level!`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      const notifyChannelId = xpChannels[guildId];
      const notifyChannel = notifyChannelId ? message.guild.channels.cache.get(notifyChannelId) : message.channel;
      if(notifyChannel) notifyChannel.send({ embeds: [levelUpMsg] });
    }
  }

  // ---- ?rules COMMAND ----
  if(message.content.toLowerCase() === "?rules"){
    const rulesEmbed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📜 Discord Server Rules")
      .setDescription("Follow the rules to keep the server safe and fun for everyone!")
      .addFields(
        { name: "1. Respect Everyone", value: "No harassment, bullying, hate speech, or discrimination." },
        { name: "2. No Spamming", value: "Avoid spam, excessive links, or self-promotion." },
        { name: "3. Keep Content Appropriate", value: "No NSFW, illegal, or pirated content." },
        { name: "4. Respect Privacy", value: "No doxxing or sharing personal info without consent." },
        { name: "5. No Advertising", value: "Advertising other servers, bots, or products is not allowed without permission." },
        { name: "6. Follow Staff Instructions", value: "Always respect moderators and admins; their decisions are final." },
        { name: "7. No Impersonation", value: "Do not impersonate staff or other members." },
        { name: "9. Have Fun! 🎉", value: "Enjoy yourself and help create a friendly community!" }
      )
      .setFooter({ text: "Follow the rules to keep the server safe and fun!" });
    return message.channel.send({ embeds: [rulesEmbed] });
  }
});

// ---------- INTERACTIONS ----------
client.on("interactionCreate", async interaction => {
  if(!interaction.isCommand()) return;
  const { commandName, guild, member } = interaction;
  const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

  // ---------- AUTOMOD ----------
  if(commandName === "automod"){
    if(!isAdmin) return interaction.reply({ content:"❌ Admins only.", ephemeral:true });
    const sub = interaction.options.getSubcommand();
    const cfg = getAutomod(guild.id);

    if(sub === "enable"){
      cfg.enabled = true; saveAutomod();
      return interaction.reply("✅ Auto-mod **enabled**.");
    }
    if(sub === "disable"){
      cfg.enabled = false; saveAutomod();
      return interaction.reply("✅ Auto-mod **disabled**.");
    }
    if(sub === "addword"){
      const word = interaction.options.getString("word").toLowerCase();
      if(cfg.blockedWords.includes(word)) return interaction.reply("⚠️ That word is already blocked.");
      cfg.blockedWords.push(word); saveAutomod();
      return interaction.reply(`✅ Added \`${word}\` to the blocked words list.`);
    }
    if(sub === "removeword"){
      const word = interaction.options.getString("word").toLowerCase();
      const idx = cfg.blockedWords.indexOf(word);
      if(idx === -1) return interaction.reply("⚠️ That word isn't in the list.");
      cfg.blockedWords.splice(idx, 1); saveAutomod();
      return interaction.reply(`✅ Removed \`${word}\` from the blocked words list.`);
    }
    if(sub === "listwords"){
      if(cfg.blockedWords.length === 0) return interaction.reply("📋 No blocked words set.");
      return interaction.reply({ content:`📋 **Blocked words:**\n${cfg.blockedWords.map(w=>`\`${w}\``).join(", ")}`, ephemeral:true });
    }
    if(sub === "setlog"){
      const channel = interaction.options.getChannel("channel");
      cfg.logChannel = channel.id; saveAutomod();
      return interaction.reply(`✅ Auto-mod logs will be sent to ${channel}.`);
    }
    if(sub === "setspam"){
      const limit = interaction.options.getInteger("limit");
      cfg.spamLimit = limit; saveAutomod();
      return interaction.reply(`✅ Spam limit set to **${limit}** messages per 5 seconds.`);
    }
    if(sub === "setlinks"){
      const enabled = interaction.options.getBoolean("enabled");
      cfg.blockLinks = enabled; saveAutomod();
      return interaction.reply(`✅ Discord invite link blocking is now **${enabled ? "enabled" : "disabled"}**.`);
    }
    if(sub === "status"){
      const embed = new EmbedBuilder()
        .setTitle("🛡️ Auto-Mod Settings")
        .setColor(cfg.enabled ? "Green" : "Red")
        .addFields(
          { name: "Status",        value: cfg.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Log Channel",   value: cfg.logChannel ? `<#${cfg.logChannel}>` : "Not set", inline: true },
          { name: "Spam Limit",    value: `${cfg.spamLimit} msgs / 5s`, inline: true },
          { name: "Block Invites", value: cfg.blockLinks ? "Yes" : "No", inline: true },
          { name: "Blocked Words", value: cfg.blockedWords.length > 0 ? cfg.blockedWords.map(w=>`\`${w}\``).join(", ") : "None", inline: false }
        );
      return interaction.reply({ embeds:[embed], ephemeral:true });
    }
  }

  // ---------- CLEAR ----------
  if(commandName === "clear"){
    if(!isAdmin && !member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return interaction.reply({ content:"❌ You need **Manage Messages** permission.", ephemeral:true });
    const amount = interaction.options.getInteger("amount");
    await interaction.deferReply({ ephemeral: true });
    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.editReply(`✅ Deleted **${deleted.size}** message(s).`);
    } catch(err) {
      return interaction.editReply("❌ Failed to delete messages. Messages older than 14 days cannot be bulk deleted.");
    }
  }

  // ---------- HELP ----------
  if(commandName === "help"){
    const embed = new EmbedBuilder()
      .setTitle("🤖 Bot Commands")
      .setColor("Blue")
      .setDescription("All commands")
      .addFields(
        { name:"Moderation",  value:"`/clear`, `/kick`, `/ban`, `/mute`, `/unmute`, `/warn`, `/warnings`, `/announce`" },
        { name:"Levels & XP", value:"`/level`, `/addxp`, `/removexp`, `/leaderboard`, `/setxpchannel`" },
        { name:"Economy",     value:"`/cash`, `/daily`, `/give`, `/fish`, `/rob`, `/gamble`, `/shop`, `/buy`" },
        { name:"Auto-Mod",    value:"`/automod enable/disable/addword/removeword/listwords/setlog/setspam/setlinks/status`" },
        { name:"Utility",     value:"`/afk`, `?rules`" }
      );
    return interaction.reply({ embeds:[embed] });
  }

  // ---------- PING ----------
  if(commandName === "ping"){
    const msg = await interaction.reply({ content:"🏓 Pinging...", fetchReply:true });
    return interaction.editReply(`🏓 Pong! Latency ${msg.createdTimestamp - interaction.createdTimestamp}ms.`);
  }

  // ---------- AFK ----------
  if(commandName === "afk"){
    const reason = interaction.options.getString("reason") || "AFK";
    afkData[interaction.user.id] = reason;
    saveData();
    return interaction.reply(`✅ You are now AFK: ${reason}`);
  }

  // ---------- LEVEL ----------
  if(commandName === "level"){
    const target = interaction.options.getUser("user") || interaction.user;
    if(!levels[guild.id]) levels[guild.id] = {};
    if(!levels[guild.id][target.id]) levels[guild.id][target.id] = { xp:0, level:1 };
    const data = levels[guild.id][target.id];
    const embed = new EmbedBuilder().setTitle(`${target.tag}'s Profile`).setColor("Gold")
      .setThumbnail(target.displayAvatarURL({ dynamic:true }))
      .setDescription(`**Level:** ${data.level}\n**XP:** ${data.xp}/${data.level*100}`);
    return interaction.reply({ embeds:[embed] });
  }

  // ---------- SETWELCOME ----------
  if(commandName === "setwelcome"){
    if(!isAdmin) return interaction.reply("❌ Admins only.");
    const channel = interaction.options.getChannel("channel");
    welcomeChannels[guild.id] = channel.id;
    saveData();
    return interaction.reply(`✅ Welcome channel set to ${channel}`);
  }

  // ---------- SETAUTOROLE ----------
  if(commandName === "setautorole"){
    if(!isAdmin) return interaction.reply("❌ Admins only.");
    const role = interaction.options.getRole("role");
    autoRoles[guild.id] = role.id;
    saveData();
    return interaction.reply(`✅ Auto-role set to ${role}`);
  }

  // ---------- SETXPCHANNEL ----------
  if(commandName === "setxpchannel"){
    if(!isAdmin) return interaction.reply("❌ Admins only.");
    const channel = interaction.options.getChannel("channel");
    xpChannels[guild.id] = channel.id;
    saveData();
    return interaction.reply(`✅ Level-up notifications will now be sent to ${channel}.\n📢 XP is still earned in **all channels** — only the notification goes there.`);
  }

  // ---------- ADDXP ----------
  if(commandName === "addxp"){
    if(!isAdmin) return interaction.reply({ content:"❌ Admins only.", ephemeral:true });
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    if(amount <= 0) return interaction.reply({ content:"❌ Amount must be greater than 0.", ephemeral:true });
    if(!levels[guild.id]) levels[guild.id] = {};
    if(!levels[guild.id][target.id]) levels[guild.id][target.id] = { xp:0, level:1 };
    const leveled = addXP(guild.id, target.id, amount);
    const data = levels[guild.id][target.id];
    return interaction.reply(`✅ Added **${amount} XP** to ${target.tag}.\nThey are now **Level ${data.level}** with **${data.xp}/${data.level*100} XP**.${leveled ? ' 🎉 They leveled up!' : ''}`);
  }

  // ---------- REMOVEXP ----------
  if(commandName === "removexp"){
    if(!isAdmin) return interaction.reply({ content:"❌ Admins only.", ephemeral:true });
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    if(amount <= 0) return interaction.reply({ content:"❌ Amount must be greater than 0.", ephemeral:true });
    if(!levels[guild.id]) levels[guild.id] = {};
    if(!levels[guild.id][target.id]) levels[guild.id][target.id] = { xp:0, level:1 };
    const userData = levels[guild.id][target.id];
    userData.xp -= amount;
    while(userData.xp < 0 && userData.level > 1){ userData.level--; userData.xp += userData.level * 100; }
    if(userData.xp < 0) userData.xp = 0;
    saveData();
    return interaction.reply(`✅ Removed **${amount} XP** from ${target.tag}.\nThey are now **Level ${userData.level}** with **${userData.xp}/${userData.level*100} XP**.`);
  }

  // ---------- LEADERBOARD ----------
  if(commandName === "leaderboard"){
    if(!levels[guild.id] || Object.keys(levels[guild.id]).length === 0)
      return interaction.reply("❌ No XP data for this server yet.");
    const sorted = Object.entries(levels[guild.id])
      .sort(([,a],[,b]) => b.level !== a.level ? b.level - a.level : b.xp - a.xp)
      .slice(0, 10);
    const medals = ['🥇','🥈','🥉'];
    let desc = '';
    for(let i = 0; i < sorted.length; i++){
      const [userId, data] = sorted[i];
      let tag;
      try { const u = await client.users.fetch(userId); tag = u.tag; } catch { tag = `Unknown User`; }
      const rank = medals[i] || `**#${i+1}**`;
      desc += `${rank} ${tag} — Level **${data.level}** (${data.xp}/${data.level*100} XP)\n`;
    }
    const embed = new EmbedBuilder().setTitle(`🏆 ${guild.name} XP Leaderboard`).setColor("Gold").setDescription(desc).setTimestamp();
    return interaction.reply({ embeds:[embed] });
  }

  // ---------- ECONOMY ----------
  ensureUser(interaction.user.id);
  if(["cash","daily","give","fish","rob","gamble","shop","buy"].includes(commandName)){

    if(commandName==="cash"){
      const target = interaction.options.getUser("user")||interaction.user;
      ensureUser(target.id);
      return interaction.reply(`💰 ${target.tag} has $${economy[target.id].cash}`);
    }
    if(commandName==="daily"){
      const now = Date.now();
      const last = economy[interaction.user.id].lastDaily;
      const cooldown = 24*60*60*1000;
      if(now-last<cooldown){
        const remain = cooldown-(now-last);
        const h=Math.floor(remain/3600000); const m=Math.floor((remain%3600000)/60000);
        return interaction.reply(`⏳ Already claimed. Try again in ${h}h ${m}m.`);
      }
      const reward = Math.floor(Math.random()*500)+100;
      economy[interaction.user.id].cash += reward;
      economy[interaction.user.id].lastDaily = now;
      saveEconomy();
      return interaction.reply(`✅ You claimed daily reward of $${reward}`);
    }
    if(commandName==="give"){
      const target = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");
      ensureUser(target.id);
      if(amount<=0) return interaction.reply("❌ Must be >0");
      if(economy[interaction.user.id].cash<amount) return interaction.reply("❌ Not enough cash");
      economy[interaction.user.id].cash-=amount;
      economy[target.id].cash+=amount;
      saveEconomy();
      return interaction.reply(`💸 Gave $${amount} to ${target.tag}`);
    }
    if(commandName==="fish"){
      const gain = Math.floor(Math.random()*300)+50;
      economy[interaction.user.id].cash+=gain;
      saveEconomy();
      return interaction.reply(`🎣 You caught $${gain}`);
    }
    if(commandName==="rob"){
      const target = interaction.options.getUser("user");
      ensureUser(target.id);
      if(economy[target.id].cash<100) return interaction.reply("❌ Target has too little cash");
      const success = Math.random()<0.5;
      if(success){
        const stolen = Math.floor(Math.random()*(economy[target.id].cash/2))+1;
        economy[target.id].cash-=stolen;
        economy[interaction.user.id].cash+=stolen;
        saveEconomy();
        return interaction.reply(`💰 You stole $${stolen} from ${target.tag}`);
      } else {
        const lost = Math.floor(Math.random()*100)+10;
        economy[interaction.user.id].cash=Math.max(0,economy[interaction.user.id].cash-lost);
        saveEconomy();
        return interaction.reply(`❌ Failed! Lost $${lost}`);
      }
    }
    if(commandName==="gamble"){
      const amount = interaction.options.getInteger("amount");
      if(amount<=0) return interaction.reply("❌ Must be >0");
      if(economy[interaction.user.id].cash<amount) return interaction.reply("❌ Not enough cash");
      const win = Math.random()<0.5;
      if(win){ economy[interaction.user.id].cash+=amount; saveEconomy(); return interaction.reply(`🎉 Won $${amount}`);}
      else{ economy[interaction.user.id].cash-=amount; saveEconomy(); return interaction.reply(`💸 Lost $${amount}`);}
    }
    if(commandName==="shop"){
      if(Object.keys(shop).length===0){ shop["VIP Role"]={ price:1000, desc:"Buy a VIP role" }; saveShop(); }
      let desc="";
      for(const item in shop) desc+=`**${item}** - $${shop[item].price}\n${shop[item].desc}\n\n`;
      return interaction.reply({ embeds:[new EmbedBuilder().setTitle("🛒 Shop").setColor("Green").setDescription(desc)] });
    }
    if(commandName==="buy"){
      const item = interaction.options.getString("item");
      if(!shop[item]) return interaction.reply("❌ Item not found");
      const price = shop[item].price;
      if(economy[interaction.user.id].cash<price) return interaction.reply("❌ Not enough cash");
      economy[interaction.user.id].cash-=price;
      economy[interaction.user.id].inventory.push(item);
      saveEconomy();
      return interaction.reply(`✅ Bought **${item}** for $${price}`);
    }
  }
});

client.login(TOKEN);
