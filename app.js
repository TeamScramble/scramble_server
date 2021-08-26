const express = require('express');
const socket = require('socket.io');
const http = require('http');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
//const io = socket(server);
const io = socket(server, {
  cors: {
    origin: '*',
  },
});

const Room = require('./src/room.js');
const utils = require('./src/utils.js');

const MAX_ROOM = 20;

// 서버에서 방 객체 관리
const rooms = {};

io.sockets.on('connection', function (socket) {
  console.log('소켓 연결');

  // 방과 관련된 event
  socket.on('createRoom', function (data) {
    console.log('createRoom 실행');
    if (!utils.nameCheck(data.name)) {
      socket.emit('failRoom', {
        message: '잘못된 닉네임입니다.',
      });
    } else {
      roomId = utils.makeRoomId(rooms);
      rooms.roomId = new Room();
      rooms.roomId.enterUser(socket.id);
      socket.join(roomId);
      socket.owner = true;
      socket.roomId = roomId;
      socket.name = data.name;
      socket.emit('enterSuccess', {
        roomId: roomId,
      });
    }
  });

  socket.on('enterRoom', function (data) {
    if (!utils.nameCheck(data.name)) {
      socket.emit('failRoom', {
        message: '잘못된 닉네임입니다.',
      });
    } else if (!rooms.hasOwnProperty(data.roomId)) {
      socket.emit('failRoom', {
        message: '잘못된 입장코드입니다.',
      });
    } else if (rooms.data.roomId.userCount > MAX_ROOM) {
      socket.emit('failRoom', {
        message: '방이 가득 찼습니다.',
      });
    } else {
      rooms.data.roomId.enterUser(socket.id);
      socket.join(data.roomId);
      socket.owner = false;
      socket.roomId = data.roomId;
      socket.name = data.name;
      socket.emit('enterSuccess', {
        roomId: roomId,
      });
    }
  });

  socket.on('leaveRoom', function (data) {
    if (socket.owner) {
      if (rooms.socket.roomId.userCount == 1) {
        delete rooms.socket.roomId;
      } else {
        rooms.socket.roomId.leaveUser(socket.id);
        nextOwner = rooms.socket.roomId.firstUser;
        socket.leave(socket.roomId);
        socket.roomId = '';
        io.to(nextOwner).emit('changeOwner', {
          type: 'change',
          name: 'SERVER',
          message: '방장이 되었습니다.',
        });
      }
    }
  });

  socket.on('changeOwner', function (data) {
    socket.owner = true;
  });
  //-------------------------------------------------------
  //-------------------------------------------------------
});
