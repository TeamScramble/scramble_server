module.exports = class {
  constructor() {
    this.round = 1;
    this.maxRound = 10;
    this.users = [];
    this.nicknames = [];
  }
  joinUser(id, nickname) {
    this.users.push(id);
    this.nicknames.push(nickname);
  }
  leaveUser(id, nickname) {
    const idx = this.users.indexOf(id);
    this.users.splice(idx, 1);
    this.nicknames.splice(nickname, 1);
  }
  get owner() {
    return this.users[0];
  }
  get userCount() {
    return this.users.length;
  }
};
