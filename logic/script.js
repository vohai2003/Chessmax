
// var board = Chessboard('board', {
//   draggable: true,
//   dropOffBoard: 'trash',
//   sparePieces: true
//  })

// $('#startBtn').on('click', board.start)
// $('#clearBtn').on('click', board.clear)

var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var whiteSquareGrey = '#bec8d1'
var blackSquareGrey = '#373b3e'
var connectionUrl = "ws://"+ location.hostname + ":7800"
console.log(connectionUrl)
var client = new Colyseus.Client(connectionUrl)
var default_room
var amIspectator = true
var room_promise = client.joinOrCreate("public_hall").then(room=>{
  default_room = room
  default_room.onMessage("welcome",(message)=>{
    amIspectator = message["spectator"]
    myside = message["myside"]
    console.log(amIspectator)
    console.log(myside)
    connectionReady = true
    game = new Chess(message["fen"])
    if (myside == "b") {
      board.orientation("black")
    }
    else {
      board.orientation("white")
    }
  })
  default_room.onMessage("started",(message)=>{
    console.log("Started")
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
      playSoundop()
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
	const ding = new Audio('http://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3');
	ding.play();}
function playSoundcg () {
	const ding = new Audio('http://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/notify.mp3');
	ding.play();}
function playSoundtk () {
const ding = new Audio('http://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3');
ding.play();}

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

function onDrop (source, target, piece, newPos, oldPos, orientation) {
  removeGreySquares()
  var promotion="q"
  //leave this part for promotion button group
  if (piece="wP" && target.search("8") !==-1) //the moved piece is a white pawn, ready to be promoted 
  {

  }
  if (piece="bP" && target.search("1")!==-1) //the moved piece is a black pawn, ready to be promoted 
  {

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
  playSoundop()
}

function onMouseoverSquare (square, piece) {
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

function updateStatus () {
  var status = ''

  var moveColor = 'Trắng'
  if (game.turn() === 'b') {
    moveColor = 'Đen'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = ' Đến lượt '+ moveColor;
    

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' đang bị chiếu'
      playSoundcg()
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
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