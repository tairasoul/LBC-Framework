# LBC-Framework Backend

This is the backend for LBC-Framework.

You must configure config.json to use certain aspects of it.
If you want to use the discord bot, you must set the token, clientId and guildId, along with setting useDiscordBot to true.
To set the hosting ip, you change hostingIP.
To set the port, you change port.
If you want to poll the WEAO API for exploit updates, change pollWEAOAPI

Additional configuration can be done in bot.js, being at the client creation and the messageCreate.

Change the channel id that it compares the message's channel id to the channel you want to limit the commands to.
If you add more permission levels with roles, you add more checks.
If you use different role names, change the string at each `role => role.name === ''` to the role name.

If you want to enable and disable the discord commands, add your own Discord ID into the string where it checks the message author's id.

If you want to add custom / commands, use my custom command builder.
Embeds are made using the embed class.
Eris works at a lower-ish level, compared to discord.js.
This means that you will have to learn the Discord API a bit too.

My modified files for discord-eris-embeds will be included, as I modified those a bit to add proper declaration files and add a function.
