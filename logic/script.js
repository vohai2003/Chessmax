
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
import * as Colyseus from "../libary/colyseus/colyseus.js"
var connectionUrl = "ws://"+ location.host + ":8000"
var client = new Colyseus.Client(connectionUrl)
var default_room = client.join("public_hall")
var username = $('#username')
default_room.onJoin.add(function(){
  default_room.send({username: username})
})
default_room.onMessage.add(function(message){
  if (message["tag"] == "welcome") {
  amIspectator = message["spectator"]
  myside = message["myside"]
  connectionReady = true
  }
})
var myside = 'w'
var amIspectator = false
var connectionReady;
while (typeof connectionReady == "undefined") {
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

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false
  // do not pick the pieces if the player is spectator
  if (amIspectator) return false
  // only pick up pieces for the side to move
  if (game.turn !== myside || piece.search(myside)===-1) {
    return false
  }
}

function onDrop (source, target) {
  removeGreySquares()
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'
  //leave this part for piece update
  if (game.turn === myside && !amIspectator) {

  }
  //leave this part for promotion button group
  updateStatus()
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