const eris = require("eris");
// you have to set clientId, guildId and token manually in the config
const {token, clientId, guildId, pollWEAOAPI, useDiscordBot, hostingIP, port} = require('./config.json');
const Discord = require('discord.js');
const collection = Discord.Collection
const cbuilder = require("./lib/commandbuilder");
const embed = require('discord-eris-embeds');
const fs = require("node:fs");
const wss = require("ws");

let hostClient;

const wsServer = new wss.Server({
    port: port,
    host: hostingIP
});

const playerList = [];

wsServer.on("connection", (socket) => {
    socket.on("message", (msg) => {
    console.log(msg.toString());
        if (msg.toString().startsWith('New player: ')) {
            console.log(msg.toString());
            hostClient.send(msg.toString())
            if (playerList.indexOf(msg.toString().split(' ')[2]) > -1) {
                playerList.push(msg.toString().split(' ')[2]);
            }
            else {
                console.log("Player already exists.")
            }
        }
        else if (msg.toString() == "getOldPlayerList") {
            wsServer.clients.forEach((i,v) => {
                if (i==hostClient) {
                    i.send("receiveSynced " + JSON.stringify(playerList))
                }
            })
        }
        else if (msg.toString() == "HostConnect") {
            hostClient = socket
        }
        else {
            wsServer.clients.forEach((i, v) => {
                if (i!=hostClient) {
                    i.send(msg.toString())
                }
            })
        }
    })
})

