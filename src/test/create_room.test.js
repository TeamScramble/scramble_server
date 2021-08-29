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

describe('==create room test==', () => {
  let io, serverSocket, clientSocket;

  beforeAll(done => {
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

  test('valid nickname', done => {
    clientSocket.emit('create room', { nickname: NICKNAME_CASE.valid }, arg => {
      expect(arg).toBe('success');
      done();
    });
  });

  test('empty nickname', done => {
    clientSocket.emit('create room', { nickname: NICKNAME_CASE.empty }, arg => {
      expect(arg).toBe('fail');
      done();
    });
  });

  test('too long nickname', done => {
    clientSocket.emit(
      'create room',
      { nickname: NICKNAME_CASE.over_max_length },
      arg => {
        expect(arg).toBe('fail');
        done();
      },
    );
  });
});
