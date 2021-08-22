export function makeRoomId(rooms) {
  let randomId = '';
  do {
    randomId = Math.random.toString(36).substr(2, 11);
  } while (!rooms.hasOwnProperty(randomId));
  return randomId;
}
