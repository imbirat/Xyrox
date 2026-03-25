/* ---------------- IMPORTS ---------------- */
const { 
  Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionsBitField, 
  REST, Routes, ChannelType, InteractionType 
} = require("discord.js");
const fs = require("fs");
const express = require("express");

/* ---------------- EXPRESS ---------------- */
const app = express();
app.get("/", (req,res)=>res.send("GOD v3.1 BOT ONLINE"));
app.listen(3000,()=>console.log("Web server running"));

/* ---------------- CLIENT ---------------- */
const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

/* ---------------- DATABASE ---------------- */
const DB = {
  levels:"levels.json",
  economy:"economy.json",
  warnings:"warnings.json",
  config:"config.json"
};

let levels = fs.existsSync(DB.levels)?JSON.parse(fs.readFileSync(DB.levels)):{};
let economy = fs.existsSync(DB.economy)?JSON.parse(fs.readFileSync(DB.economy)):{};
let warnings = fs.existsSync(DB.warnings)?JSON.parse(fs.readFileSync(DB.warnings)):{};
let config = fs.existsSync(DB.config)?JSON.parse(fs.readFileSync(DB.config)):{};

function saveDB(){
  fs.writeFileSync(DB.levels,JSON.stringify(levels,null,2));
  fs.writeFileSync(DB.economy,JSON.stringify(economy,null,2));
  fs.writeFileSync(DB.warnings,JSON.stringify(warnings,null,2));
  fs.writeFileSync(DB.config,JSON.stringify(config,null,2));
}

function ensureUser(id){
  if(!economy[id]) economy[id]={cash:0,lastDaily:0};
  if(!levels[id]) levels[id]={xp:0,level:1};
  if(!warnings[id]) warnings[id]=[];
}

/* ---------------- COMMANDS ---------------- */
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Bot ping"),
  new SlashCommandBuilder().setName("cash").setDescription("Check cash"),
  new SlashCommandBuilder().setName("daily").setDescription("Claim daily"),
  new SlashCommandBuilder().setName("work").setDescription("Work for money"),
  new SlashCommandBuilder().setName("give").setDescription("Give money").addUserOption(o=>o.setName("user").setRequired(true)).addIntegerOption(o=>o.setName("amount").setRequired(true)),
  new SlashCommandBuilder().setName("gamble").setDescription("Gamble").addIntegerOption(o=>o.setName("amount").setRequired(true)),
  new SlashCommandBuilder().setName("addxp").setDescription("Add XP to user").addUserOption(o=>o.setName("user").setRequired(true)).addIntegerOption(o=>o.setName("amount").setRequired(true)),
  new SlashCommandBuilder().setName("removexp").setDescription("Remove XP from user").addUserOption(o=>o.setName("user").setRequired(true)).addIntegerOption(o=>o.setName("amount").setRequired(true)),
  new SlashCommandBuilder().setName("setxpchannel").setDescription("Set XP log channel").addChannelOption(o=>o.setName("channel").setRequired(true)),
  new SlashCommandBuilder().setName("setwelcome").setDescription("Set welcome channel").addChannelOption(o=>o.setName("channel").setRequired(true)),
  new SlashCommandBuilder().setName("addcash").setDescription("Add cash").addUserOption(o=>o.setName("user").setRequired(true)).addIntegerOption(o=>o.setName("amount").setRequired(true)),
  new SlashCommandBuilder().setName("removecash").setDescription("Remove cash").addUserOption(o=>o.setName("user").setRequired(true)).addIntegerOption(o=>o.setName("amount").setRequired(true)),
].map(c=>c.toJSON());

/* ---------------- REGISTER COMMANDS ---------------- */
const rest = new REST({version:"10"}).setToken(TOKEN);
(async()=>{
  try{
    await rest.put(Routes.applicationCommands(CLIENT_ID),{body:commands});
    console.log("Commands registered");
  }catch(e){console.log(e);}
})();

/* ---------------- READY ---------------- */
client.once("ready",()=>{
  console.log("GOD v3.1 ONLINE");
  console.log("Logged in as "+client.user.tag);
});

/* ---------------- WELCOME & AUTOROLE ---------------- */
client.on("guildMemberAdd", member=>{
  if(config.autorole){
    const role = member.guild.roles.cache.get(config.autorole);
    if(role) member.roles.add(role);
  }
  const channel = member.guild.channels.cache.get(config.welcome);
  if(!channel) return;
  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("🎉 Welcome!")
    .setDescription(`Welcome ${member} to **${member.guild.name}**\nMake sure to read #rules`);
  channel.send({embeds:[embed]});
});

