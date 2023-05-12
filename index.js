const colyseus = require('colyseus');
const chess = require('chess.js');
const http = require("http");
const express = require("express");
const port = 7800;
const app = express();
app.use(express.json());
const { randomInt } = require('crypto');
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
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
        if (number_of_players == 1) {
            var selectedside = this.players.findIndex((player)=>{
                return player === null;
            });
            playerside = this.side[selectedside]
            amIspectator = false;
            this.players[selectedside] = client;
            started = true;
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
            this.broadcast("ended",{reason: "disconnection"})
        }
    }
    onDispose() {

    }
}
const gameServer = new colyseus.Server({
    server:http.createServer(app)
});
gameServer.define("public_hall",ChessRoom);
gameServer.listen(port);
