function moForm() {
    document.getElementById("myForm").style.display = "block";
  }
  /*Hàm Đóng Form*/
  function dongForm() {
    document.getElementById("myForm").style.display = "none";
}
function getClient() {
  var connectionUrl = "ws://"+ location.hostname + ":7800"
  var client = new Colyseus.Client(connectionUrl)
  return client
}
async function getRoom(client) {
  var randomizeRoom = await client.create("randomize")
  return randomizeRoom
}
async function searchRoomID(client,id) {
  var rooms = await client.getAvailableRooms()
  var idExists = false
  rooms.forEach(element => {
    if (element.roomId === id) {
      idExists = true
    }
  })
  return idExists
}
function getRoomID(room) {
  return room.id
}
async function createHandler() {
  var client = getClient()
  var username = $("#username_create").val()
  var randomizeRoom = await getRoom(client)
  var roomId = getRoomID(randomizeRoom)
  sessionStorage.setItem('username',username)
  var connectionUrl = "http://"+ location.host + `/chess.html?id=${roomId}`
  location.href = connectionUrl
}
async function joinHandler() {
  var client = getClient()
  var username = $("#username_join").val()
  var roomId = $("#roomID").val()
  if (await searchRoomID(client,roomId)) { // room exists
    sessionStorage.setItem('username',username)
    var connectionUrl = "http://"+ location.host + `/chess.html?id=${roomId}`
    location.href = connectionUrl
  }
  else {
    alert("Mã phòng không tồn tại, vui lòng kiểm tra lại hoặc tạo phòng mới.")
  }
}