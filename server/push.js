module.exports = io => {
  io.on("connection", socket => {
    socket.on("NOTIFY", data => {
      console.log("🔔 Notification:", data);
    });
  });
};