if (useDiscordBot) {
    let on = true;
    // change intents and other things to whatever you need
    // this is just taken from my personal version
    const Eris = eris(token, {
        intents: [
            'guildMembers',
            'guilds',
            'guildMessages',
            'guildPresences',
            'guildMessageReactions'
        ],
        allowedMentions: {
            everyone: true,
            users: true,
            roles: true,
            repliedUser: true
        },
        connectionTimeout: 300000,
        maxReconnectAttempts: Infinity,
        requestTimeout: 300000
    })


    // if you don't want to auto-reconnect upon erroring then remove this
    // it's left over from my personal version which i intend to run 24/7
    Eris.on("error", (err, id) => {
        if (id == 1006) {
            Eris.connect();
        }
        console.error(err.message, err.stack, err.name)
    })

    Eris.on('messageCreate',(message)=>{
        // change channel id to the channel you want to limit the commands to
        if (message.channel.id == "1038813376345800744") {
            if (message.author.bot || message.author.webhook) return;
            // change names for each perm, add new check for each custom perm you add
            const perm1 = message.member.roles.some(role => role.name === 'perm 1');
            const perm2 = message.member.roles.some(role => role.name === 'perm 2');
            const perm3 = message.member.roles.some(role => role.name === 'perm 3');
            const perm4 = message.member.roles.some(role => role.name === 'perm 4');
            const perm5 = message.member.roles.some(role => role.name === 'perm 5');
            let permtoSend;
            if (perm1 != false) {
                permtoSend = "1";
            }
            if (perm2 != false) {
                permtoSend = "2";
            }
            if (perm3 != false) {
                permtoSend = "3";
            }
            if (perm4 != false) {
                permtoSend = "4";
            }
            if (perm5 != false) {
                permtoSend = "5";
            }
            console.log(message.author.bot);
            console.log(message.author.discriminator);
            // put your own discord ID in here
            if (message.author.bot == false&&(message.author.id=="")){
                if (message.content=="!enable_Discord"){
                    on = true;
                    message.reply('Discord enabled.');
                    return;
                }
                if (message.content=="!disable_Discord"){
                    on = false;

                    message.reply('Discord disabled.');
                    return;
                }
            }
            if (message.author.bot == false&&on==true&&message.content!="!enable_Discord"&&message.content!="!disable_Discord"&&hostClient){
                // change reaction to whatever you want or make it reply
                message.addReaction('🤖');
                hostClient.send("WSPerm " + permtoSend);
                hostClient.send("WSC " + message.content);
            }
        }
    })

    const ecommands = new collection()
    const constants = eris.Constants

    // you can add your own commands here, using my custom command builder cus eris' command builder was too complex for me
    // it's way more low level though

    const cmdArray = [
        {
            data: new cbuilder()
            .setName("uptime")
            .setDescription("Get bot uptime.")
            .setType(1).constr(),
            async execute(interaction) {
                let totalSeconds = (Eris.uptime / 1000);
                let days = Math.floor(totalSeconds / 86400);
                totalSeconds %= 86400;
                let hours = Math.floor(totalSeconds / 3600);
                totalSeconds %= 3600;
                let minutes = Math.floor(totalSeconds / 60);
                let seconds = Math.floor(totalSeconds % 60);
                const newEmbed = new embed()
                .setTitle("Bot Uptime")
                .setDescription("Uptime for " + Eris.user.username)
                .addFields(
                    {name: "\u200b", value: "\u200b"},
                    {name: "Days", value: String(days), inline: true},
                    {name: "Hours", value: String(hours), inline: true},
                    {name: "Minutes", value: String(minutes), inline: true},
                    {name: "Seconds", value: String(seconds), inline: true}
                )
                .setColor(Discord.resolveColor([50, 50, 175]));
                await interaction.createMessage(newEmbed.create);
            }
        }
    ]

    Eris.once("ready", ()=>{
        async function addCommands(cmd) {
            for (const command of cmd) {
                ecommands.set(command.data.name, command);
                await Eris.createGuildCommand(guildId, command.data)
            }
        }
        
        addCommands(cmdArray);
    })

    Eris.on('interactionCreate', async interaction => {
        console.log(interaction.type)
        if (!interaction.type == 2) return;
        const command = ecommands.get(interaction.data.name);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            if (error) console.error(error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.createMessage(`There was an error while executing this command, error is ${error}`);
            }
            else if (interaction.replied || interaction.deferred) {
                await interaction.editMessage(`There was an error while executing this command, error is ${error}`);
            }   
        }
    });

    Eris.connect()

    if (pollWEAOAPI) {
        setInterval(async () => {
            const fetch = await import('node-fetch').then(m => m.default);
            /*fetch('https://api.whatexploitsare.online/status')
            .then(response => response.json())
            .then(data => {
                for (let item of data) {
                for (let name in item) {
                    if (name !== "ROBLOX") {
                        console.log(name);
                        console.log(item[name].updated);
                        console.log(item[name].exploit_version);
                    }
                }
                }
            });*/
            try {
                //console.log("=================================================================================================================")
                const response = await fetch('https://api.whatexploitsare.online/status');
                const data = await response.json();
                for (let item of data) {
                    for (let name in item) {
                        //console.log(name, item)
                        const info = item[name];
                        if (name !== "ROBLOX") {
                            const upd = info.updated
                            const exver = info.exploit_version;
                            const lastupd = info.last_update_unix;
                            let exploitDBFetched;
                            for (const exploit of exploitStatusDB) {
                                if (exploit.name == name) exploitDBFetched = exploit
                            }
                            //console.log(exploitDBFetched);
                            //console.log(exver)
                            if (!exploitDBFetched || exploitDBFetched.exploitver === undefined) {
                                const infothings = {
                                    exploitver: exver,
                                    name: name
                                }
                                exploitStatusDB.push(infothings)
                                fs.writeFileSync(__dirname + "/exploitdata/exploits.json", JSON.stringify(exploitStatusDB));
                            }
                            else {
                                const embedb = new embed();
                                const exploitDBVer = exploitDBFetched.exploitver;
                                if (exploitDBVer != exver) {
                                    exploitDBFetched.exploitver = exver;
                                    fs.writeFileSync(__dirname + "/exploitdata/exploits.json", JSON.stringify(exploitStatusDB));
                                    embedb.setTitle(`${name} has updated.`);
                                    embedb.addFields({name: "\u200b", value: "\u200b"})
                                    if (upd) {
                                        embedb.addFields(
                                            {name: 'Exploit Version', value: exver, inline: true},
                                            {name: 'Update Time', value: "<t:" + lastupd + ">", inline: true},
                                        );
                                    }
                                    await Eris.getChannel('1049479870763245609').createMessage(embedb.create)
                                }
                            }
                        }
                        else {
                            const robloxinfo = info
                            const robloxver = robloxinfo.version
                            const robloxlastupd = robloxinfo.last_update_unix
                            let robloxFetched;
                            for (const exploit of exploitStatusDB) {
                                if (exploit.name == "ROBLOX") robloxFetched = exploit
                            }
                            //console.log(robloxFetched)
                            //console.log(robloxver)
                            if (!robloxFetched) {
                                const info = {
                                    version: robloxver,
                                    name: "ROBLOX"
                                }
                                exploitStatusDB.push(info);
                                fs.writeFileSync(__dirname + "/exploitdata/exploits.json", JSON.stringify(exploitStatusDB));
                            }
                            else {
                                const embedb = new embed();
                                if (robloxFetched.version != robloxver) {
                                    robloxFetched.version = robloxver
                                    fs.writeFileSync(__dirname + "/exploitdata/exploits.json", JSON.stringify(exploitStatusDB));
                                    embedb.setTitle("ROBLOX UPDATE")
                                    .setDescription("Roblox has updated. All exploits are offline.")
                                    .addFields(
                                        {name: "VERSION", value: robloxver, inline: true},
                                        {name: "LAST UPDATED", value: "<t:" + robloxlastupd + ">", inline: true}
                                    )
                                    await Eris.getChannel('1049479870763245609').createMessage(embedb.create)
                                }
                            }
                        }
                    }
                }
            } catch (err) {
    
            }
        }, 10000)
    }
}
