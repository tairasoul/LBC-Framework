-- this is the framework used for the bots the host client talks to

local Services = loadstring(game:HttpGet('https://raw.githubusercontent.com/fheahdythdr/legendary-train/main/Utilities/Utilities.lua'))()
local plr = game:GetService'Players'.LocalPlayer; local plrs = plr.Parent
local plrw = plr.Character
local plrh = plrw:FindFirstChild('Humanoid')
local plrhrp = plrw:FindFirstChild('HumanoidRootPart')
local HTTP = Services["HttpService"]
local Send = loadstring(game:HttpGet('https://raw.githubusercontent.com/fheahdythdr/legendary-train/main/Utilities/Notifications.lua'))():Init()
plr.CharacterAdded:Connect(function(nchar)
    plrhrp = nchar:WaitForChild('HumanoidRootPart')
    plrw = nchar
    plrh = plrw.Humanoid
end)

local web = (syn and syn.websocket) or (WebSocket) or nil

if web == nil then
    error("Your executor does not support WebSocket, or it is not implemented in the src of clientFramework.lua.")
end

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
    Commands = {},
    Websocket = null,
    Bots = {},
    BotNumber = null,
    ExecutorWebsocket = web
}

Framework.addCommand = function(command, func)
    local currentComandAdd = {}
    currentComandAdd.name = command
    currentComandAdd.callback = func
    table.insert(Framework.Commands, currentComandAdd)
end

local function tryExec(command, args)
    for _, v in next, Framework.Commands do
        if v.name == command then
            v.callback(args)
        end
    end
end

Framework.processWebsocket = function(msg)
    local command = string.split(msg, " ")[1]
    local args = string.sub(msg, command:len() + 2)
    tryExec(command, args)
end

Framework.Connect = function(wsaddress)
    Framework.Websocket = web.connect(wsaddress)
    Framework.Websocket:send("New player: "..plr.Name)
    Framework.Websocket.OnMessage:Connect(Framework.processWebsocket)
end

Framework.addCommand("syncBots", function(msg)
    Framework.Bots = HTTP:JSONDecode(msg)
end)

Framework.addCommand("getBotNumbers", function()
    for i, play in next, Framework.Bots do
        if play == plr.Name then
            Framework.BotNumber = i
        end
    end
end)

return Framework
