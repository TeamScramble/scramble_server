const express = require('express');
const socket = require('socket.io');
const http = require('http');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socket(server);

import Room from './src/rooms.js';
import * as utils from './src/utils.js';

const MAX_ROOM = 20;

// 서버에서 방 객체 관리
const rooms = {};

io.sockets.on('connection', function (socket) {
  console.log('소켓 연결');

  // name : 사용자가 닉네임 입력
  // todo : nameCheck function 구현(createRoom, enterRoom)
  socket.on('createRoom', function (data) {
    roomId = utils.makeRoomId(rooms);
    rooms.roomId = Room();
    rooms.roomId.enterUser(socket.id);
    socket.join(roomId);
    socket.owner = true;
    socket.roomId = roomId;
    // 대기실로 입장 처리 필요함. 이벤트로 해야될지?
  });

  socket.on('enterRoom', function (data) {
    if (!rooms.hasOwnProperty(data.roomId)) {
      io.to(socket.id).emit('failRoom', {
        type: 'fail',
        name: 'SERVER',
        message: '잘못된 입장코드입니다.',
      });
    } else if (rooms.data.roomId.userCount > MAX_ROOM) {
      io.to(socket.id).emit('failRoom', {
        type: 'fail',
        name: 'SERVER',
        message: '방이 가득 찼습니다.',
      });
    } else {
      rooms.data.roomId.enterUser(socket.id);
      socket.join(data.roomId);
      socket.owner = false;
      socket.roomId = data.roomId;
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
});
