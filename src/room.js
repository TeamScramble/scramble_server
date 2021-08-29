module.exports = class {
  constructor() {
    this.round = 1;
    this.maxRound = 10;
    this.users = [];
    this.nicknames = [];
    this.isPlaying = false;
  }
  joinUser(id, nickname) {
    const user = {
      id: id,
      nickname: nickname,
    };
    this.users.push(user);
  }
  leaveUser(id) {
    const idx = this.users.findIndex(i => i.id == id);
    this.users.splice(idx, 1);
  }
  startGame() {
    this.isPlaying = true;
  }
  endGame() {
    this.isPlaying = false;
  }

  get owner() {
    return this.users[0].id;
  }
  get userCount() {
    return this.users.length;
  }
};
