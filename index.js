const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const fs = require("fs");

// Load warnings file
let warnings = {};
if (fs.existsSync("./warnings.json")) {
    warnings = JSON.parse(fs.readFileSync("./warnings.json", "utf8"));
} else {
    fs.writeFileSync("./warnings.json", "{}");
}

// Create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Prefix
const prefix = process.env.PREFIX || "sun!";

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Message Commands
client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // LOCK
    if (command === "lock") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return message.reply("You need Manage Channels to lock this.");

        await message.channel.permissionOverwrites.edit(message.guild.id, {
            SendMessages: false
        });

        message.reply("🔒 Channel locked.");
    }

    // UNLOCK
    if (command === "unlock") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return message.reply("You need Manage Channels to unlock this.");

        await message.channel.permissionOverwrites.edit(message.guild.id, {
            SendMessages: true
        });

        message.reply("🔓 Channel unlocked.");
    }

    // SLOWMODE
    if (command === "slowmode") {
        const amount = parseInt(args[0]);
        if (isNaN(amount)) return message.reply("Give me a number in seconds.");

        await message.channel.setRateLimitPerUser(amount);
        message.reply(`🐌 Slowmode set to ${amount} seconds.`);
    }

    // WARN
    if (command === "warn") {
        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention someone to warn.");

        const reason = args.slice(1).join(" ") || "No reason given";

        if (!warnings[user.id]) warnings[user.id] = [];
        warnings[user.id].push(reason);

        fs.writeFileSync("./warnings.json", JSON.stringify(warnings, null, 2));

        message.reply(`⚠️ Warned ${user.tag}: ${reason}`);
    }

    // DELWARN
    if (command === "delwarn") {
        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention someone to clear warnings.");

        warnings[user.id] = [];
        fs.writeFileSync("./warnings.json", JSON.stringify(warnings, null, 2));

        message.reply(`🧹 Cleared all warnings for ${user.tag}.`);
    }

    // MUTE
    if (command === "mute") {
        const member = message.mentions.members.first();
        if (!member) return message.reply("Mention someone to mute.");

        let role = message.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) {
            role = await message.guild.roles.create({
                name: "Muted",
                permissions: []
            });

            message.guild.channels.cache.forEach(channel => {
                channel.permissionOverwrites.edit(role, { SendMessages: false });
            });
        }

        await member.roles.add(role);
        message.reply(`🔇 Muted ${member.user.tag}.`);
    }

    // UNMUTE
    if (command === "unmute") {
        const member = message.mentions.members.first();
        if (!member) return message.reply("Mention someone to unmute.");

        const role = message.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) return message.reply("There is no Muted role.");

        await member.roles.remove(role);
        message.reply(`🔊 Unmuted ${member.user.tag}.`);
    }
}); // <-- THIS closes messageCreate properly

// Login
client.login(process.env.TOKEN);
