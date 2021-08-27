exports.makeRoomId = function (rooms) {
  let randomId = '';
  do {
    randomId = Math.random().toString(36).substr(2, 11);
  } while (rooms.hasOwnProperty(randomId));
  return randomId;
};

exports.nameCheck = function (name) {
  return name.length > 1 && name.length <= 10;
};

exports.makeLog = function (message) {
  console.log(message);
};
