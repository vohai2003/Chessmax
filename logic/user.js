function signup(e){
    event.preventDefault();
    var email = document.getElementById("email").value;
    var username =  document.getElementById("username").value;
    var password =  document.getElementById("password").value;
    var user = {
        username : username,
        email : email,
        password : password,
    }
    var json = JSON.stringify(user);
    localStorage.setItem(username,json);
    alert("dang ky thanh cong");
    window.location.href="login.html";
}
function login(e){
    event.preventDefault();
    var email = document.getElementById("email").value;
    var password =  document.getElementById("password").value;
    var user = localStorage.getItem(email);
    var data =JSON.parse(user);
    if(email ==null){
        arlet("vui long nhap email");
    }
    else if(email==data.email && password==data.password){
        alert("đăng nhập thành công");
        window.location.href="chess.html";
    }
    else{
        alert("đăng nhập thất bại");
    }
}