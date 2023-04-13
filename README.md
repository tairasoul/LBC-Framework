# LBC-Framework

This is a framework for making bot controls using a websocket-based backend.
It is currently still kinda in progress, so feel free to suggest features through Issues.

# Supported executors

Currently this supports Synapse X, Script-Ware and KRNL.
If there are any other executors that have websocket support, open an issue and include the name of the executor and how to access its websocket library.

# Documentation for hostFramework.lua

## What you have access to

From the start, you have access to this table.
```lua
local Framework = {
    ShortenedNameFinder = function(name)
        for _, v in next, game.Players:GetPlayers() do
            local subbedname = string.sub(v.Name:lower(), 1, string.len(name))
            local subbeddisplayname = string.sub(v.DisplayName:lower(), 1, string.len(name))
            
            if (subbedname == name) then
                return v.Name
            elseif (subbeddisplayname == name) then
                return v.Name
            end
        end
    end,
    Permissions = {
        permissionTable = {
            players = {
                [1] = {},
                [2] = {},
                [3] = {},
                [4] = {}
            },
            commands = {
                [1] = {},
                [2] = {},
                [3] = {},
                [4] = {},
                [5] = {}
            }
        },
        permPermissionTable = {
            players = {
                [1] = {},
                [2] = {},
                [3] = {},
                [4] = {},
                [5] = {plr.Name}
            }
        }
    },
    Commands = {},
    WS = null,
    Bots = {},
    Prefix = "!",
    permissionLevels = 5
}
```

This is mostly used internally, but you can use the ShortenedNameFinder and the WS object to do some custom things, or change prefix.

## Adding custom permission levels

To add custom permission levels, you simply do

```lua
Framework.addPermission(permission) -- Permission has to be a number above 5.
```

From there on, the addCommand function will let you add commands to that permission level. Normal whitelists are intentionally 1 below the perm whitelists.

##### Saving and reading the permenant whitelists

Saving and reading the permenant whitelist is done manually, through Framework.readPermWhitelist and Framework.savePermWhitelist.

To save it, you do

```lua
Framework.savePermWhitelist(filePath) -- filePath is the path to a file, relative to the workspace folder of the executor.
```

To read it, you do the same but with readPermWhitelist.

## Adding commands

To add a command, you do

```lua
Framework.addCommand(name, callback, params, permLevel, aliases) -- Callback is a function, with a msg param that contains a single string with every argument. If you have more than one argument, and each one contains spaces, you'll have to do some manual processing. Aliases simply takes the rest of the arguments after permLevel and adds them as aliases for the command.
```

Keep in mind you must register the command on both the client and the host, with appropriate functions on both ends.

## Processing chat messages

By processing chat messages, you can use the permission system to whitelist people to certain levels of commands.

To process every message sent in chat, you do

```lua
-- this was taken from Infinite Yield, as it was the only open source script i knew that had the correct method of getting chat messages
local ChatEvents = game:GetService("ReplicatedStorage"):WaitForChild("DefaultChatSystemChatEvents", math.huge)
local OnMessageEvent = ChatEvents:WaitForChild("OnMessageDoneFiltering", math.huge)
-- if you want to do some processing, you'll have to do this
OnMessageEvent.OnClientEvent:Connect(function(data)
  -- do processing
  Framework.processChatMessage(processed)
end)
-- otherwise it's just
OnMessageEvent.OnClientEvent:Connect(Framework.processChatMessage)
```

## Processing websocket messages

The framework automatically starts processing websocket messages, so you'll have to change the Connect command to process them, or do it manually.

To process a websocket message, you just do

```lua
Framework.WS.OnMessage:Connect(Framework.processWebsocket)
```

If you want to do manual processing, you will have to connect to a websocket manually.
The framework exposes the executor's websocket library, so you can just do

```lua
local ws = Framework.ExecutorWebsocket.connect(wsaddress) -- wsaddress being ws://address:port
Framework.WS = ws
```

