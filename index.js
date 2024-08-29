var handler = function(req, res) {
    fs.readFile('./page.html', function (err, data) {
        if(err) throw err;
        res.writeHead(200);
        res.end(data);
    });
}

var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

var session = require('express-session');

var sharedsession = require("express-socket.io-session");

var FileStore = require('session-file-store')(session);
var fileStoreOptions = {};

var sessionMiddleware = session(
{
    store: new FileStore(fileStoreOptions),
    secret: 'ultrasecreto',
    resave: true,
    saveUninitialized: true
});


app.use(sessionMiddleware);
 
// Use shared session middleware for socket.io
// setting autoSave:true
io.use(sharedsession(sessionMiddleware));

var fs = require('fs');
var Moniker = require('moniker');
var port = 3250;

app.use(express.static(__dirname + '/node_modules'));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/page.html');
});

server.listen(port);


io.sockets.on('connection', function (socket) {
    console.log(socket.handshake.session.user);
    if(!socket.handshake.session.user){
        var user = addUser();    
        socket.handshake.session.user=user;
        socket.handshake.session.save();
    }   
    else{
        var user=socket.handshake.session.user;
    }

    socket.userName=user.name; 
    
    
    socket.emit("welcome", user);
    socket.on('disconnect', function () {
        removeUser(user);
    });

    
    socket.on("click", function() {
        

    });
});

var users = [];

var addUser = function() {
    var user = {
        name: Moniker.choose(),
        clicks: 0
    }
    users.push(user);
    updateUsers();
    return user;
}
var removeUser = function(user) {
    for(var i=0; i<users.length; i++) {
        if(user.name === users[i].name) {
            users.splice(i, 1);
            updateUsers();
            return;
        }
    }
}
var updateUsers = function() {
    var str = '';
    for(var i=0; i<users.length; i++) {
        var user = users[i];
        str += user.name + ' <small>(' + user.clicks + ' clicks)</small>';
    }
    io.sockets.emit("users", { users: str });
}
