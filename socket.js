const SocketIO = require('socket.io');

module.exports = (server) => {
    const io = SocketIO(server, {path: '/socket.io', transports: ['websocket']});
    
    io.on('connection', (socket) => {
        const req = socket.request;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log( ip + '의 새로운 유저가 접속하였습니다.');
        
        socket.on('error', (error) => {
            console.log("에러 발생.")
        })

        socket.on('createRoom', function(data) {
            console.log("CreateRoom Event");
            roomid = CreateID();
            if (io.sockets.adapter.rooms[roomId]) {
                console.log('방이 이미 있습니다.');
                socket.emit("exist");
            } else {
                console.log("방 생성 시작");
                socket.join(roomId);
                io.sockets.adapter.rooms[roomId].host = data.name;
                if (data.password == "") {
                    io.sockets.adapter.rooms[roomId].isOpen = true;
                } else {
                    io.sockets.adapter.rooms[roomId].isOpen = false;
                    io.sockets.adapter.rooms[roomId].password = data.password;
                    io.sockets.adapter.rooms[roomId].max_user = data.max_user;
                }
            }

        });
        
        socket.on('JoinRoom', function(data) {
            console.log("JoinRoom Event");
            if (!io.sockets.adapter.rooms[data.roomId] && !io.sockets.adapter.rooms[data.roomName]) {
                console.log("방이 존재하지 않습니다.");
                socket.emit("Fail");
            } else {
                const currentRoom = io.sockets.adapter.rooms[data.roomId];
                if (!currentRoom.isOpen && currentRoom.password !== data.password) {
                    console.log("비밀번호가 틀렸습니다.")
                    socket.emit("again");
                    // 다시 화면으로
                } else if (currentRoom.max_user < data.max_user) {
                    console.log("방에 인원이 다 차있습니다.");
                    socket.emit("Fail");
                } else {
                    socket.join(data.roomId);
                }
            }
        });
        socket.on('Update', function(data) {
            const currentRoom = io.sockets.adapter.rooms[data.roomId];
            currentRoom.id = data.roomId;
            currentRoom.name = data.roomName;
            currentRoom.host = data.name;
            currentRoom.isOpen = data.isOpen;
            currentRoom.max_people = data.max_user;
        });

        socket.on('DeleteRoom', function(data) {
            // 방소유주가 아닐 경우
            if (!io.sockets.adapter.rooms[data.roomId]) { 
                // 방이 만들어지지 않은 경우
                console.log('방이 만들어져있지 않습니다.')
            } else {
                const currentRoom = io.sockets.adapter.rooms[data.roomId];

                if (currentRoom.host == data.name) {
                    socket.leave(currentRoom);
                    delete io.sockets.adapter.rooms[room.roomId];
                    socket.broadcast.to(currentRoom).emit("Delete"); // 본인제외 방없어진 메시지 보내기
                } else {
                    console.log("권한이 없습니다.");
                    socket.emit("Fail_delete",); // event 수정
                }
            }
        })
    })
}

function CreateID(data) {
    const id = 1
    for (var i in data) {
        if (id === i) {
            id++;
        }
    }
    return id;
}