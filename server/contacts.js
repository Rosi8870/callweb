const contacts = {};

module.exports = io => {
  io.on("connection", socket => {

    socket.on("ADD_CONTACT", contact => {
      if (!contacts[socket.peerId]) contacts[socket.peerId] = [];
      contacts[socket.peerId].push(contact);
      socket.emit("CONTACTS", contacts[socket.peerId]);
    });

    socket.on("GET_CONTACTS", () => {
      socket.emit("CONTACTS", contacts[socket.peerId] || []);
    });

  });
};
