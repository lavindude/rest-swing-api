var express = require('express');
var app = express();
const port = process.env.PORT || 4000

const startX = 5
const startY = 48
const startZ = 0
const maxHealth = 300

// const connectedPlayers = []
// const lobbies = []

// sample data (hard coded):
const connectedPlayers = [{id: 1, positionX: 2, positionY: 48, positionZ: 0, health: maxHealth, isDead: false, flagsTaken: []},
                           {id: 2, positionX: 4, positionY: 48, positionZ: 0, health: maxHealth, isDead: false, flagsTaken: []},
                           {id: 3, positionX: 6, positionY: 48, positionZ: 0, health: maxHealth, isDead: false, flagsTaken: []},
                           {id: 4, positionX: 8, positionY: 48, positionZ: 0, health: maxHealth, isDead: false, flagsTaken: []}
                         ]
const lobbies = [{id: 1, numOfPlayers: 4, lobbyPlayers: [connectedPlayers[0], connectedPlayers[1],
                                                        connectedPlayers[2], connectedPlayers[3]],
                                                    flagsAvailable: [1, 2, 3, 4, 5]}]

const getIndex = (playerId, lobbyId) => {
    const curLobbyArray = lobbies[lobbyId-1].lobbyPlayers
    for (var i=0; i < curLobbyArray.length; i++) {
        if (curLobbyArray[i].id == playerId) {
            return i
        }
    }
}

const cleanLobbyFlagsArray = (lobbyId) => {
    lobbies[lobbyId-1].flagsAvailable = lobbies[lobbyId-1].flagsAvailable.sort()
    lobbies[lobbyId-1].flagsAvailable = [...new Set(lobbies[lobbyId-1].flagsAvailable)]
}

const respawnPlayer = (playerId) => {
    connectedPlayers[playerId-1].positionX = startX
    connectedPlayers[playerId-1].positionY = startY
    connectedPlayers[playerId-1].positionZ = startZ

    connectedPlayers[playerId-1].health = maxHealth
    connectedPlayers[playerId-1].isDead = false

    const flags = connectedPlayers[playerId-1].flagsTaken
    connectedPlayers[playerId-1].flagsTaken = []

    let lobbyId = null
    lobbies.forEach(item => {
        if (item.lobbyPlayers.includes(connectedPlayers[playerId-1])) {
            lobbyId = item.id
        }
    })

    if (lobbyId != null) {
        flags.forEach(item => lobbies[lobbyId-1].flagsAvailable.push(item))

        //keep lobby flags array clean
        cleanLobbyFlagsArray(lobbyId)
    }
}

var moved = false

app.get('/printHello', function (req, res) {
   res.send({"Hello": 1})
})

// Queries:
app.get('/getLobbyPlayers', function (req, res) { // getLobbyPlayers?lobbyId=1
    try {
        const lobbyId = req.query.lobbyId
        res.send(lobbies[lobbyId-1].lobbyPlayers)
    }

    catch {
        res.send("Error")
    }
})

app.get('/getConnectedPlayers', function (req, res) {
    res.send(connectedPlayers)
})

//sample query to see if multiplayer is doable ***
app.get('/checkMoved', function (req, res) {
    res.send({movedFromStartingLoc: moved})
})

app.get('/setMoved', function (req, res) {
    try {
        moved = true
        res.send({"status": "ok"})
    }

    catch {
        res.send({"status": "failed"})
    }
})

app.get('/setNotMoved', function (req, res) {
    try {
        moved = false
        res.send({"status": "ok"})
    }

    catch {
        res.send({"status": "failed"})
    }
})

app.get('/getLobbyFlags', function (req, res) { // getLobbyFlags?lobbyId=1
    const lobbyId = req.query.lobbyId

    res.send({"flagsAvailable" : lobbies[lobbyId-1].flagsAvailable})
})

app.get('/getPlayerFlags', function (req, res) { // getPlayerFlags?playerId=1
    const playerId = req.query.playerId

    res.send({"flagsTaken" : connectedPlayers[playerId-1].flagsTaken})
})
// **********

app.get('/getLobbies', function (req, res) {
    res.send(lobbies)
})

app.get('/getPosition', function (req, res) { // getPosition?userId=1
    const userId = req.query.userId
    res.send(connectedPlayers[userId-1])
})

app.get('/getHealth', function(req, res) { // getHealth?playerId=1
    const playerId = parseInt(req.query.playerId)
    res.send({"health" : connectedPlayers[playerId-1].health, "startX": startX, "startY": startY, "startZ": startZ})
})

// Mutations:
app.get('/createGameCode', function (req, res) { // createGameCode?userId=1
    const userId = req.query.userId
    const curUser = connectedPlayers[userId-1]
    if (lobbies.length === 0) {
        lobbies[0] = {id: 1, numOfPlayers: 4, lobbyPlayers: [curUser]}
        res.send({"lobbyId" : 1})
    }

    else {
        const newLobbyId = lobbies.length+1
        lobbies[newLobbyId-1] = {id: newLobbyId, numOfPlayers: 4, lobbyPlayers: [curUser]}
        res.send({"lobbyId": newLobbyId})
    }
})

