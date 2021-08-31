const { v4: uuidv4 } = require('uuid');
const Room = require('./room.js');
const utils = require('./utils.js');

module.exports = function (io) {
  const MAX_ROOM = 20;
  const rooms = {};

  io.sockets.on('connection', function (socket) {
    utils.makeLog(socket.id + ' 연결 되었습니다.');

    socket.on('create room', function (data, ack) {
      utils.makeLog(
        'create room 실행\nnickname : ' + data.nickname + '\nid : ' + socket.id,
      );
      if (!utils.nameCheck(data.nickname)) {
        socket.emit('join fail', {
          message: '잘못된 닉네임입니다.',
        });
        ack('fail');
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
        });
        ack('success');
      }
    });

    socket.on('join room', function (data) {
      const roomId = data.room_id;
      utils.makeLog(
        'join room 실행\n room id : ' +
          roomId +
          '\nnickname : ' +
          data.nickname,
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
          room_id: roomId,
          is_playing: rooms[roomId].isPlaying,
        });
        utils.makeLog(rooms);
        io.in(roomId).emit('update user', {
          users: rooms[roomId].users,
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
      rooms[roomId].startGame();
      io.in(roomId).emit('start success', {
        users: rooms[roomId].users,
      });
    });

    //to do : 정답이냐 구분하는 것
    socket.on('send message', function (data) {
      const id = uuidv4();
      utils.makeLog(
        'send message 실행\n nickname : ' +
          socket.nickname +
          '\nmessage : ' +
          data.message +
          '\nroom id : ' +
          socket.roomId,
      );
      io.in(socket.roomId).emit('show message', {
        id: id,
        message: data.message,
        user_id: socket.id,
        nickname: socket.nickname,
      });
    });

    socket.on('drawing', function (data) {
      io.in(socket.roomId).emit('drawing', data);
    });

    socket.on('clear board', function (data) {
      io.in(socket.roomId).emit('clear board', data);
    });

    socket.on('disconnecting', function () {
      if (socket.roomId) {
        const roomId = socket.roomId;
        console.log('leave room 실행');
        rooms[roomId].leaveUser(socket.id);
        socket.leave(socket.roomId);
        socket.roomId = undefined;
        if (rooms[roomId].userCount == 0) {
          delete rooms[roomId];
        } else {
          io.in(roomId).emit('update user', {
            users: rooms[roomId].users,
          });
        }
      }
      utils.makeLog(socket.id + ' 퇴장\nnickname : ' + socket.nickname);
    });
  });
};