After that, you must start processing the messages by connecting to the OnMessage event.

```lua
-- if you want to do fully custom processing, add this variable
local WebsocketPermission

ws.OnMessage:Connect(function(msg)
  -- process
  Framework.processWebsocket(msg)
  -- only use Framework.processWebsocket if you want to do some basic processing and then send the message to the framework, otherwise redo hostFramework.lua's steps for websocket processing.
  -- if you want to do your own processing, use Framework.tryExec(command, newmsg, playerperm, cmdperm). command being the command name, newmsg being all the args, playerperm being the permission of the user trying to send the command, and cmdperm being the permission of the command they're trying to use.
  -- you do need the following no matter what if you're doing fully custom processing
  if string.find(msg, "New player:") then
        local newMsg = string.split(msg, " ")[3]
        if not table.find(Framework.Bots, newMsg) then
            table.insert(Framework.Bots, newMsg)
            ws:Send("syncBots "..HTTP:JSONEncode(Framework.Bots))
        end
        task.spawn(function()
            task.wait(10)
            ws:Send("syncBots "..HTTP:JSONEncode(Framework.Bots))
            ws:Send("getBotNumbers")
        end)
    end
    if string.split(msg, " ")[1] == "WSPerm" then
        WebsocketPermission = tonumber(string.gsub(msg, "WSPerm ", ""))
    end
    if string.split(msg, " ")[1] == "WSC" then
        local cmd = string.gsub(msg, "WSC ", "")
        if not sayingCMDS then
            local newmsg = ""
            local cmdperm
            local command = string.sub(cmd, 1, string.len(string.split(cmd, " ")[1]))
            local playerperm = WebsocketPermission
            for i = 1, Framework.permissionLevels do
                for x,v in next, Framework.Permissions.permissionTable.commands[i] do
                    if table.find(v.names, command) then
                        print("found cmd")
                        cmdperm = i
                    end
                end
            end
            for i = 2, #string.split(cmd, " ") do
                if i == 2 then
                    newmsg = string.split(cmd, " ")[i]
                else
                    newmsg = newmsg.." "..string.split(cmd, " ")[i]
                end
            end
            print(command)
            print(newmsg)
            print(playerperm)
            print(cmdperm)
            print(cmd)
            Framework.tryExec(command, newmsg, playerperm, cmdperm)
        end
    end
    if string.sub(msg, 1, 13) == "receiveSynced" then
        local decodeTable = string.sub(msg, 15, 5000)
        local DecodeAttempt = HTTP:JSONDecode(decodeTable)
        if DecodeAttempt then
            Framework.Bots = DecodeAttempt
        end
    end
    -- these are important for internal use
end)
```

From there on, you have to do the initialization to the server.
The initialization is

```lua
ws:Send("HostConnect")
ws:Send("getOldPlayerList")
```

After that, it should work the same as using Framework.Connect().

##### Connecting to a websocket using Framework.Connect

If you want to skip doing all the websocket message processing manually, simply do

```lua
Framework.Connect(wsaddress) -- wsaddress being ws://address:port
```

This will connect you to the websocket, and initialize with the server.
You do not need to set up manual websocket message processing after doing this.

# Documentation for clientFramework.lua

## This documentation doesn't really have much, as the bots do little to no processing.

## Adding commands

To add a command, you simply do

```lua
Framework.addCommand(commandName, function) -- function gets a param passed to it, remember to have that in the function() thing.
```

## Connecting to the websocekt

To connect to the websocket and initialize with the server and the host, you do

```lua
Framework.Connect(wsaddress) -- wsaddress being ws://address:port
```

# Extra info

Trello page is at https://trello.com/b/64dkdM47/lbc-framework

# Unrelated info

LBC came from the roblox username I was using when testing my original bot control, username being ALiteralBaseplate and display name being LiteralBaseplate (the game I was testing on was A Literal Baseplate), and the BC coming from the fact that I was making a bot control.
