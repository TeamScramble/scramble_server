function Create(data) {
    const id = 1
    for (var i in data) {
        if (id === i) {
            id++;
        }
    }
    data.push(id);
}

module.exports = Create;