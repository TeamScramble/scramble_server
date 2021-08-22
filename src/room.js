export class Room {
  constructor() {
    this.round = 1;
    this.maxRound = 10;
    this.users = [];
  }
  enterUser(id) {
    this.users.push(id);
  }
  leaveUser(id) {
    idx = this.users.indexOf(id);
    this.users.splice(idx, 1);
  }
  get firstUser() {
    return this.users[0];
  }
  get userCount() {
    return this.users.length;
  }
}
