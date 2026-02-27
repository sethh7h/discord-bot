if (!process.env.DISCORD_TOKEN) {
    require("dotenv").config();
}

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const prefix = "!";

client.on("ready", () => {
    console.log(`Bot ligado como ${client.user.tag}`);
});

// Função para enviar mensagens temporárias
async function sendTempMessage(channel, content) {
    const msg = await channel.send(content);
    setTimeout(() => msg.delete().catch(() => {}), 10000);
}

// Função para encontrar canal de logs
function getLogChannel(guild) {
    return guild.channels.cache.find(ch => ch.name.toLowerCase() === "logs");
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    // APAGA A MENSAGEM DO USUÁRIO AO USAR O COMANDO
    message.delete().catch(() => {});

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const logChannel = getLogChannel(message.guild);

    // ---------- CLEAR ----------
    if (command === "clear") {
        const amount = parseInt(args[0]);

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
            return sendTempMessage(message.channel, "❌ Você não tem permissão.");

        if (!amount || amount < 1 || amount > 100)
            return sendTempMessage(message.channel, "❌ Use: `!clear 1-100`");

        await message.channel.bulkDelete(amount, true);
        sendTempMessage(message.channel, `🧹 Apaguei **${amount}** mensagens.`);

        if (logChannel) logChannel.send(`🧹 ${message.author} deletou **${amount}** mensagens no canal ${message.channel}.`);
    }

    // ---------- KICK ----------
    if (command === "kick") {
        const user = message.mentions.users.first();
        if (!user) return sendTempMessage(message.channel, "❌ Use: `!kick @user`");

        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return sendTempMessage(message.channel, "❌ Sem permissão.");

        const member = message.guild.members.cache.get(user.id);
        await member.kick();

        sendTempMessage(message.channel, `👢 Expulsei **${user.tag}**.`);

        if (logChannel) logChannel.send(`👢 ${message.author} expulsou **${user.tag}**.`);
    }

    // ---------- BAN ----------
    if (command === "ban") {
        const user = message.mentions.users.first();
        if (!user) return sendTempMessage(message.channel, "❌ Use: `!ban @user`");

        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return sendTempMessage(message.channel, "❌ Sem permissão.");

        const member = message.guild.members.cache.get(user.id);
        await member.ban();

        sendTempMessage(message.channel, `🔨 Bani **${user.tag}**.`);

        if (logChannel) logChannel.send(`🔨 ${message.author} baniu **${user.tag}**.`);
    }

    // ---------- MUTE ----------
    if (command === "mute") {
        const user = message.mentions.users.first();
        const time = args[1];

        if (!user) return sendTempMessage(message.channel, "❌ Use: `!mute @usuario tempo`");
        if (!time) return sendTempMessage(message.channel, "❌ Exemplo: `!mute @usuario 10m`");

        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers))
            return sendTempMessage(message.channel, "❌ Sem permissão.");

        let mutedRole = message.guild.roles.cache.find(r => r.name === "Muted");
        const member = message.guild.members.cache.get(user.id);

        if (!mutedRole) {
            mutedRole = await message.guild.roles.create({
                name: "Muted",
                permissions: []
            });

            message.guild.channels.cache.forEach(async (channel) => {
                await channel.permissionOverwrites.edit(mutedRole, {
                    SendMessages: false,
                    Speak: false,
                    AddReactions: false
                });
            });
        }

        // Converte tempo tipo 10m
        const amount = parseInt(time.slice(0, -1));
        const type = time.slice(-1);
        let ms = 0;

        if (type === "s") ms = amount * 1000;
        else if (type === "m") ms = amount * 60000;
        else if (type === "h") ms = amount * 3600000;
        else if (type === "d") ms = amount * 86400000;
        else return sendTempMessage(message.channel, "❌ Tempo inválido.");

        await member.roles.add(mutedRole);
        sendTempMessage(message.channel, `🔇 **${user.tag}** foi mutado por **${time}**.`);

        if (logChannel) logChannel.send(`🔇 ${message.author} mutou **${user.tag}** por ${time}.`);

        setTimeout(async () => {
            if (member.roles.cache.has(mutedRole.id)) {
                await member.roles.remove(mutedRole);
                if (logChannel) logChannel.send(`🔊 **${user.tag}** foi automaticamente desmutado.`);
            }
        }, ms);
    }

    // ---------- UNMUTE ----------
    if (command === "unmute") {
        const user = message.mentions.users.first();
        if (!user) return sendTempMessage(message.channel, "❌ Use: `!unmute @usuario`");

        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers))
            return sendTempMessage(message.channel, "❌ Sem permissão.");

        const member = message.guild.members.cache.get(user.id);
        const mutedRole = message.guild.roles.cache.find(r => r.name === "Muted");

        if (!mutedRole) return sendTempMessage(message.channel, "❌ O cargo Muted não existe.");

        await member.roles.remove(mutedRole);
        sendTempMessage(message.channel, `🔊 **${user.tag}** foi desmutado.`);

        if (logChannel) logChannel.send(`🔊 ${message.author} desmutou **${user.tag}**.`);
    }

    // ---------- COMANDOS DE GIF ----------
const gifs = {
    kiss: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWIzaDZwbXp5bjhudHRmanl1cDN1Z3d1bjJqeXgyNW1pMmprdW83MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zkppEMFvRX5FC/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWIzaDZwbXp5bjhudHRmanl1cDN1Z3d1bjJqeXgyNW1pMmprdW83MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/G3va31oEEnIkM/giphy.gif"
    ],
    hug: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnpkcnUwajIzZzBiOXNwN2Jtb2M5Mjc1aGV1dGV6cnNnYmlkNWtqOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/QFPoctlgZ5s0E/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnpkcnUwajIzZzBiOXNwN2Jtb2M5Mjc1aGV1dGV6cnNnYmlkNWtqOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qscdhWs5o3yb6/giphy.gif",
        "https://tenor.com/bX3Pr.gif"
    ],
    slap: [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXpyaHY4c2cwenVucmZ4ZGhxbWE3b2JsMWZpcGx1dWE3c25tN2ZxZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xUNd9HZq1itMkiK652/giphy.gif",
        "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExa3U0Mm91MTFjMDR0YTVwM3ozbGRrb210M3lxOGFzN3YyaTVwMzFodiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Gf3AUz3eBNbTW/giphy.gif"
    ],
    kill: [
        "https://tenor.com/bo2IQ.gif",
        "https://tenor.com/rSawa8MyHQT.gif"
    ],
    seduce: [
        "https://tenor.com/qwV9PfgKHPh.gif",
        "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Z3NyeTRxZDdqcHBmd3Jwa2MyNzdva2V4Y3lsNDE3dHR0djN4bXkyMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5QhTbwPxhCC7S/giphy.gif"
    ]
};

if (["kiss", "hug", "slap", "kill","seduce"].includes(command)) {
    const user = message.mentions.users.first();
    if (!user) return sendTempMessage(message.channel, `❌ Use: !${command} @usuario`);

    const gif = gifs[command][Math.floor(Math.random() * gifs[command].length)];

    const embed = {
        description: ` **${message.author} ${command} ${user}!**`,
        image: { url: gif }
    };

    const msg = await message.channel.send({ embeds: [embed] });

    setTimeout(() => msg.delete().catch(() => {}), 20000);

    if (logChannel) logChannel.send(`🎞 ${message.author} usou **${command}** em ${user}.`);
}

});

client.login(process.env.DISCORD_TOKEN); 
