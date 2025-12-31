const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { ExpressPeerServer } = require("peer");
const crypto = require("crypto");
const cors = require("cors");

const app = express();

/* CORS FIRST */
app.use(cors({ origin: "*" }));

const server = http.createServer(app);

/* SOCKET.IO */
const io = new Server(server, {
  cors: { origin: "*" }
});

/* PEERJS — THIS CREATES /peerjs/id */
const peerServer = ExpressPeerServer(server, {
  path: "/peerjs"
});

app.use("/peerjs", peerServer);

/* PERMANENT ID MAPS */
const ipToPermanentId = {};
const permanentToPeerId = {};
const socketToPermanent = {};

function generatePermanentId(ip) {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 10);
}

io.on("connection", socket => {
  const ip =
    socket.handshake.headers["x-forwarded-for"]?.split(",")[0] ||
    socket.handshake.address;

  if (!ipToPermanentId[ip]) {
    ipToPermanentId[ip] = generatePermanentId(ip);
  }

  const permanentId = ipToPermanentId[ip];
  socket.emit("PERMANENT_ID", permanentId);

  socket.on("REGISTER_PEER", peerId => {
    permanentToPeerId[permanentId] = peerId;
    socketToPermanent[socket.id] = permanentId;
  });

  socket.on("RESOLVE_PERMANENT_ID", (targetPermanentId, cb) => {
    cb(permanentToPeerId[targetPermanentId] || null);
  });

  socket.on("disconnect", () => {
    const pid = socketToPermanent[socket.id];
    if (pid) {
      delete permanentToPeerId[pid];
      delete socketToPermanent[socket.id];
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Backend running");
});
