// ================= IMPORT =================
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

const prefix = "?";

// ================= CONFIG =================
let commandMode = "both"; // slash | prefix | both

let economy = {};
let inventory = {};
let xp = {};
let levels = {};
let welcomeChannel = {};

// ================= SHOP =================
const shop = {
  rod: { name: "Fishing Rod", price: 500 },
  laptop: { name: "Laptop", price: 2000 },
  vip: { name: "VIP Role", price: 5000 }
};

// ================= HELPER =================
function getUser(id) {
  if (!economy[id]) economy[id] = { cash: 0 };
  if (!inventory[id]) inventory[id] = [];
  if (!xp[id]) xp[id] = 0;
  if (!levels[id]) levels[id] = 0;
}

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ ${client.user.tag} online`);

  const commands = [
    new SlashCommandBuilder().setName("help").setDescription("Help menu"),
    new SlashCommandBuilder().setName("rules").setDescription("Server rules"),
    new SlashCommandBuilder().setName("balance").setDescription("Check money"),
    new SlashCommandBuilder().setName("daily").setDescription("Daily reward"),

    new SlashCommandBuilder()
      .setName("give")
      .setDescription("Give money")
      .addUserOption(o => o.setName("user").setRequired(true))
      .addIntegerOption(o => o.setName("amount").setRequired(true)),

    new SlashCommandBuilder().setName("shop").setDescription("View shop"),
    new SlashCommandBuilder().setName("inventory").setDescription("Inventory"),

    new SlashCommandBuilder()
      .setName("buy")
      .setDescription("Buy item")
      .addStringOption(o =>
        o.setName("item").setRequired(true).addChoices(
          { name: "Fishing Rod", value: "rod" },
          { name: "Laptop", value: "laptop" },
          { name: "VIP Role", value: "vip" }
        )
      ),

    new SlashCommandBuilder().setName("profile").setDescription("Profile"),

    new SlashCommandBuilder()
      .setName("setcommandtype")
      .setDescription("Set command mode")
      .addStringOption(o =>
        o.setName("mode").setRequired(true).addChoices(
          { name: "Slash Only", value: "slash" },
          { name: "Prefix Only", value: "prefix" },
          { name: "Both", value: "both" }
        )
      ),

    new SlashCommandBuilder()
      .setName("setwelcomechannel")
      .setDescription("Set welcome channel")
      .addChannelOption(o => o.setName("channel").setRequired(true)),

    new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Ban user")
      .addUserOption(o => o.setName("user").setRequired(true)),

    new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Kick user")
      .addUserOption(o => o.setName("user").setRequired(true))
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("✅ Slash commands loaded");
});

// ================= SLASH =================
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  if (commandMode === "prefix")
    return i.reply({ content: "❌ Slash disabled", ephemeral: true });

  getUser(i.user.id);

  const cmd = i.commandName;

  if (cmd === "help") {
    return i.reply("📘 /help /rules /shop /balance /profile");
  }

  if (cmd === "rules") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Rules")
      .setDescription(`
1. Respect Everyone
2. No Spamming
3. Keep Content Appropriate
4. Respect Privacy
5. No Advertising
6. Follow Staff
7. No Impersonation
9. Have Fun 🎉
`);
    return i.reply({ embeds: [embed] });
  }

  if (cmd === "balance")
    return i.reply(`💰 ${economy[i.user.id].cash}`);

  if (cmd === "daily") {
    let amt = Math.floor(Math.random() * 300);
    economy[i.user.id].cash += amt;
    return i.reply(`💰 +${amt}`);
  }

  if (cmd === "give") {
    let user = i.options.getUser("user");
    let amt = i.options.getInteger("amount");

    getUser(user.id);

    economy[i.user.id].cash -= amt;
    economy[user.id].cash += amt;

    return i.reply("✅ sent");
  }

  if (cmd === "shop") {
    return i.reply(Object.values(shop).map(x => `${x.name} - ${x.price}`).join("\n"));
  }

  if (cmd === "buy") {
    let item = shop[i.options.getString("item")];
    if (!item) return i.reply("no item");

    if (economy[i.user.id].cash < item.price)
      return i.reply("no money");

    economy[i.user.id].cash -= item.price;
    inventory[i.user.id].push(item.name);

    return i.reply(`🛒 bought ${item.name}`);
  }

  if (cmd === "inventory")
    return i.reply(inventory[i.user.id].join(", ") || "empty");

  if (cmd === "profile") {
    return i.reply(`Level: ${levels[i.user.id]} | XP: ${xp[i.user.id]}`);
  }

  if (cmd === "setcommandtype") {
    if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return i.reply("admin only");

    commandMode = i.options.getString("mode");
    return i.reply(`mode = ${commandMode}`);
  }

  if (cmd === "setwelcomechannel") {
    if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return i.reply("admin only");

    welcomeChannel[i.guild.id] = i.options.getChannel("channel").id;
    return i.reply("✅ set");
  }

  if (cmd === "ban") {
    if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    let user = i.options.getMember("user");
    user.ban();
    i.reply("banned");
  }

  if (cmd === "kick") {
    if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    let user = i.options.getMember("user");
    user.kick();
    i.reply("kicked");
  }
});

// ================= PREFIX =================
client.on("messageCreate", (m) => {
  if (m.author.bot) return;

  getUser(m.author.id);

  // XP
  xp[m.author.id] += 5;
  let need = (levels[m.author.id] + 1) * 100;

  if (xp[m.author.id] >= need) {
    levels[m.author.id]++;
    xp[m.author.id] = 0;
    m.channel.send(`🎉 ${m.author} level ${levels[m.author.id]}`);
  }

  if (!m.content.startsWith(prefix)) return;
  if (commandMode === "slash") return;

  const args = m.content.slice(prefix.length).split(" ");
  const cmd = args[0];

  if (cmd === "help") return m.reply("use /help");
  if (cmd === "rules") return m.reply("use /rules");

  if (cmd === "balance")
    return m.reply(economy[m.author.id].cash);

  if (cmd === "shop")
    return m.reply(Object.values(shop).map(x => `${x.name}-${x.price}`).join("\n"));

  if (cmd === "inventory")
    return m.reply(inventory[m.author.id].join(", ") || "empty");

  if (cmd === "setcommandtype") {
    if (!m.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    commandMode = args[1];
    return m.reply(`mode = ${commandMode}`);
  }
});

// ================= WELCOME =================
client.on("guildMemberAdd", (member) => {
  let ch = member.guild.channels.cache.get(welcomeChannel[member.guild.id]);
  if (!ch) return;

  const embed = new EmbedBuilder()
    .setDescription(`Hello ${member}\nWelcome to ${member.guild.name}\nMember #${member.guild.memberCount}`);

  ch.send({ embeds: [embed] });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
