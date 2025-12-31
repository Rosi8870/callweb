module.exports = io => {
  const users = {};          // peerId -> socketId
  const activeCalls = {};    // peerId -> peerId
  const callTimers = {};     // peerId -> timeout

  const CALL_TIMEOUT = 15000; // 15 seconds

  io.on("connection", socket => {

    socket.on("REGISTER", peerId => {
      socket.peerId = peerId;
      users[peerId] = socket.id;
    });

    /* CALL REQUEST */
    socket.on("CALL_REQUEST", ({ to }) => {
      if (!users[to]) {
        socket.emit("CALL_DECLINED", { reason: "offline" });
        return;
      }

      activeCalls[socket.peerId] = to;
      activeCalls[to] = socket.peerId;

      io.to(users[to]).emit("INCOMING_CALL", { from: socket.peerId });
      socket.emit("CALL_CONNECTING");

      // Missed call timeout
      callTimers[to] = setTimeout(() => {
        if (activeCalls[to]) {
          io.to(users[socket.peerId]).emit("CALL_MISSED");
          io.to(users[to]).emit("CALL_MISSED");

          delete activeCalls[socket.peerId];
          delete activeCalls[to];
        }
      }, CALL_TIMEOUT);
    });

    /* ANSWER */
    socket.on("ANSWER_CALL", () => {
      const other = activeCalls[socket.peerId];
      if (!other) return;

      clearTimeout(callTimers[socket.peerId]);

      io.to(users[other]).emit("CALL_ACCEPTED", { by: socket.peerId });
      socket.emit("CALL_ACCEPTED", { by: socket.peerId });
    });

    /* DECLINE */
    socket.on("REJECT_CALL", () => {
      const other = activeCalls[socket.peerId];
      if (!other) return;

      clearTimeout(callTimers[socket.peerId]);

      io.to(users[other]).emit("CALL_DECLINED", { by: socket.peerId });
      socket.emit("CALL_DECLINED", { by: socket.peerId });

      delete activeCalls[socket.peerId];
      delete activeCalls[other];
    });

    /* END CALL */
    socket.on("END_CALL", () => {
      const other = activeCalls[socket.peerId];
      if (!other) return;

      io.to(users[other]).emit("CALL_ENDED", { by: socket.peerId });
      socket.emit("CALL_ENDED", { by: socket.peerId });

      delete activeCalls[socket.peerId];
      delete activeCalls[other];
    });

    socket.on("disconnect", () => {
      const other = activeCalls[socket.peerId];
      if (other && users[other]) {
        io.to(users[other]).emit("CALL_ENDED", { by: socket.peerId });
        delete activeCalls[other];
      }
      delete activeCalls[socket.peerId];
      delete users[socket.peerId];
    });
  });
};
