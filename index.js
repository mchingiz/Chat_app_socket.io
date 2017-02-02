var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var users = [];

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, '/', 'index.html'));
});

io.on('connection', function(socket){
  console.log('new connection');

  socket.on('set nickname', function(n){
    socket.nickname = n;

    var user = {nickname: socket.nickname, id: socket.id};
    users.push(user);

    io.emit('chat info', socket.nickname+' has connected');
  });

  socket.on('chat message', function(msg){
    socket.broadcast.emit('chat message', socket.nickname+": "+msg);
  });

  socket.on('private message', function(data){
    var i;
    var foundUser = false;

    for(i=0;i<users.length;i++){
      if( users[i]["nickname"] == data.to ){
          foundUser = true; break;
      }
    }

    if(foundUser){
      socket.broadcast.to(users[i]["id"]).emit('chat message', socket.nickname+" to only you: "+data.msg);
      socket.emit('chat message', "You to only "+data.to+": "+data.msg);
    }else{
      socket.emit('chat info', "Private message was not send. User not found");
    }

  });

  socket.on('typing', function(){
    io.emit('typing', {
      msg: socket.nickname+" is typing",
      senderid: socket.id
    });
  });
  socket.on('not typing', function(){
    io.emit('not typing',{
      senderid: socket.id
    });
  });

  socket.on('disconnect', function(msg){
    if(socket.nickname){
      io.emit('chat info', socket.nickname+' left the chat');
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
