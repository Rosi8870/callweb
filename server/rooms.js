module.exports = io => {
  io.on("connection", socket => {
    socket.on("CHECK_ROOM_PASSWORD", ({ password }, cb) => {
      cb(password === "1234"); // simple demo
    });
  });
};