app.get('/createUserId', function (req, res) { // createUserId
    if (connectedPlayers.length === 0) {
        connectedPlayers[0] = {id: 1, positionX: 0, positionY: 0, positionZ: 0}
        res.send({"newPlayerId": 1})
    }

    else {
        const newPlayerId = connectedPlayers.length+1
        connectedPlayers.push({id: newPlayerId, positionX: 0, positionY: 0, positionZ: 0})
        res.send({"newPlayerId": newPlayerId})
    }
})

app.get('/joinGame', function (req, res) { // joinGame?gameId=1&userId=1
    const gameCode = req.query.gameId
    const userId = req.query.userId

    const lobbyIdList = lobbies.map(item => item.id)
    if (!lobbyIdList.includes(parseInt(gameCode))) {
        res.send({"status": "lobby DNE"})
    }
    //be careful of case when a player joinGame's twice
    else {
        lobbies[gameCode-1].lobbyPlayers.push(connectedPlayers[userId-1])
        res.send({"status": "ok"})
    }
})

app.get('/syncPlayerPosition', function (req, res) { // syncPlayerPosition?playerId=1&lobbyId=1&x=1&y=1&z=1
    const lobbyId = parseInt(req.query.lobbyId)
    //error check if lobby DNE
    const lobbyIdList = lobbies.map(item => item.id)
    if (!lobbyIdList.includes(parseInt(lobbyId))) {
        res.send({"status": "lobby DNE"})
    }

    else {
        const playerId = parseInt(req.query.playerId)
        const x = parseFloat(req.query.x)
        const y = parseFloat(req.query.y)
        const z = parseFloat(req.query.z)

        const curPlayerLobbyIndex = getIndex(playerId, lobbyId)

        lobbies[lobbyId-1].lobbyPlayers[curPlayerLobbyIndex].positionX = x
        lobbies[lobbyId-1].lobbyPlayers[curPlayerLobbyIndex].positionY = y
        lobbies[lobbyId-1].lobbyPlayers[curPlayerLobbyIndex].positionZ = z

        res.send({"status":"ok"})
    }
})

app.get('/dealDamage', function(req, res) { // dealDamage?playerId=2&damage=50
    const playerId = parseInt(req.query.playerId)
    const damage = parseInt(req.query.damage)

    connectedPlayers[playerId-1].health -= damage

    if (connectedPlayers[playerId-1].health <= 0) {
        connectedPlayers[playerId-1].isDead = true
    }

    res.send({"status":"ok"})
})

app.get('/deathConfirmed', function(req, res) { // deathConfirmed?playerId=1
    const playerId = parseInt(req.query.playerId)
    respawnPlayer(playerId)
    res.send({"status":"ok"})
})

app.get('/healDamage', function(req, res) { // healDamage?playerId=2&heal=50
    const playerId = parseInt(req.query.playerId)
    const heal = parseInt(req.query.heal)

    connectedPlayers[playerId-1].health += heal

    res.send({"status":"ok"})
})

app.get('/respawnPlayer', function(req, res) { // respawnPlayer?playerId=2
    const playerId = parseInt(req.query.playerId)
    respawnPlayer(playerId)
    res.send({"status":"ok"})
})

app.get('/resetAllHealth', function(req, res) { // resetAllHealth
    for (let i = 0; i < connectedPlayers.length; i++) {
        connectedPlayers[i].health = maxHealth
        connectedPlayers[i].isDead = false
    }

    res.send({"status":"ok"})
})

app.get('/takeFlag', function(req, res) { // takeFlag?playerId=1&flagNum=2&lobbyId=1
    const playerId = parseInt(req.query.playerId)
    const flagNum = parseInt(req.query.flagNum)
    const lobbyId = parseInt(req.query.lobbyId)

    lobbies[lobbyId-1].flagsAvailable = lobbies[lobbyId-1].flagsAvailable.filter(item => item != flagNum)
    
    connectedPlayers[playerId-1].flagsTaken.push(flagNum)
    connectedPlayers[playerId-1].flagsTaken = connectedPlayers[playerId-1].flagsTaken.sort()

    res.send({"status":"ok"})
})

app.get('/resetPlayerData', function(req, res) { // resetPlayerData?playerId=1&lobbyId=1
    const playerId = parseInt(req.query.playerId)
    const lobbyId = parseInt(req.query.lobbyId)

    connectedPlayers[playerId-1].health = maxHealth
    connectedPlayers[playerId-1].isDead = false

    const flagsTaken = connectedPlayers[playerId-1].flagsTaken
    flagsTaken.forEach(item => lobbies[lobbyId-1].flagsAvailable.push(item))
    cleanLobbyFlagsArray(lobbyId)
    connectedPlayers[playerId-1].flagsTaken = []

    res.send({"status":"ok"})
})

// ** THIS IS USED FOR TESTING PURPOSES
app.get('/killPlayer', function(req, res) { // killPlayer?playerId=1
    const playerId = parseInt(req.query.playerId)

    connectedPlayers[playerId-1].health = 0
    connectedPlayers[playerId-1].isDead = true

    res.send({"status":"ok"})
})

// need a remove user query, remove from lobby (CRUD)

app.listen(port, function () {
   console.log("Example app listening at port: " + port)
})