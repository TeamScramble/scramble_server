module.exports = class {
  constructor() {
    this.round = 0;
    this.maxRound = 10;
    this.users = [];
    this.isPlaying = false;
    this.order = [];
    this.set = 0;
    this.answer = '';
    this.solver = new Set();
  }
  joinUser(id, nickname) {
    const user = {
      id: id,
      nickname: nickname,
      score: 0,
    };
    this.users.push(user);
  }
  findUser(id) {
    return this.users.findIndex(i => i.id == id);
  }
  leaveUser(id) {
    const idx = this.findUser(id);
    this.users.splice(idx, 1);
  }
  solve(id, score) {
    const idx = this.findUser(id);
    this.users[idx].score += score;
    this.solver.add(id);
  }
  isSolved(id) {
    return this.solver.has(id);
  }
  startGame(maxRound) {
    this.maxRound = maxRound;
    this.isPlaying = true;
    this.round = 0;
    this.solver.clear();
    for (let i = 0; i < this.users.length; i++) {
      this.users[i].score = 0;
    }
    this.finishRound();
  }
  finishGame() {
    this.isPlaying = false;
  }
  finishRound() {
    this.round++;
    this.set = 0;
    this.order = [...Array(this.userCount)].map((v, i) => i);
    this.order.sort(() => Math.random() - 0.5);
  }

  finishSet() {
    this.set++;
    this.solver.clear();
  }

  get owner() {
    return this.users[0].id;
  }
  get userCount() {
    return this.users.length;
  }
  get questioner() {
    console.log(`order = ${this.order}`);
    const idx = this.order[this.set];
    console.log(`idx = ${idx}`);
    return this.users[idx];
  }
  get isFinishSet() {
    return this.solver.size >= this.userCount;
  }
  get isFinishRound() {
    return this.set >= this.userCount;
  }
  get isFinishGame() {
    return this.round > this.maxRound;
  }
};
