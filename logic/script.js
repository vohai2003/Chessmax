
// var board = Chessboard('board', {
//   draggable: true,
//   dropOffBoard: 'trash',
//   sparePieces: true
//  })

// $('#startBtn').on('click', board.start)
// $('#clearBtn').on('click', board.clear)
var mousePosX;
var mousePosY;
var started = false;
window.addEventListener('mousemove', (event) => {
  mousePosX = event.clientX
  mousePosY = event.clientY
});

var board = null
var numPiece = 32
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var whiteSquareGrey = '#bec8d1'
var blackSquareGrey = '#373b3e'
var redSquare = '#ff4040'
var connectionUrl = "ws://"+ location.hostname + ":7800"
console.log(connectionUrl)
var client = new Colyseus.Client(connectionUrl)
var default_room
var amIspectator = true
var tempamIspectator
var roomId = getUrlParameter("id") || "1000000000" //normal room id is hexa from 000000000 to fffffffff
var rooms = await client.getAvailableRooms()
var idExists = false
rooms.forEach(element => {
  if (element.roomId == roomId) {
    idExists = true
  }
})
if (idExists) {
  var room_promise = client.joinById(roomId)
}
else {
  var room_promise = client.create("public_hall",{id: roomId})
}
room_promise.then(room=>{
  default_room = room
  default_room.onMessage("welcome",(message)=>{
    tempamIspectator = message["spectator"]
    myside = message["myside"]
    console.log(amIspectator)
    console.log(myside)
    connectionReady = true
    game = new Chess(message["fen"])
    updateStatus()
    board.position(game.fen())
    if (myside == "b") {
      board.orientation("black")
    }
    else {
      board.orientation("white")
    }
    numPiece = 64 - (game.ascii().match(/\./g) || []).length
  })
  default_room.onMessage("started",(message)=>{
    console.log("Started")
    playSoundcg()
    started = true
    amIspectator = tempamIspectator
  })
  default_room.onMessage("move",(message)=>{
    console.log("Received move!")
    if (message.side == game.turn()) 
    {
      console.log("From ",message["from"])
      console.log("To ",message["to"])
      game.move({
        from:message["from"],
        to: message["to"],
        promotion: message["promotion"]
      })
      var currentPieceOnBoard = 64 - (game.ascii().match(/\./g) || []).length
      if (numPiece != currentPieceOnBoard) { //number of piece on-board change after move -> capture occured.
        playSoundtk()
        numPiece = currentPieceOnBoard
      }
      else {
      playSoundop()
      }
    }
    updateStatus()
    board.position(game.fen())
  })
  default_room.onMessage("ended",(message)=>{
    amIspectator = true
  })
}).catch((err)=>{
  console.log(err.code)
  console.log(err.message)
})
var username = $('#username')
var tempamIspectator
//default_room.send("join",{username: username})
var myside = 'w'
var connectionReady;
function playSoundop () {
	const ding = new Audio('../audio/move-self.mp3');
	while(ding.play()===undefined){};
}
function playSoundcg () {
	const ding = new Audio('../audio/notify.mp3');
	while(ding.play()===undefined){};
}
function playSoundck () {
	const ding = new Audio('../audio/check.mp3');
	while(ding.play()===undefined){};
}
function playSoundtk () {
  const ding = new Audio('../audio/capture.mp3');
  while(ding.play()===undefined){};
}

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)
  
  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) {
    console.log("Game is already over")
    return false
  }
  // do not pick the pieces if the player is spectator
  if (amIspectator===true) {
    console.log("You are spectator, you can't edit board")
    return false
  }
  // only pick up pieces for the side to move
  if (game.turn() != myside || piece.search(myside)===-1) {
    if (piece.search(myside)===-1) {console.log("This is not your piece!")} else {console.log("Not your turn!")}
    console.log(piece)
    console.log(myside)
    console.log(game.turn())
    return false
  }
}

async function onDrop (source, target, piece, newPos, oldPos, orientation) {
  removeGreySquares()
  var promotion="q"
  var promotionElement
  //leave this part for promotion button group
  if (piece=="wP" && target.search("8") !=-1) //the moved piece is a white pawn, ready to be promoted 
  {
    $("#promotion").css("left", `${mousePosX}px`);
    $("#promotion").css("top", `${mousePosY}px`);
    $("#promotion").show()
    while ($('#promotion').val() == '') {
      await sleep(100)
    }
    promotion = $('#promotion').val()
    $("#promotion").hide()
  }
  if (piece=="bP" && target.search("1")!=-1) //the moved piece is a black pawn, ready to be promoted 
  {
    $("#promotion").css("left", `${mousePosX}px`);
    $("#promotion").css("top", `${mousePosY}px`);
    $("#promotion").show()
    while ($('#promotion').val() == '') {
      await sleep(100)
    }
    promotion = $('#promotion').val()
    $("#promotion").hide()
  }
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: promotion, // NOTE: always promote to a queen for example simplicity
    
  })


  // illegal move
  if (move === null) return 'snapback'
  //leave this part for piece update
  default_room.send("move",{
    side: myside,
    from: source,
    to: target,
    promotion: promotion
  })
  updateStatus()
  var currentPieceOnBoard = 64 - (game.ascii().match(/\./g) || []).length
  if (numPiece != currentPieceOnBoard) { //number of piece on-board change after move -> capture occured.
    playSoundtk()
    numPiece = currentPieceOnBoard
  }
  else {
  playSoundop()
  }
}

function onMouseoverSquare (square, piece) {
  if (amIspectator===true || game.turn() != myside || game.game_over()) return false
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}



// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

async function updateStatus () {
  while (document.readyState !== 'complete') {
    await sleep(300)
  }
  var status = ''

  var moveColor = 'Trắng'
  if (game.turn() === 'b') {
    moveColor = 'Đen'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Ván đấu kết thúc, ' + moveColor + ' bị chiếu hết'
    client.send("ended",{reason: "checkmate"})
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Ván đấu kết thúc, hòa'
    client.send("ended",{reason: "draw"})
  }

  // game still on
  else {
    if (game.pgn() == '') {
      if (tempamIspectator !== true) {
        status = 'Đang chờ đối thủ'
        if (amIspectator === false) {
          status = 'Trận đấu bắt đầu!'
        }
      }
      else {
        status = 'Bạn là khán giả'
      }
    }
    status = ' Đến lượt '+ moveColor;
    

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' đang bị chiếu'
      playSoundck()
    }
  }
  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
  if (game!==undefined) {
  for (var square = 0; square < 64; square++)
  {
    var position = game.SQUARES[square]
    var piece = game.get(position)
    if (piece === null) {
      $(`.square-${position}`).removeClass("highlight-check")
      continue
    }
    if (piece["type"] == 'k' && piece["color"]==game.turn() && game.in_check()) {
      $(`.square-${position}`).addClass("highlight-check")
      if (game.in_checkmate()) {
        $(`.square-${position}`).addClass("highlight-checkmate")
      }
      }
    else {
      $(`.square-${position}`).removeClass("highlight-check")
    }
    }
    }
  }

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare
}
board = Chessboard('myBoard', config)
updateStatus()