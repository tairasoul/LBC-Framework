-- this is the framework for the host client, the client which processes everything

local Services = loadstring(game:HttpGet('https://raw.githubusercontent.com/fheahdythdr/FloppaMods/main/Utilities/Services.lua'))()
local plr = game:GetService'Players'.LocalPlayer; local plrs = plr.Parent
local plrw = plr.Character
local plrh = plrw:FindFirstChild('Humanoid')
local plrhrp = plrw:FindFirstChild('HumanoidRootPart')
local HTTP = Services["HttpService"]
local Send = loadstring(game:HttpGet('https://raw.githubusercontent.com/fheahdythdr/FloppaMods/main/Utilities/Notifications.lua'))():Init()
plr.CharacterAdded:Connect(function(nchar)
    plrhrp = nchar:WaitForChild('HumanoidRootPart')
    plrw = nchar
    plrh = plrw.Humanoid
end)

local function FindName(name)
    for _, v in next, game.Players:GetPlayers() do
        local subbedname = string.sub(v.Name:lower(), 1, string.len(name))
        local subbeddisplayname = string.sub(v.DisplayName:lower(), 1, string.len(name))
        
        if (subbedname == name) then
            return v.Name
        elseif (subbeddisplayname == name) then
            return v.Name
        end
    end
end

local permissionLevels = 5

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
    Prefix = "!"
}

Framework.addPermission = function(permission)
    Framework.Permissions.permissionTable.players[permission] = {}
    Framework.Permissions.permissionTable.commands[permission + 1] = {}
    Framework.Permissions.permPermissionTable.players[permision + 1] = {plr.Name}
    permissionLevels = table.maxn(Framework.Permissions.permissionTable.players)
    table.remove(Framework.Permissions.permPermissionTable.players[permission - 1], table.find(Framework.Permissions.permPermissionTable.players[permission - 1], plr.name))
end

Framework.readPermWhitelist = function(file)
    Framework.Permissions.permPermissionTable = HTTP:JSONDecode(readfile(file))
end

Framework.savePermWhitelist = function(file)
    writefile(file, HTTP:JSONEncode(Framework.Permissions.permPermissionTable))
end

Framework.addCommand = function(name, callback, params, permLevel, ...)
    local aliases = ...
    local insertTable = {}
    insertTable.names = {name, aliases}
    insertTable.callback = callback
    if params then
        insertTable.params = params
    end
    insertTable.permLevel = permLevel
    table.insert(Framework.Commands, insertTable)
    local permTableInsert = {}
    permTableInsert.names = {name, alias}
    table.insert(Framework.Permissions.permissionTable.commands[permLevel], permTableInsert)
end

local function tryExec(msg, args, playerPerms, cmdperm, player)
    if not playerPerms then playerPerms = 1 end
    for i,v in next, Framework.Commands do
        if table.find(v.names, msg) then
            if (tonumber(playerPerms) >= tonumber(cmdperm)) or tonumber(cmdperm) == 1 then
                local realmessage = ""
                if #string.split(args, " ") > 2 then
                    for a = 1,#string.split(args, " ") do
                        if a == 1 then
                            realmessage = string.split(args, " ")[a]
                        else
                            realmessage = realmessage.." "..string.split(args, " ")[a]
                        end
                    end
                else
                    if #string.split(args, " ") == 2 then
                        realmessage = string.split(args, " ")[1].." "..string.split(args, " ")[2]
                    else
                        realmessage = string.split(args, " ")[1]
                    end
                end
                v.callback(realmessage)
                return
            end
        end
    end
end

Framework.processChatMessage = function(data) 
    local player = tostring(data.FromSpeaker)
    local message = tostring(data.Message)
    print(player.." "..message)
    local playerperm, cmdperm
    for i = 1, permissionLevels - 1 do
        if table.find(permissionTable.players[i], player) then
            print("found perm ")
            playerperm = i
        end
    end
    if not playerperm then
        for i = 1, permissionLevels do
            if table.find(permPermissionTable.players[i], player) then
                print("found perm ")
                playerperm = i
            end
        end
    end
    if string.sub(message, 1, 1) == Framework.Prefix then
        local newmsg = ""
        local command = string.sub(message, 2, string.len(string.split(message, " ")[1]))
        for i = 1, permissionLevels do
            for x,v in next, permissionTable.commands[i] do
                if table.find(v.names, command) then
                    print("found cmd ")
                    cmdperm = i
                end
            end
        end
        for i = 2, #string.split(message, " ") do
            if i == 2 then
                newmsg = string.split(message, " ")[i]
            else
                newmsg = newmsg.." "..string.split(message, " ")[i]
            end
        end
        tryExec(command, newmsg, playerperm, cmdperm, player)
    end
end

local WebsocketPermission

Framework.processWebsocket = function(msg)
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
            for i = 1, permissionLevels do
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
            tryExec(command, newmsg, playerperm, cmdperm)
        end
    end
    if string.sub(msg, 1, 13) == "receiveSynced" then
        local decodeTable = string.sub(msg, 15, 5000)
        local DecodeAttempt = HTTP:JSONDecode(decodeTable)
        if DecodeAttempt then
            Framework.Bots = DecodeAttempt
        end
    end
end

Framework.Connect = function(wsaddress)
    Framework.WS = syn.websocket.connect(wsaddress)
    Framework.WS.OnMessage:Connect(Framework.processWebsocket)
    Framework.WS:send("HostConnect")
    Framework.WS:send("getOldPlayerList")
end

return Framework
