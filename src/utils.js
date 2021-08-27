exports.makeRoomId = function (rooms) {
  let randomId = '';
  do {
    randomId = Math.random().toString(36).substr(2, 11);
  } while (rooms.hasOwnProperty(randomId));
  return randomId;
};

exports.nameCheck = function (nickname) {
  console.log(nickname);
  return nickname && nickname.length > 1 && nickname.length <= 20;
};

exports.makeLog = function (message) {
  console.log(message);
};
