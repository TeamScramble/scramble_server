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

const utils = require('./src/utils.js');

server.listen(8080, function () {
  utils.makeLog('서버 실행');
});

require('./src/socket.js')(io);
