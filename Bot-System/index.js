// index.js
// بوت كامل متكامل - discord.js v14
const { 
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");

// ==== CONFIG ====
const CONFIG = {
  TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  GUILD_ID: process.env.DISCORD_GUILD_ID,
  SCRIM_VOICE_ID: "1363605370320322690", // القناة الصوتية اللي البوت يقعد فيها 24/7
  LOG_CHANNEL_ID: "1363504192928350419", // حط ID قناة اللوج لو عايز لوج
  ALLOWED_ROLES: [ // الرولات اللي مسموح لها تستخدم أوامر السكريم
    "1363502731305943171",
    "1363502730227875910",
    "1363502726939414588",
    "1363502725698027660"
  ],
  BLACKLIST_ROLE_ID: "1363502806383726813", // رول البلاك ليست
  // نظام صلاحيات الأوامر - كل أمر والرولات المسموحة له
  COMMAND_PERMISSIONS: {
    // أوامر عامة - فقط الرولات المحددة + Administrator
    "reg": [],
    "close_reg": [],
    "spare": [],
    "anno": [],
    "fb": [],
    "cancel_reg": [],
    "era": [],
    "mir": [],
    "san": [],
    "kick": [],
    "ban": [],
    "unban": [],
    "mute": [],
    "unmute": [],
    "clear": [],
    "lock": [],
    "unlock": [],
    "hide": [],
    "unhide": [],
    "role": [],
    "blacklist": [],
    "voice": [],
    "help": [],
    "perms": [],
    // الميزات الاحترافية الجديدة
    "stats": [],
    "userinfo": [],
    "remind": []
    // فاضي يعني يستخدم الرولات الافتراضية + Administrator
  }
};
// ================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

// ---------- prepare slash commands ----------
const commands = [];

// help
commands.push(
  new SlashCommandBuilder().setName("help").setDescription("Show help menu")
);

// scrim commands
commands.push(
  new SlashCommandBuilder()
    .setName("reg")
    .setDescription("Open registration (scrim)")
    .addStringOption(opt => opt.setName("time").setDescription("Time/slot (optional)").setRequired(false))
);
commands.push(new SlashCommandBuilder().setName("close_reg").setDescription("Close registration"));
commands.push(
  new SlashCommandBuilder()
    .setName("spare")
    .setDescription("Open spare registration")
    .addStringOption(opt => opt.setName("time").setDescription("Time/slot").setRequired(true))
);
commands.push(
  new SlashCommandBuilder()
    .setName("anno")
    .setDescription("Announcement (scrim)")
    .addStringOption(opt => opt.setName("time").setDescription("Time").setRequired(true))
);
commands.push(new SlashCommandBuilder().setName("fb").setDescription("Send feedback message"));
commands.push(new SlashCommandBuilder().setName("cancel_reg").setDescription("إلغاء التسجيل للسكريم"));

// maps: era/mir/san (mention is a role)
["era", "mir", "san"].forEach(map => {
  commands.push(
    new SlashCommandBuilder()
      .setName(map)
      .setDescription(`${map.toUpperCase()} map announcement (sends DM to mentioned role)`)
      .addStringOption(opt => opt.setName("id").setDescription("Room ID").setRequired(true))
      .addStringOption(opt => opt.setName("pass").setDescription("Password").setRequired(true))
      .addStringOption(opt => opt.setName("wait").setDescription("Wait time").setRequired(true))
      .addRoleOption(opt => opt.setName("mention").setDescription("Role to mention and DM").setRequired(true))
  );
});

// role add/remove using subcommands
commands.push(
  new SlashCommandBuilder()
    .setName("role")
    .setDescription("Role management")
    .addSubcommand(sub => sub.setName("add").setDescription("Give role").addUserOption(o => o.setName("user").setDescription("User to give role to").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("Role to give").setRequired(true)))
    .addSubcommand(sub => sub.setName("remove").setDescription("Remove role").addUserOption(o => o.setName("user").setDescription("User to remove role from").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("Role to remove").setRequired(true)))
);

// blacklist add/remove
commands.push(
  new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Manage blacklist")
    .addSubcommand(sub => sub.setName("add").setDescription("Add to blacklist").addUserOption(o => o.setName("user").setDescription("User to add to blacklist").setRequired(true)))
    .addSubcommand(sub => sub.setName("remove").setDescription("Remove from blacklist").addUserOption(o => o.setName("user").setDescription("User to remove from blacklist").setRequired(true)))
);

// moderation
commands.push(new SlashCommandBuilder().setName("kick").setDescription("Kick a member").addUserOption(o => o.setName("user").setDescription("User to kick").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reason for kick").setRequired(false)));
commands.push(new SlashCommandBuilder().setName("ban").setDescription("Ban a member").addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reason for ban").setRequired(false)));
commands.push(new SlashCommandBuilder().setName("unban").setDescription("Unban a user by ID").addStringOption(o => o.setName("userid").setDescription("User ID").setRequired(true)));
commands.push(new SlashCommandBuilder().setName("mute").setDescription("Mute member (adds Muted role)").addUserOption(o => o.setName("user").setDescription("User to mute").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reason for mute").setRequired(false)));
commands.push(new SlashCommandBuilder().setName("unmute").setDescription("Unmute member").addUserOption(o => o.setName("user").setDescription("User to unmute").setRequired(true)));
commands.push(new SlashCommandBuilder().setName("clear").setDescription("Clear messages").addIntegerOption(o => o.setName("amount").setDescription("Number of messages to clear").setRequired(true)));
commands.push(new SlashCommandBuilder().setName("lock").setDescription("Lock this text channel"));
commands.push(new SlashCommandBuilder().setName("unlock").setDescription("Unlock this text channel"));
commands.push(new SlashCommandBuilder().setName("hide").setDescription("Hide this channel from everyone"));
commands.push(new SlashCommandBuilder().setName("unhide").setDescription("Show this channel to everyone"));

// permissions management
commands.push(
  new SlashCommandBuilder()
    .setName("perms")
    .setDescription("Manage command permissions")
    .addSubcommand(sub => 
      sub.setName("add")
        .setDescription("Add role permission to command")
        .addStringOption(opt => opt.setName("command").setDescription("Command name").setRequired(true))
        .addRoleOption(opt => opt.setName("role").setDescription("Role to add").setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName("remove")
        .setDescription("Remove role permission from command")
        .addStringOption(opt => opt.setName("command").setDescription("Command name").setRequired(true))
        .addRoleOption(opt => opt.setName("role").setDescription("Role to remove").setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName("list")
        .setDescription("List command permissions")
        .addStringOption(opt => opt.setName("command").setDescription("Command name (optional)").setRequired(false))
    )
);

// voice listing
commands.push(
  new SlashCommandBuilder()
    .setName("voice")
    .setDescription("Show members in a voice channel")
    .addChannelOption(opt => opt.setName("channel").setDescription("Voice channel (optional)").setRequired(false))
);

// ==== PROFESSIONAL FEATURES ====
// Server statistics
commands.push(
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("عرض إحصائيات السيرفر | Show server statistics")
);

// User information
commands.push(
  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("عرض معلومات العضو | Show user information")
    .addUserOption(opt => opt.setName("user").setDescription("العضو | User").setRequired(false))
);

// Reminder system
commands.push(
  new SlashCommandBuilder()
    .setName("remind")
    .setDescription("إنشاء تذكير | Create reminder")
    .addStringOption(opt => opt.setName("time").setDescription("الوقت (مثال: 5m, 1h, 1d) | Time (e.g: 5m, 1h, 1d)").setRequired(true))
    .addStringOption(opt => opt.setName("message").setDescription("رسالة التذكير | Reminder message").setRequired(true))
);

// convert to JSON for registration
const rest = new REST({ version: "10" }).setToken(CONFIG.TOKEN);

// register commands (guild commands for instant update)
(async () => {
  try {
    console.log("⏳ Registering slash commands...");
    await rest.put(Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID), {
      body: commands.map(c => c.toJSON())
    });
    console.log("✅ Slash commands registered.");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
})();

// ---------- helpers ----------
function hasAllowedRole(member) {
  if (!member || !member.roles) return false;
  // التحقق من Administrator permission أولاً
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  // ثم التحقق من الرولات المحددة
  return member.roles.cache.some(r => CONFIG.ALLOWED_ROLES.includes(r.id));
}

// التحقق من صلاحيات أمر معين
function hasCommandPermission(member, commandName) {
  if (!member || !member.roles) return false;
  
  // Administrator يقدر يستخدم كل حاجة
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  
  // التحقق من الصلاحيات المخصصة للأمر
  const commandRoles = CONFIG.COMMAND_PERMISSIONS[commandName];
  if (!commandRoles) return false;
  
  // لو الأمر مالهوش رولات مخصصة، استخدم الرولات الافتراضية
  if (commandRoles.length === 0) {
    return member.roles.cache.some(r => CONFIG.ALLOWED_ROLES.includes(r.id));
  }
  
  // لو في رولات مخصصة، تحقق منها
  return member.roles.cache.some(r => commandRoles.includes(r.id));
}

// إضافة رول لأمر معين
function addRoleToCommand(commandName, roleId) {
  if (!CONFIG.COMMAND_PERMISSIONS[commandName]) {
    CONFIG.COMMAND_PERMISSIONS[commandName] = [];
  }
  if (!CONFIG.COMMAND_PERMISSIONS[commandName].includes(roleId)) {
    CONFIG.COMMAND_PERMISSIONS[commandName].push(roleId);
    return true;
  }
  return false;
}

// حذف رول من أمر معين
function removeRoleFromCommand(commandName, roleId) {
  if (!CONFIG.COMMAND_PERMISSIONS[commandName]) return false;
  const index = CONFIG.COMMAND_PERMISSIONS[commandName].indexOf(roleId);
  if (index > -1) {
    CONFIG.COMMAND_PERMISSIONS[commandName].splice(index, 1);
    return true;
  }
  return false;
}

async function ensureMutedRole(guild) {
  let role = guild.roles.cache.find(r => r.name === "Muted");
  if (!role) {
    role = await guild.roles.create({ name: "Muted", permissions: [] });
    for (const [, channel] of guild.channels.cache) {
      try {
        await channel.permissionOverwrites.edit(role, {
          SendMessages: false,
          Speak: false,
          AddReactions: false
        });
      } catch (e) {}
    }
  }
  return role;
}

async function logToChannel(guild, message) {
  if (!CONFIG.LOG_CHANNEL_ID) return;
  const ch = guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
  if (ch) ch.send(message).catch(() => {});
}

async function ensureStayInVoice() {
  try {
    const guild = client.guilds.cache.get(CONFIG.GUILD_ID);
    if (!guild) return;
    const channel = guild.channels.cache.get(CONFIG.SCRIM_VOICE_ID);
    if (!channel || !channel.isVoiceBased()) return;
    const existing = getVoiceConnection(guild.id);
    if (!existing) {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
      });
      console.log("🎙️ Bot joined voice channel for 24/7 presence.");
    }
  } catch (e) {
    console.error("Voice join error:", e);
  }
}

// ---------- events ----------
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await ensureStayInVoice();
});

// guild member logs
client.on("guildMemberAdd", member => logToChannel(member.guild, `✅ Member joined: ${member.user.tag} (${member.id})`));
client.on("guildMemberRemove", member => logToChannel(member.guild, `❌ Member left: ${member.user.tag} (${member.id})`));
client.on("messageDelete", message => {
  if (message.author && !message.author.bot) logToChannel(message.guild, `🗑 Message deleted in ${message.channel}: ${message.author.tag}: ${message.content}`);
});
client.on("messageUpdate", (oldMsg, newMsg) => {
  if (oldMsg.author && !oldMsg.author.bot) logToChannel(oldMsg.guild, `✏️ Message edited in ${oldMsg.channel}: ${oldMsg.author.tag}\nBefore: ${oldMsg.content}\nAfter: ${newMsg.content}`);
});

// ---------- interactions ----------
client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "help_select") {
        const val = interaction.values[0];
        let embed;
        
        if (val === "scrim") {
          embed = new EmbedBuilder()
            .setTitle("🕹️ أوامر السكريم | Scrim Commands")
            .setColor("#4ECDC4")
            .setDescription(`
**📝 التسجيل | Registration:**
• \`/reg [time]\` - فتح التسجيل للسكريم | Open scrim registration
• \`/close_reg\` - إغلاق التسجيل | Close registration
• \`/spare <time>\` - فتح تسجيل السبير | Open spare registration

**📊 الإدارة | Management:**
• \`/anno <time>\` - إعلان السكريم | Announce scrim
• \`/fb\` - تسجيل أرقام الفيس بوك | Facebook numbers registration
• \`/cancel_reg\` - إلغاء التسجيل | Cancel registration

⚠️ **ملاحظة:** المستخدمين المحظورين لا يمكنهم التسجيل
⚠️ **Note:** Blacklisted users cannot register
            `)
            .setThumbnail(interaction.guild.iconURL());
        }
        else if (val === "moderation") {
          embed = new EmbedBuilder()
            .setTitle("🛡️ أوامر الإشراف | Moderation Commands")
            .setColor("#E74C3C")
            .setDescription(`
**👤 إدارة الأعضاء | Member Management:**
• \`/kick <user> [reason]\` - طرد عضو | Kick member
• \`/ban <user> [reason]\` - حظر عضو | Ban member  
• \`/unban <user>\` - إلغاء حظر عضو | Unban member
• \`/mute <user> [time] [reason]\` - كتم عضو | Mute member
• \`/unmute <user>\` - إلغاء كتم عضو | Unmute member

**📝 إدارة الرسائل | Message Management:**
• \`/clear <amount>\` - حذف رسائل | Delete messages

**🔒 إدارة القنوات | Channel Management:**
• \`/lock\` - قفل القناة | Lock channel
• \`/unlock\` - فتح القناة | Unlock channel
• \`/hide\` - إخفاء القناة | Hide channel
• \`/unhide\` - إظهار القناة | Show channel

**👑 إدارة الرولات | Role Management:**
• \`/role add <user> <role>\` - إعطاء رول | Give role
• \`/role remove <user> <role>\` - إزالة رول | Remove role
            `)
            .setThumbnail(interaction.guild.iconURL());
        }
        else if (val === "maps") {
          embed = new EmbedBuilder()
            .setTitle("📢 إعلانات الخرائط | Map Announcements")
            .setColor("#9B59B6")
            .setDescription(`
**🗺️ خرائط فري فاير | Free Fire Maps:**
• \`/era\` - إعلان خريطة إيرا | Era map announcement
• \`/mir\` - إعلان خريطة ميرامار | Miramar map announcement  
• \`/san\` - إعلان خريطة سانوك | Sanhok map announcement

**📱 الميزات:**
• إرسال رسالة خاصة مع رابط الرسالة
• تنبيه للرولات المناسبة
• تنسيق احترافي ثنائي اللغة

**📱 Features:**
• Send private message with message link
• Notify appropriate roles
• Professional bilingual formatting
            `)
            .setThumbnail(interaction.guild.iconURL());
        }
        else if (val === "blacklist") {
          embed = new EmbedBuilder()
            .setTitle("⛔ إدارة البلاك ليست | Blacklist Management")
            .setColor("#34495E")
            .setDescription(`
**🚫 أوامر البلاك ليست:**
• \`/blacklist add <user>\` - إضافة للبلاك ليست | Add to blacklist
• \`/blacklist remove <user>\` - إزالة من البلاك ليست | Remove from blacklist

**⚠️ تأثير البلاك ليست | Blacklist Effects:**
• منع التسجيل في السكريمات | Prevent scrim registration
• منع استخدام أوامر معينة | Block certain commands
• تطبيق فوري للقيود | Immediate restriction enforcement

**🔒 الحماية:** البلاك ليست محمية بنظام الصلاحيات
**🔒 Security:** Blacklist protected by permission system
            `)
            .setThumbnail(interaction.guild.iconURL());
        }
        else if (val === "permissions") {
          embed = new EmbedBuilder()
            .setTitle("🔧 إدارة الصلاحيات | Permission Management")
            .setColor("#F39C12")
            .setDescription(`
**⚙️ أوامر الصلاحيات:**
• \`/perms add <command> <role>\` - إضافة رول لأمر | Add role to command
• \`/perms remove <command> <role>\` - إزالة رول من أمر | Remove role from command
• \`/perms list [command]\` - عرض الصلاحيات | List permissions

**🎯 المميزات | Features:**
• تخصيص صلاحيات لكل أمر منفصل
• الإدمن لديه صلاحية كاملة دائماً  
• نظام رولات افتراضية للأمان
• Custom permissions per command
• Admins always have full access
• Default role system for security

**💡 مثال | Example:**
\`/perms add kick @Moderator\` - السماح للمودرين بالطرد
            `)
            .setThumbnail(interaction.guild.iconURL());
        }
        else if (val === "voice") {
          embed = new EmbedBuilder()
            .setTitle("🎙️ إدارة الصوتيات | Voice Management")
            .setColor("#3498DB")
            .setDescription(`
**🔊 أوامر الصوت:**
• \`/voice [channel]\` - الانتقال لقناة صوتية | Move to voice channel

**🤖 الحضور التلقائي | Auto Presence:**
• البوت متصل 24/7 في القناة الصوتية
• ضمان الاستقرار والجودة
• Bot connected 24/7 to voice channel  
• Ensures stability and quality

**📱 تكامل مع الخرائط | Map Integration:**
• أوامر الخرائط ترسل رسائل خاصة
• روابط مباشرة للرسائل
• تنبيهات للرولات المناسبة
            `)
            .setThumbnail(interaction.guild.iconURL());
        }
        else if (val === "advanced") {
          embed = new EmbedBuilder()
            .setTitle("⭐ الميزات المتقدمة | Advanced Features")
            .setColor("#9B59B6")
            .setDescription(`
**📊 الإحصائيات | Statistics:**
• \`/stats\` - عرض إحصائيات السيرفر الشاملة | Show comprehensive server statistics
• \`/userinfo [user]\` - معلومات مفصلة عن العضو | Detailed user information

**⏰ نظام التذكيرات | Reminder System:**
• \`/remind <time> <message>\` - إنشاء تذكير شخصي | Create personal reminder

**🎯 المميزات الخاصة | Special Features:**
• إحصائيات مفصلة للأعضاء والقنوات والرولات
• معلومات الانضمام وتاريخ إنشاء الحسابات
• نظام تذكيرات ذكي مع دعم عدة وحدات زمنية
• تتبع حالة البلاك ليست في معلومات الأعضاء

**💡 أمثلة | Examples:**
\`/remind 30m اجتماع الفريق\` - تذكير بعد 30 دقيقة
\`/userinfo @member\` - معلومات عن عضو معين
\`/stats\` - إحصائيات شاملة للسيرفر

**⚙️ وحدات الوقت المدعومة | Supported Time Units:**
• \`s\` = ثواني | seconds • \`m\` = دقائق | minutes
• \`h\` = ساعات | hours • \`d\` = أيام | days
            `)
            .setThumbnail(interaction.guild.iconURL());
        }
        else {
          embed = new EmbedBuilder()
            .setTitle("❌ خطأ | Error")
            .setDescription("فئة غير معروفة | Unknown category")
            .setColor("#E74C3C");
        }
        
        embed.setFooter({ 
          text: `VX E-Sports Bot | استخدم القائمة للعودة أو اختيار فئة أخرى`, 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();
        
        await interaction.update({ embeds: [embed], components: [] });
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;
    const cmd = interaction.commandName;
    const invokerMember = interaction.member;
    // استخدام النظام الجديد للصلاحيات
    const hasPermission = hasCommandPermission(invokerMember, cmd);

    // HELP MENU - نظام مساعدة احترافي
    if (cmd === "help") {
      const menu = new StringSelectMenuBuilder()
        .setCustomId("help_select")
        .setPlaceholder("🔍 اختر فئة من الأوامر | Choose a command category")
        .addOptions([
          { 
            label: "🕹️ أوامر السكريم | Scrim Commands", 
            value: "scrim",
            description: "إدارة التسجيلات والمباريات | Registration & match management"
          },
          { 
            label: "🛡️ الإشراف | Moderation", 
            value: "moderation",
            description: "أوامر الإشراف والعقوبات | Moderation & punishment commands"
          },
          { 
            label: "📢 الخرائط | Maps", 
            value: "maps",
            description: "إعلانات الخرائط | Map announcements"
          },
          { 
            label: "⛔ البلاك ليست | Blacklist", 
            value: "blacklist",
            description: "إدارة المحظورين | Banned users management"
          },
          { 
            label: "🔧 إدارة الصلاحيات | Permissions", 
            value: "permissions",
            description: "تخصيص صلاحيات الأوامر | Command permissions management"
          },
          { 
            label: "🎙️ الصوتيات | Voice", 
            value: "voice",
            description: "إدارة القنوات الصوتية | Voice channel management"
          },
          { 
            label: "⭐ الميزات المتقدمة | Advanced Features", 
            value: "advanced",
            description: "الإحصائيات والتذكيرات والمميزات المتقدمة | Stats, reminders & advanced features"
          }
        ]);
      
      const row = new ActionRowBuilder().addComponents(menu);
      
      const embed = new EmbedBuilder()
        .setTitle("🤖 VX E-Sports Bot - دليل المساعدة")
        .setDescription(`
**مرحباً بك في بوت VX E-Sports !**
**Welcome to VX E-Sports Professional Bot!**

📌 **استخدم القائمة أدناه لاستعراض الأوامر المتاحة**
📌 **Use the menu below to browse available commands**

💡 **نصائح:**
• الأوامر محمية بنظام صلاحيات متقدم
• يمكن تخصيص صلاحيات كل أمر باستخدام \`/perms\`
• الإدمن لديه صلاحية كاملة على جميع الأوامر

💡 **Tips:**
• Commands are protected by advanced permission system
• Each command permissions can be customized using \`/perms\`
• Admins have full access to all commands
        `)
        .setColor("#FF6B6B")
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({ 
          text: `طلب بواسطة ${interaction.user.tag} | Requested by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      return;
    }

    // ==== SCRIM COMMANDS ====
    if (["reg", "close_reg", "spare", "anno", "fb"].includes(cmd)) {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
    }

    if (cmd === "reg") {
      // فحص البلاك ليست
      if (interaction.member.roles.cache.has(CONFIG.BLACKLIST_ROLE_ID)) {
        return interaction.reply({ content: "❌ **أنت محظور من التسجيل في السكريمات**\n❌ **You are banned from registering in scrims**", ephemeral: true });
      }
      
      const time = interaction.options.getString("time");
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
      const msg = `**> - __أهلا بالجميع__**
      > - تم فتح التسجيل لاسكريم __${time || "عام"}__
      > - طريقه التسجيل __أسم التيم فقط__
      > - توحيد __2__
      > - برجاء الالتزام بقوانين الاسكريم لتجنب __البان__
      > - القوانين : __https://discord.com/channels/1357088796276949122/1363504038443876464__
      --------------------------------------
      > - Hello Everybody
      > - Registration Is Now Open For Scrim __${time || "عام"}__
      > - Registration Method Team Name Only
      > - Unification 2
      > - Please Adhere To The Scrim Rules To Avoid Getting banned 
      > -Rules : __https://discord.com/channels/1357088796276949122/1363504038443876464__
      ||@everyone||`;

      await interaction.reply({ content: msg,allowedMentions:{parse:["everyone"]} });
      return;
    }

    if (cmd === "close_reg") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      const msg = `
    ** > التسجيل قفل ودقايق والليست هتنزل عدم الحضور بدون عذر هيعرضك للبلاك ليست **

   > https://discord.com/channels/1357088796276949122/1363504050754031746
      
   --------------------------------------------------------
      
   > **𝖱𝖾𝗀𝗂𝗌𝗍𝗋𝖺𝗍𝗂𝗈𝗇 𝖠𝗇𝖽 𝖫𝗂𝗌𝗍 𝖶𝗂𝗅𝗅 𝖡𝖾 𝖱𝖾𝖺𝖽𝗒 𝖥𝖺𝗂𝗅𝗎𝗋𝖾 𝗍𝗈 𝗌𝗁𝗈𝗐 𝗎𝗉 𝗐𝗂𝗍𝗁𝗈𝗎𝗍 𝖺𝗇 𝖾𝗑𝖼𝗎𝗌𝖾 𝗐𝗂𝗅𝗅 𝖾𝗑𝗉𝗈𝗌𝖾 𝗒𝗈𝗎 𝗍𝗈 𝖡𝗅𝖺𝖼𝗄𝗅𝗂𝗌𝗍**

   > https://discord.com/channels/1357088796276949122/1363504050754031746
      
      `;

      await interaction.reply({ content: msg });
      return;
    }

    if (cmd === "spare") {
      // فحص البلاك ليست
      if (interaction.member.roles.cache.has(CONFIG.BLACKLIST_ROLE_ID)) {
        return interaction.reply({ content: "❌ **أنت محظور من التسجيل في السكريمات**\n❌ **You are banned from registering in scrims**", ephemeral: true });
      }
      
      const time = interaction.options.getString("time");
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
      const msg = `> تم فتح التسجيل لسبير اسكرم __${time}__
      
      > اسرع في تسجيلك لحتي يتم قبولك 
      
      --------------------------------------
      
      ** > Spare Registration Has Been Opened For Scrim __${time}__**
      
      > Be Fast With Your Registration To Be Accepted
      
      __ @here __`;

      await interaction.reply({ content: msg, allowedMentions: {parse: ["here"]} });
      return;
    }

    if (cmd === "anno") {
      const time = interaction.options.getString("time");
      const msg = `Name : VX E-Sports
      Scrim time : ${time}
      
      Reg Time : Opened
      
      Scrim Type : Mixed
      
      Link : https://discord.gg/NwAwfVpZ

      ----------------------------------------
      الاسم : VX E-Sports
      
      ميعاد السكريم : ${time}
      
      معاد التسجيل : مفتوح
      
      نوع السكريم : ميكسد
      
      الرابط : https://discord.gg/NwAwfVpZ`;

      await interaction.reply({ content: msg });
      return;
    }

    if (cmd === "fb") {
      const msg = `** > عاش لجميع اللعيبه ياريت لو استمتعت معانا اترك لنا فيدباك **
      ** > GG For All Players, We Hope You Have Good Time With Us**
      > If You Enjoy Plz Leave Us A Feedback
       ——————————————————————————————
      > **・__Room__ : https://discord.com/channels/1357088796276949122/1363504074648981605**
       ——————————————————————————————
      __** @here **__`;

      await interaction.reply({ content: msg, allowedMentions: {parse: ["here"]} });
      return;
    }
    // === CANCEL REGISTRATION ===
    if (cmd === "cancel_reg") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });

      const ch = interaction.channel;
      // قفل الشات لمنع أي تسجيل جديد
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

      // رسالة إلغاء السكريم
      const msg = `**ملغي لعدم اكتمال العدد تنورونا في سكريم تانيه**`;
      await interaction.reply({ content: msg });

      // optional: لوج لو حابب
      logToChannel(interaction.guild, `⚠️ Scrim cancelled by ${interaction.user.tag}`);
      return;
    }
    // === MAP ANNOUNCEMENTS era/mir/san ===
    if (["era", "mir", "san"].includes(cmd)) {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });

      const id = interaction.options.getString("id");
      const pass = interaction.options.getString("pass");
      const wait = interaction.options.getString("wait");
      const role = interaction.options.getRole("mention");

      // رسالة في الشات تذكر الرول مع بيانات الروم بصيغة قابلة للنسخ
      const chatMsg = `**> Map ${cmd.toUpperCase()}**

> iD : \`${id}\`

> Pass : ${pass}

> Wait : ${wait}

${role}`;

      // إرسال الرسالة في الشات أولاً
      await interaction.reply({ 
        content: chatMsg,
        allowedMentions: { roles: [role.id] } // ده لازم عشان الرول يتمنشن
      });

      // الحصول على الرسالة بعد إرسالها لنحصل على الرابط
      const sentMessage = await interaction.fetchReply();
      const messageLink = `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${sentMessage.id}`;

      // رسالة للخاص لكل أعضاء الرول مع لينك الرسالة
      const dmMsg = `**الايدي نزل الحق ادخل بسرعه**

🔗 **رابط الرسالة:** ${messageLink}`;
      
      role.members.forEach(m => {
        m.send(dmMsg).catch(() => {}); // نتجاهل لو حد مقفل DMs
      });
      return;
    }
    // ==== BLACKLIST ====
    if (cmd === "blacklist") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      const sub = interaction.options.getSubcommand();
      const user = interaction.options.getUser("user");
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: "❌ User not found.", ephemeral: true });
      const role = interaction.guild.roles.cache.get(CONFIG.BLACKLIST_ROLE_ID);
      if (sub === "add") {
        await member.roles.add(role);
        await interaction.reply({ content: `✅ Added ${user.tag} to blacklist`, ephemeral: true });
      } else {
        await member.roles.remove(role);
        await interaction.reply({ content: `✅ Removed ${user.tag} from blacklist`, ephemeral: true });
      }
      return;
    }

    // ==== ROLE MANAGEMENT ====
    if (cmd === "role") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      const sub = interaction.options.getSubcommand();
      const user = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: "❌ User not found.", ephemeral: true });
      
      if (sub === "add") {
        await member.roles.add(role);
        await interaction.reply({ content: `✅ Added role ${role.name} to ${user.tag}`, ephemeral: true });
      } else if (sub === "remove") {
        await member.roles.remove(role);
        await interaction.reply({ content: `✅ Removed role ${role.name} from ${user.tag}`, ephemeral: true });
      }
      return;
    }

    // ==== MODERATION ====
    if (cmd === "kick") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: "❌ User not found.", ephemeral: true });
      await member.kick(reason);
      await interaction.reply({ content: `✅ Kicked ${user.tag} | ${reason}` });
      return;
    }

    if (cmd === "ban") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: "❌ User not found.", ephemeral: true });
      await member.ban({ reason });
      await interaction.reply({ content: `✅ Banned ${user.tag} | ${reason}` });
      return;
    }

    if (cmd === "unban") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      const userid = interaction.options.getString("userid");
      await interaction.guild.members.unban(userid);
      await interaction.reply({ content: `✅ Unbanned user ID: ${userid}` });
      return;
    }

    if (cmd === "mute") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";
      const member = interaction.guild.members.cache.get(user.id);
      const mutedRole = await ensureMutedRole(interaction.guild);
      await member.roles.add(mutedRole);
      await interaction.reply({ content: `✅ Muted ${user.tag} | ${reason}` });
      return;
    }

    if (cmd === "unmute") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      const user = interaction.options.getUser("user");
      const member = interaction.guild.members.cache.get(user.id);
      const mutedRole = interaction.guild.roles.cache.find(r => r.name === "Muted");
      if (mutedRole) await member.roles.remove(mutedRole);
      await interaction.reply({ content: `✅ Unmuted ${user.tag}` });
      return;
    }

    if (cmd === "clear") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      const amount = interaction.options.getInteger("amount");
      await interaction.channel.bulkDelete(amount);
      await interaction.reply({ content: `✅ Cleared ${amount} messages`, ephemeral: true });
      return;
    }

    if (cmd === "lock") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ content: "🔒 Channel locked", ephemeral: true });
      return;
    }

    if (cmd === "unlock") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
      await interaction.reply({ content: "🔓 Channel unlocked", ephemeral: true });
      return;
    }

    if (cmd === "hide") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
      await interaction.reply({ content: "👁️‍🗨️ Channel hidden from everyone", ephemeral: true });
      return;
    }

    if (cmd === "unhide") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true });
      await interaction.reply({ content: "👁️ Channel visible to everyone", ephemeral: true });
      return;
    }

    // ==== PERMISSIONS MANAGEMENT ====
    if (cmd === "perms") {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
      
      const sub = interaction.options.getSubcommand();
      
      if (sub === "add") {
        const commandName = interaction.options.getString("command");
        const role = interaction.options.getRole("role");
        
        if (!CONFIG.COMMAND_PERMISSIONS.hasOwnProperty(commandName)) {
          return interaction.reply({ content: "❌ Command not found.", ephemeral: true });
        }
        
        const success = addRoleToCommand(commandName, role.id);
        if (success) {
          await interaction.reply({ content: `✅ Added role ${role.name} to command /${commandName}`, ephemeral: true });
        } else {
          await interaction.reply({ content: `❌ Role ${role.name} already has permission for /${commandName}`, ephemeral: true });
        }
      }
      
      else if (sub === "remove") {
        const commandName = interaction.options.getString("command");
        const role = interaction.options.getRole("role");
        
        if (!CONFIG.COMMAND_PERMISSIONS.hasOwnProperty(commandName)) {
          return interaction.reply({ content: "❌ Command not found.", ephemeral: true });
        }
        
        const success = removeRoleFromCommand(commandName, role.id);
        if (success) {
          await interaction.reply({ content: `✅ Removed role ${role.name} from command /${commandName}`, ephemeral: true });
        } else {
          await interaction.reply({ content: `❌ Role ${role.name} doesn't have permission for /${commandName}`, ephemeral: true });
        }
      }
      
      else if (sub === "list") {
        const commandName = interaction.options.getString("command");
        
        if (commandName) {
          if (!CONFIG.COMMAND_PERMISSIONS.hasOwnProperty(commandName)) {
            return interaction.reply({ content: "❌ Command not found.", ephemeral: true });
          }
          
          const roles = CONFIG.COMMAND_PERMISSIONS[commandName];
          const roleNames = roles.length > 0 ? 
            roles.map(roleId => {
              const role = interaction.guild.roles.cache.get(roleId);
              return role ? role.name : roleId;
            }).join(", ") : "Default roles + Administrator";
          
          const embed = new EmbedBuilder()
            .setTitle(`🔐 Permissions for /${commandName}`)
            .setDescription(roleNames)
            .setColor("Purple");
          await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
          const commands = Object.keys(CONFIG.COMMAND_PERMISSIONS);
          const embed = new EmbedBuilder()
            .setTitle("🔐 All Available Commands")
            .setDescription(commands.map(cmd => `/${cmd}`).join(", "))
            .setColor("Purple");
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }
      return;
    }

    // ==== VOICE ====
    if (cmd === "voice") {
      let ch = interaction.options.getChannel("channel") || interaction.member.voice.channel;
      if (!ch || !ch.isVoiceBased()) return interaction.reply({ content: "❌ Not a voice channel", ephemeral: true });
      const members = ch.members.map(m => m.user.tag).join("\n") || "Empty";
      const embed = new EmbedBuilder().setTitle(`🔊 Members in ${ch.name}`).setDescription(members).setColor("Blue");
      await interaction.reply({ embeds: [embed] });
      return;
    }

    // ==== PROFESSIONAL FEATURES ====
    
    // ==== ADVANCED FEATURES ====
    if (["stats", "userinfo", "remind"].includes(cmd)) {
      if (!hasPermission) return interaction.reply({ content: "❌ مش مسموحلك تستخدم الأمر ده.", ephemeral: true });
    }
    
    // SERVER STATISTICS
    if (cmd === "stats") {
      
      const guild = interaction.guild;
      const totalMembers = guild.memberCount;
      const humanMembers = guild.members.cache.filter(m => !m.user.bot).size;
      const botMembers = guild.members.cache.filter(m => m.user.bot).size;
      const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online').size;
      const roles = guild.roles.cache.size;
      const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
      const categories = guild.channels.cache.filter(c => c.type === 4).size;
      const emojis = guild.emojis.cache.size;
      const boostLevel = guild.premiumTier;
      const boosts = guild.premiumSubscriptionCount;
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 إحصائيات ${guild.name} | Server Statistics`)
        .setColor("#2ECC71")
        .setThumbnail(guild.iconURL())
        .addFields(
          {
            name: "👥 الأعضاء | Members",
            value: `**المجموع:** ${totalMembers}\n**أعضاء:** ${humanMembers}\n**بوتات:** ${botMembers}\n**متصل:** ${onlineMembers}`,
            inline: true
          },
          {
            name: "📝 القنوات | Channels", 
            value: `**نصية:** ${textChannels}\n**صوتية:** ${voiceChannels}\n**فئات:** ${categories}`,
            inline: true
          },
          {
            name: "🎭 أخرى | Others",
            value: `**الرولات:** ${roles}\n**الإيموجي:** ${emojis}\n**مستوى البوست:** ${boostLevel}\n**البوستات:** ${boosts}`,
            inline: true
          }
        )
        .setFooter({
          text: `تم إنشاء السيرفر | Server created`,
          iconURL: guild.iconURL()
        })
        .setTimestamp(guild.createdAt);
      
      await interaction.reply({ embeds: [embed] });
      return;
    }
    
    // USER INFO
    if (cmd === "userinfo") {
      
      const user = interaction.options.getUser("user") || interaction.user;
      const member = interaction.guild.members.cache.get(user.id);
      
      if (!member) {
        return interaction.reply({ content: "❌ العضو غير موجود في السيرفر | User not found in server", ephemeral: true });
      }
      
      const joinedAt = member.joinedAt;
      const createdAt = user.createdAt;
      const roles = member.roles.cache
        .filter(r => r.id !== interaction.guild.roles.everyone.id)
        .map(r => r.toString())
        .slice(0, 10);
      const isBlacklisted = member.roles.cache.has(CONFIG.BLACKLIST_ROLE_ID);
      const permissions = member.permissions.has(PermissionFlagsBits.Administrator) ? "إدمن | Administrator" : "عضو | Member";
      
      const embed = new EmbedBuilder()
        .setTitle(`👤 معلومات ${user.username} | User Info`)
        .setColor(isBlacklisted ? "#E74C3C" : "#3498DB")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: "📋 المعلومات الأساسية | Basic Info",
            value: `**الاسم:** ${user.tag}\n**الآيدي:** ${user.id}\n**الصلاحيات:** ${permissions}`,
            inline: false
          },
          {
            name: "📅 التواريخ | Dates",
            value: `**انضم للسيرفر:** <t:${Math.floor(joinedAt.getTime() / 1000)}:R>\n**إنشاء الحساب:** <t:${Math.floor(createdAt.getTime() / 1000)}:R>`,
            inline: false
          },
          {
            name: `🎭 الرولات (${roles.length}) | Roles`,
            value: roles.length > 0 ? roles.join(", ") : "لا توجد رولات | No roles",
            inline: false
          }
        )
        .setFooter({
          text: isBlacklisted ? "⚠️ هذا العضو محظور | This user is blacklisted" : `طلب بواسطة ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      return;
    }
    
    // REMINDER SYSTEM
    if (cmd === "remind") {
      
      const timeStr = interaction.options.getString("time");
      const message = interaction.options.getString("message");
      
      // Parse time
      const timeRegex = /^(\d+)([smhd])$/;
      const match = timeStr.match(timeRegex);
      
      if (!match) {
        return interaction.reply({ 
          content: "❌ **صيغة الوقت خاطئة!**\nاستخدم: `5m` (دقائق), `2h` (ساعات), `1d` (أيام)\n❌ **Invalid time format!**\nUse: `5m` (minutes), `2h` (hours), `1d` (days)", 
          ephemeral: true 
        });
      }
      
      const amount = parseInt(match[1]);
      const unit = match[2];
      
      let milliseconds;
      let unitText;
      
      switch (unit) {
        case 's':
          milliseconds = amount * 1000;
          unitText = `${amount} ثانية | ${amount} second${amount > 1 ? 's' : ''}`;
          break;
        case 'm':
          milliseconds = amount * 60 * 1000;
          unitText = `${amount} دقيقة | ${amount} minute${amount > 1 ? 's' : ''}`;
          break;
        case 'h':
          milliseconds = amount * 60 * 60 * 1000;
          unitText = `${amount} ساعة | ${amount} hour${amount > 1 ? 's' : ''}`;
          break;
        case 'd':
          milliseconds = amount * 24 * 60 * 60 * 1000;
          unitText = `${amount} يوم | ${amount} day${amount > 1 ? 's' : ''}`;
          break;
        default:
          return interaction.reply({ content: "❌ وحدة وقت غير صالحة | Invalid time unit", ephemeral: true });
      }
      
      if (milliseconds > 7 * 24 * 60 * 60 * 1000) { // 7 days max
        return interaction.reply({ 
          content: "❌ الحد الأقصى للتذكير 7 أيام | Maximum reminder time is 7 days", 
          ephemeral: true 
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle("⏰ تم إنشاء التذكير | Reminder Set")
        .setColor("#F39C12")
        .setDescription(`**الرسالة:** ${message}\n**الوقت:** ${unitText}`)
        .setFooter({ 
          text: `${interaction.user.tag} | سيتم إرسال التذكير في`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp(new Date(Date.now() + milliseconds));
      
      await interaction.reply({ embeds: [embed] });
      
      // Set reminder
      setTimeout(async () => {
        const reminderEmbed = new EmbedBuilder()
          .setTitle("🔔 تذكير | Reminder")
          .setColor("#E67E22")
          .setDescription(`**الرسالة:** ${message}`)
          .setFooter({ 
            text: `تم إنشاؤه منذ ${unitText} | Created ${unitText} ago`, 
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        try {
          await interaction.followUp({ content: `${interaction.user}`, embeds: [reminderEmbed] });
        } catch (err) {
          console.error("Reminder error:", err);
        }
      }, milliseconds);
      
      return;
    }

  } catch (err) {
    console.error("Interaction error:", err);
    if (interaction.replied || interaction.deferred) interaction.followUp({ content: "❌ Error occurred.", ephemeral: true });
    else interaction.reply({ content: "❌ Error occurred.", ephemeral: true });
  }
});

// keep 24/7 in voice
setInterval(ensureStayInVoice, 30_000);

// ---------- login ----------
client.login(CONFIG.TOKEN).catch(err => {
  console.error("Login failed — check TOKEN:", err);
});
