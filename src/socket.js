const { v4: uuidv4 } = require('uuid');
const Room = require('./room.js');
const utils = require('./utils.js');

module.exports = function (io) {
  const MAX_ROOM = 20;
  const rooms = {};
  const MESSAGE_TYPE = {
    solved: 'SOLVED',
    all: 'ALL',
    correct: 'CORRECT',
    system: 'SYSTEM',
  };

  io.sockets.on('connection', function (socket) {
    utils.makeLog(socket.id + ' 연결 되었습니다.');

    /*#=========================================#
      @ brief : user가 방을 만들때 호출
      @ data
        nickname : user가 설정한 닉네임 
      @ post
        닉네임이 잘못된 경우 : join fail 전송
        그 외 : 임의의 10자리 문자열을 생성하여 roomId를 만듦.
              user에게 create success, update user list, show message(입장)을 전송
      #=========================================# 
    */
    socket.on('create room', function (data, ack) {
      utils.makeLog(
        `create room 실행\n
        nickname : ${data.nickname}\n
        id : ${socket.id}`,
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
        io.in(roomId).emit('update user list', {
          users: rooms[roomId].users,
        });
        io.in(roomId).emit('show message', {
          type: MESSAGE_TYPE.system,
          id: uuidv4(),
          message: `${socket.nickname}님이 입장했습니다.`,
          user_id: socket.id,
          nickname: socket.nickname,
        });
        ack('success');
      }
    });

    /*#=========================================#
      @ brief : url을 이용해 방 코드를 입력할 시 호출
      @ data
        room_id : link에 입력한 문자열
        nickname : user가 설정한 닉네임 
      @ post
        닉네임이 잘못된 경우 : join fail 전송
        생섣되지 않은 방인 경우 : join fail 전송
        방의 정원이 가득 찬 경우 : join fail 전송
        그 외 : user에게 join succes 전송
              방에 속한 user들에게 update user list, show message(입장) 전송
      #=========================================# 
    */
    socket.on('join room', function (data) {
      const roomId = data.room_id;
      utils.makeLog(
        `join room 실행\n
        room id : ${roomId}\n
        nickname : ${data.nickname}`,
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
        io.in(roomId).emit('show message', {
          type: MESSAGE_TYPE.system,
          id: uuidv4(),
          message: `${socket.nickname}님이 입장했습니다.`,
          user_id: socket.id,
          nickname: socket.nickname,
        });
        utils.makeLog(rooms);
        io.in(roomId).emit('update user list', {
          users: rooms[roomId].users,
        });
      }
    });

    /*#=========================================#
      @ brief : 방 나가기를 누를시 호출
      @ data 
      @ post : disconnectiong 호출
      #=========================================# 
    */
    socket.on('leave room', function (data) {
      socket.disconnecting();
    });

    /*#=========================================#
      @ brief : owner가 게임 시작 버튼을 누를시 호출
      @ data
        round : owner가 설정한 최대 라운드
      @ post : 방에 속한 user들에게 start round 전송
      #=========================================# 
    */
    socket.on('start game', function (data) {
      utils.makeLog(
        `start game 실행\n
        방 : ${socket.roomId}\n
        round : ${data.round}`,
      );
      const roomId = socket.roomId;
      rooms[roomId].startGame(data.round);
      io.in(roomId).emit('start round', {
        round: 1,
        users: rooms[roomId].users,
      });
    });

    /*#=========================================#
      @ brief : user가 메시지를 전송할 시 호출
      @ data
        message : 메시지 
      @ post
        user가 정답을 이미 맞춘 경우 : 방 안의 user들에게 show message(type:solved) 전송
        정답인 경우 : 해당 user에게 correct answer 전송
                    방 안의 user들에게 update score, show message(type:correct) 전송
          -> 모든 인원이 정답을 맞춘 경우는 finishSet function 실행
        그 외 : 방 안의 user들에게 show message(type:all) 전송
      #=========================================# 
    */
    socket.on('send message', function (data, ack) {
      const id = uuidv4();
      const roomId = socket.roomId;
      utils.makeLog(
        `send message 실행\n 
        nickname : ${socket.nickname}\n
        message : ${data.message}\n
        room id :${socket.roomId}\n
        answer : ${rooms[roomId].answer}`,
      );
      if (rooms[roomId].isSolved(socket.id)) {
        io.in(roomId).emit('show message', {
          type: MESSAGE_TYPE.solved,
          id: id,
          message: data.message,
          user_id: socket.id,
          nickname: socket.nickname,
        });
      } else if (data.message == rooms[roomId].answer) {
        //ack('correct');
        rooms[roomId].solve(socket.id, 10);
        socket.emit('correct answer', {});
        io.in(roomId).emit('update score', {
          users: rooms[roomId].users,
        });
        io.in(roomId).emit('show message', {
          type: MESSAGE_TYPE.correct,
          id: id,
          message: `${socket.nickname}님이 정답을 맞췄습니다!`,
          user_id: socket.id,
          nickname: socket.nickname,
        });
        if (rooms[roomId].isFinishSet) {
          setTimeout(finishSet, 1000, roomId);
          //finishSet(roomId);
        }
      } else {
        //ack('wrong');
        io.in(roomId).emit('show message', {
          type: MESSAGE_TYPE.all,
          id: id,
          message: data.message,
          user_id: socket.id,
          nickname: socket.nickname,
        });
      }
    });

    /*#=========================================#
      @ brief : questioner가 그림을 그릴 때 호출
      @ data : 좌표, RGB 값
      @ post : 방 안의 user들에게 drawing 전송
      #=========================================#
    */
    socket.on('drawing', function (data) {
      io.in(socket.roomId).emit('drawing', data);
    });

    /*#=========================================#
      @ brief : questioner가 모두 지우기를 클릭할 시 호출
      @ data
      @ post : 방 안의 user들에게 clear board 전송
      #=========================================#
    */
    socket.on('clear board', function (data) {
      io.in(socket.roomId).emit('clear board', data);
    });

    /*#=========================================#
      @ brief : client가 start round, finish set를 받을 때 호출
      @ data
      @ post
        모든 client가 호출하므로, 방장의 호출에만 응답
        방 안의 user들에게 choice word를 전송
        출제자의 채팅 처리를 위해 출제자에게 correct answer 전송
      #=========================================#
    */
    socket.on('ready set', function (data) {
      const roomId = socket.roomId;
      const questioner = rooms[roomId].questioner;
      if (socket.id == rooms[roomId].owner) {
        rooms[roomId].solve(questioner.id, 0);
        utils.makeLog(
          `ready set on\n
        questioner:${questioner.nickname}`,
        );
        words = utils.getWords();
        io.to(questioner.id).emit('correct answer', {});
        io.in(roomId).emit('choice word', {
          words: words,
          questioner: questioner,
        });
      }
    });

    /*#=========================================#
      @ brief : questioner가 문제를 선택하면 호출
      @ data
        word : 선택한 단어
      @ post : 방 안의 user들에게 start set 전송
      #=========================================#
    */
    socket.on('choice word', function (data) {
      const roomId = socket.roomId;
      rooms[roomId].answer = data.word;
      io.in(socket.roomId).emit('start set', {});
    });

    /*#=========================================#
      @ brief : client가 브라우저를 나갈때 호출
      @ data
      @ post (방에 속한 경우만)
        방의 인원이 0명이 된 경우 : 방 객체 삭제
        그 외 : 방 안의 user들에게 update user list, show message(type:system) 전송
      #=========================================#
    */
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
          io.in(roomId).emit('update user list', {
            users: rooms[roomId].users,
          });
          io.in(roomId).emit('show message', {
            type: MESSAGE_TYPE.system,
            id: uuidv4(),
            message: `${socket.nickname}님이 퇴장했습니다.`,
            user_id: socket.id,
            nickname: socket.nickname,
          });
        }
      }
      utils.makeLog(
        `${socket.id} 퇴장\n
      nickname : ${socket.nickname}`,
      );
    });

    /*#=========================================#
      @ brief : 한 set가 끝난 경우
      @ data
      @ post 
        마지막 round의 마지막 set인 경우 : finish game 전송
        중간 round의 마지막 set인 경우 : finish round 전송
        그 외 : finish set 전송
      #=========================================#
    */
    function finishSet(roomId) {
      rooms[roomId].finishSet();
      utils.makeLog(
        `set : ${rooms[roomId].set}\n
        round : ${rooms[roomId].round},
        maxRound : ${rooms[roomId].maxRound}`,
      );
      if (rooms[roomId].isFinishRound) {
        rooms[roomId].finishRound();
        if (rooms[roomId].isFinishGame) {
          rooms[roomId].finishGame();
          io.in(roomId).emit('finish game', {});
        } else {
          io.in(roomId).emit('start round', {
            round: rooms[roomId].round,
            users: rooms[roomId].users,
          });
        }
      } else {
        io.in(roomId).emit('finish set', {});
      }
    }
  });
};
