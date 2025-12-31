const history = {};

module.exports = io => {
  io.on("connection", socket => {

    socket.on("ADD_HISTORY", entry => {
      if (!history[socket.peerId]) history[socket.peerId] = [];
      history[socket.peerId].unshift(entry);
      socket.emit("HISTORY", history[socket.peerId]);
    });

    socket.on("GET_HISTORY", () => {
      socket.emit("HISTORY", history[socket.peerId] || []);
    });

  });
};
