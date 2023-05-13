const colyseus = require('colyseus');
const chess = require('chess.js');
const http = require("http");
const express = require("express");
const port = 7800;
const app = express();
app.use(express.json());
const { randomInt } = require('crypto');
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
var roomIdCount = 0;
function generateRoomId() {
    var id = (roomIdCount).toString(16).padStart(9,'0');
    roomIdCount = roomIdCount + 1;
    if (roomIdCount > 68719476735) {
        roomIdCount = 0
    }
    return id
}
class ChessRoom extends colyseus.Room {
    maxClients = 99;
    players = [null,null];
    spectators = [];
    side = ['w','b'];
    game = 0;
    onCreate(options) {
        this.game = new chess.Chess()
        this.roomId = options.id
        console.log(options)
        console.log("New room created")
        this.onMessage("move",(client,message)=>{
            this.broadcast("move",message);
            console.log("Message received:");
            console.log(message);
            this.game.move({
                from:message["from"],
                to: message["to"],
                promotion: message["promotion"]
            })
        })
        this.onMessage("ended",(client,message)=>{
            this.broadcast("ended",message)
        })
        this.onMessage("chat",(client,message)=>{
            if (this.players.find(element => element === client)) {
                this.players.forEach((value)=>{
                    if (value!==client) {
                        value.send("chat",message)
                    }
                })
            }
            else {
                this.spectators.forEach((value)=>{
                    if (value!==client) {
                        value.send("chat",message)
                    }
                })
            }
        })
    }
    onJoin(client,options,auth) {
        var amIspectator = true;
        var playerside = 'w';
        var started = false;
        var number_of_players = this.players.filter((e)=>{
            return e !== null;
        }).length;
        if (number_of_players == 0) {
            var selectedside = randomInt(2)
            playerside = this.side[selectedside]
            this.players[selectedside] = client;
            amIspectator = false;
        }
        else if (number_of_players == 1) {
            var selectedside = this.players.findIndex((player)=>{
                return player === null;
            });
            playerside = this.side[selectedside]
            amIspectator = false;
            this.players[selectedside] = client;
            started = true;
        }
        else {
            this.spectators.push(client)
        }
        client.send("welcome",{
            spectator: amIspectator,
            myside: playerside,
            fen: this.game.fen()
        });
        if (started === true){
            sleep(1000).then(()=>{
                console.log("Sent starting message");
                this.broadcast("started",{});
            })
        }

    }
    async onLeave(client,consented){
        try {
        await this.allowReconnection(client, 30);
        }
        catch(e) {
            if (this.players.find(element => element === client)) {
                this.broadcast("ended",{reason: "disconnection"})
            }
            else {
                
            }
            
        }
    }
    onDispose() {

    }
}
class Randomize extends colyseus.Room {
    onCreate(options) {
        this.roomId = generateRoomId()
    }
}
const gameServer = new colyseus.Server({
    server:http.createServer(app)
});
gameServer.define("public_hall",ChessRoom);
gameServer.define("randomize",Randomize);
gameServer.listen(port);
