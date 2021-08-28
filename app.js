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
const { util } = require('prettier');

const MAX_ROOM = 20;

// 서버에서 방 객체 관리
const rooms = {};

server.listen(8080, function () {
  utils.makeLog('서버 실행');
});

io.sockets.on('connection', function (socket) {
  utils.makeLog(socket.id + ' 연결 되었습니다.');

  socket.on('create room', function (data) {
    utils.makeLog(
      'create room 실행\n nickname : ' + data.nickname + +'\nid : ' + socket.id,
    );
    if (!utils.nameCheck(data.nickname)) {
      socket.emit('join fail', {
        message: '잘못된 닉네임입니다.',
      });
    } else {
      const roomId = utils.makeRoomId(rooms);
      rooms[roomId] = new Room();
      rooms[roomId].joinUser(socket.id, data.nickname);
      socket.join(roomId);
      socket.roomId = roomId;
      socket.nickname = data.nickname;
      socket.emit('create success', {
        room_id: roomId,
      });
      io.in(roomId).emit('update user', {
        users: rooms[roomId].users,
        nicknames: rooms[roomId].nicknames,
      });
    }
  });

  socket.on('join room', function (data) {
    const roomId = data.room_id;
    utils.makeLog(
      'join room 실행\n room id : ' + roomId + '\nnickname : ' + data.nickname,
    );
    if (!utils.nameCheck(data.nickname)) {
      socket.emit('join fail', {
        message: '잘못된 닉네임입니다.',
      });
    } else if (!rooms.hasOwnProperty(roomId)) {
      socket.emit('join fail', {
        message: '잘못된 입장코드입니다.',
      });
    } else if (rooms[roomId].userCount > MAX_ROOM) {
      socket.emit('join fail', {
        message: '방이 가득 찼습니다.',
      });
    } else {
      rooms[roomId].joinUser(socket.id, data.nickname);
      socket.join(roomId);
      socket.roomId = roomId;
      socket.nickname = data.nickname;
      socket.emit('join success', {
        roomId: roomId,
      });
      utils.makeLog(rooms);
      io.in(roomId).emit('update user', {
        users: rooms[roomId].users,
        nicknames: rooms[roomId].nicknames,
      });
    }
  });

  socket.on('leave room', function (data) {
    socket.disconnecting();
  });

  //to do : 전달 데이터, 시작 실패 예외 처리
  socket.on('start game', function (data) {
    utils.makeLog(
      'start game 실행\n방 : ' + socket.roomId,
      '\nround : ' + data.round,
    );
    const roomId = socket.roomId;
    rooms[roomId].round = data.round;
    io.in(roomId).emit('start success', {});
  });

  //to do : 정답이냐 구분하는 것
  socket.on('send message', function (data) {
    socket.emit('show message', {
      message: data.message,
      type: 'MINE',
    });
    socket.to(socket.roomId).emit('show message', {
      message: data.message,
      type: 'OTHER',
    });
  });

  socket.on('disconnecting', function () {
    if (socket.roomId) {
      console.log('냐냐냐', socket.roomId);
      const roomId = socket.roomId;
      utils.makeLog('leave room 실행');
      if (rooms[roomId].owner == socket.id) {
        if (rooms[roomId].userCount == 1) {
          delete rooms[roomId];
        } else {
          rooms[roomId].leaveUser(socket.id, socket.nickname);
          socket.leave(socket.roomId);
          socket.roomId = '';
          io.in(roomId).emit('update user', {
            users: rooms[roomId].users,
            nicknames: rooms[roomId].nicknames,
          });
        }
      }
    }
    utils.makeLog(socket.id + ' 퇴장\nnickname : ' + socket.nickname);
  });
});
