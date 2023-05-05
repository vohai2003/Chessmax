import * as Colyseus from "./colyseus/colyseus";
var connectionUrl = "ws://"+ location.host + ":8000";
var client = new Colyseus.Client(connectionUrl);
function roomJoin(client:Colyseus.Client,roomId:string): any {
    var joinasPlayer = true;
    client.joinOrCreate(roomId).then(room=>{
        console.log("Room joined: "+roomId);
        room.onMessage("joinType",(message)=>{
            var joinaP = message["joinType"];
            joinasPlayer = joinaP;
        });
        return {"room":room,"joinasPlayer":joinasPlayer};
    }).catch(e=>{
        console.log("Error: "+e);
    });
}
function gameHandle(client:Colyseus.Client,room:Colyseus.Room,joinasPlayer:boolean){
    var move;
    var movingSide;
    var reason;
    var winning_side;
    room.onMessage("move",(message)=>{
        /*Receive moves from server.
        Including move and moving side */
        move = message["move"];
        movingSide = message["movingSide"];
    });
    room.onMessage("termination",(message)=>{
        /*Receive termination messages from server.
        Reason can be abandonment, timeout, checkmate, draw, or resign*/
        reason = message.reason;
        winning_side = message.winning_side;
    });
}