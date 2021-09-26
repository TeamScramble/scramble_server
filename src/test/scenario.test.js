const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

const Room = require('../room.js');
const utils = require('../utils.js');

const NICKNAME_CASE = {
  empty: '',
  valid: '춤추는 김다희',
  over_max_length:
    '안녕하세요저는태평양에서수영해서여기까지왔습니다잘부탁드려요',
};

describe('==game test==', () => {
  let io, serverSocket, clientSocket, cnt;

  beforeAll(done => {
    cnt = 1;
    const httpServer = createServer();
    io = new Server(httpServer);
    require('../socket.js')(io);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('game scenario test', done => {
    clientSocket.emit('create room', { nickname: NICKNAME_CASE.valid }, arg => {
      expect(arg).toEqual('success');
    });

    clientSocket.emit('start game', { round: 3 }, arg => {});

    clientSocket.on('start round', function (data) {
      expect(data.round).toEqual(cnt);
      cnt++;
      clientSocket.emit('ready set', {});
    });

    clientSocket.on('choice word', function (data) {
      expect(data.words).toEqual(['1', '2', '3']);
      clientSocket.emit('choice word', { word: '1' });
    });

    clientSocket.on('start set', function (data) {
      // arg는 서버 테스트용 인자다.
      clientSocket.emit('send message', { message: '2' }, arg => {
        expect(arg).toEqual('wrong');
      });
      clientSocket.emit('send message', { message: '1' }, arg => {
        expect(arg).toEqual('correct');
      });
    });
    clientSocket.on('finish game', function (data) {
      done();
    });
  });
});
