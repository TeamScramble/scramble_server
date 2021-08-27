module.exports = class {
  constructor() {
    this.round = 1;
    this.maxRound = 10;
    this.users = [];
  }
  joinUser(id) {
    this.users.push(id);
  }
  leaveUser(id) {
    const idx = this.users.indexOf(id);
    this.users.splice(idx, 1);
  }
  get owner() {
    return this.users[0];
  }
  get userCount() {
    return this.users.length;
  }
};
