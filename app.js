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

server.listen(8080, function () {
  utils.makeLog('서버 실행');
});

io.sockets.on('connection', function (socket) {
  utils.makeLog(socket.id + ' 연결');

  socket.on('create room', function (data) {
    utils.makeLog('create room 실행, nickname : ' + data.nickname + socket.id);
    if (!utils.nameCheck(data.nickname)) {
      socket.emit('enter fail', {
        message: '잘못된 닉네임입니다.',
      });
    } else {
      roomId = utils.makeRoomId(rooms);
      rooms.roomId = new Room();
      rooms.roomId.enterUser(socket.id);
      socket.join(roomId);
      socket.owner = true;
      socket.roomId = roomId;
      socket.nickname = data.nickname;
      socket.emit('enter success', {
        room_id: roomId,
      });
    }
  });

  socket.on('enter room', function (data) {
    utils.makeLog('enter room 실행');
    if (!utils.nameCheck(data.nickname)) {
      socket.emit('enter fail', {
        message: '잘못된 닉네임입니다.',
      });
    } else if (!rooms.hasOwnProperty(data.room_id)) {
      socket.emit('enter fail', {
        message: '잘못된 입장코드입니다.',
      });
    } else if (rooms.data.roomId.userCount > MAX_ROOM) {
      socket.emit('enter fail', {
        message: '방이 가득 찼습니다.',
      });
    } else {
      rooms.data.roomId.enterUser(socket.id);
      socket.join(data.roomId);
      socket.owner = false;
      socket.roomId = data.roomId;
      socket.nickname = data.nickname;
      socket.emit('enter success', {
        roomId: roomId,
      });
    }
  });

  socket.on('leave room', function (data) {
    roomId = socket.roomId;
    utils.makeLog('leave room 실행');
    if (socket.owner) {
      if (rooms.roomId.userCount == 1) {
        delete rooms.roomId;
      } else {
        rooms.roomId.leaveUser(socket.id);
        nextOwner = rooms.roomId.firstUser;
        socket.leave(socket.roomId);
        socket.roomId = '';
        io.to(nextOwner).emit('change owner', {});
      }
    }
    socket.disconnect();
  });

  socket.on('change owner', function (data) {
    socket.owner = true;
  });

  //to do : 전달 데이터, 시작 실패 예외 처리
  socket.on('start game', function (data) {
    utils.makeLog('start game 실행, 방 : ' + socket.roomId);
    roomId = socket.roomId;
    rooms.roomId.round = data.round;
    io.in(roomId).emit('start success', { message: 'babo' });
  });

  socket.on('disconnect', function () {
    utils.makeLog(socket.id + ' 퇴장');
  });
});