/* ---------------- XP SYSTEM ---------------- */
const xpCooldown = new Set();
client.on("messageCreate",message=>{
  if(message.author.bot) return;
  ensureUser(message.author.id);

  if(xpCooldown.has(message.author.id)) return;

  levels[message.author.id].xp += 5;
  const level = levels[message.author.id].level;
  if(levels[message.author.id].xp >= level*100){
    levels[message.author.id].level++;
    levels[message.author.id].xp = 0;
    // Send to xp channel if set
    if(config.xpchannel){
      const xpChan = message.guild.channels.cache.get(config.xpchannel);
      if(xpChan) xpChan.send(`${message.author} reached level ${levels[message.author.id].level}!`);
    }
  }

  xpCooldown.add(message.author.id);
  setTimeout(()=>xpCooldown.delete(message.author.id),60000);
  saveDB();
});

/* ---------------- INTERACTIONS ---------------- */
client.on("interactionCreate", async interaction=>{
  if(interaction.type !== InteractionType.ApplicationCommand) return;
  ensureUser(interaction.user.id);

  const cmd = interaction.commandName;

  /* ---------------- ADMIN XP/CASH ---------------- */
  if(cmd==="addxp"){
    if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply("No perms");
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    ensureUser(user.id);
    levels[user.id].xp += amount;
    interaction.reply(`Added ${amount} XP to ${user.tag}`);
    saveDB();
  }

  if(cmd==="removexp"){
    if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply("No perms");
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    ensureUser(user.id);
    levels[user.id].xp -= amount;
    if(levels[user.id].xp<0) levels[user.id].xp=0;
    interaction.reply(`Removed ${amount} XP from ${user.tag}`);
    saveDB();
  }

  if(cmd==="addcash"){
    if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply("No perms");
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    ensureUser(user.id);
    economy[user.id].cash += amount;
    interaction.reply(`Added $${amount} to ${user.tag}`);
    saveDB();
  }

  if(cmd==="removecash"){
    if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply("No perms");
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    ensureUser(user.id);
    economy[user.id].cash -= amount;
    if(economy[user.id].cash<0) economy[user.id].cash=0;
    interaction.reply(`Removed $${amount} from ${user.tag}`);
    saveDB();
  }

  /* ---------------- CONFIG COMMANDS ---------------- */
  if(cmd==="setxpchannel"){
    if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply("No perms");
    const channel = interaction.options.getChannel("channel");
    config.xpchannel = channel.id;
    saveDB();
    interaction.reply(`XP notifications set to ${channel}`);
  }

  if(cmd==="setwelcome"){
    if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply("No perms");
    const channel = interaction.options.getChannel("channel");
    config.welcome = channel.id;
    saveDB();
    interaction.reply(`Welcome channel set to ${channel}`);
  }

  /* ---------------- USER COMMANDS ---------------- */
  if(cmd==="ping") interaction.reply("🏓 Pong "+client.ws.ping+"ms");
  if(cmd==="cash") interaction.reply("💰 $"+economy[interaction.user.id].cash);
  if(cmd==="daily"){
    const now = Date.now();
    if(now - economy[interaction.user.id].lastDaily < 86400000) return interaction.reply("Come back tomorrow");
    economy[interaction.user.id].lastDaily = now;
    economy[interaction.user.id].cash += 200;
    saveDB();
    interaction.reply("You got $200!");
  }
  if(cmd==="work"){
    const money = Math.floor(Math.random()*200)+50;
    economy[interaction.user.id].cash += money;
    saveDB();
    interaction.reply("You earned $"+money);
  }
  if(cmd==="gamble"){
    const bet = interaction.options.getInteger("amount");
    if(economy[interaction.user.id].cash < bet) return interaction.reply("Not enough money");
    if(Math.random()>0.5){ economy[interaction.user.id].cash += bet; interaction.reply("You won $"+bet); }
    else{ economy[interaction.user.id].cash -= bet; interaction.reply("You lost $"+bet); }
    saveDB();
  }
  if(cmd==="give"){
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    if(economy[interaction.user.id].cash < amount) return interaction.reply("Not enough money");
    ensureUser(user.id);
    economy[interaction.user.id].cash -= amount;
    economy[user.id].cash += amount;
    saveDB();
    interaction.reply(`You gave ${user.tag} $${amount}`);
  }

});

client.login(TOKEN);
