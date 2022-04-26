var express = require('express');
var app = express();
const port = process.env.PORT || 4000

// const connectedPlayers = []
// const lobbies = []

// sample data:
const connectedPlayers = [{id: 1, positionX: 2, positionY: 48, positionZ: 0},
                           {id: 2, positionX: 4, positionY: 48, positionZ: 0},
                           {id: 3, positionX: 6, positionY: 48, positionZ: 0},
                           {id: 4, positionX: 8, positionY: 48, positionZ: 0}
                         ]
const lobbies = [{id: 1, numOfPlayers: 4, lobbyPlayers: [connectedPlayers[0], connectedPlayers[1],
                                                        connectedPlayers[2], connectedPlayers[3]]}]

const getIndex = (playerId, lobbyId) => {
    const curLobbyArray = lobbies[lobbyId-1].lobbyPlayers
    for (var i=0; i < curLobbyArray.length; i++) {
        if (curLobbyArray[i].id == playerId) {
            return i
        }
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
// **********

app.get('/getLobbies', function (req, res) {
    res.send(lobbies)
})

app.get('/getPosition', function (req, res) { // getPosition?userId=1
    const userId = req.query.userId
    res.send(connectedPlayers[userId-1])
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

// need a remove user query, remove from lobby (CRUD)

app.listen(port, function () {
   console.log("Example app listening at port: " + port)
})