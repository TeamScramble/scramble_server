const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('port', process.env.PORT || 8005);

// express 서버 litern
const server = app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기중');
})

webSocket(server);