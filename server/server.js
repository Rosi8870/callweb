const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { ExpressPeerServer } = require("peer");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));

const server = http.createServer(app);

/* -------- Socket.IO -------- */
const io = new Server(server, {
  cors: { origin: "*" }
});

/* -------- PeerJS -------- */
const peerServer = ExpressPeerServer(server, {
  path: "/peerjs"
});
app.use("/peerjs", peerServer);

/* -------- In-memory store -------- */
const ipToPermanentId = {};
const permanentToPeerId = {};

/* -------- Helpers -------- */
function permanentIdFromIP(ip) {
  return crypto.createHash("sha1").update(ip).digest("hex").slice(0, 10);
}

/* -------- Socket Logic -------- */
io.on("connection", socket => {
  const ip =
    socket.handshake.headers["x-forwarded-for"]?.split(",")[0] ||
    socket.handshake.address;

  if (!ipToPermanentId[ip]) {
    ipToPermanentId[ip] = permanentIdFromIP(ip);
  }

  const permanentId = ipToPermanentId[ip];
  socket.emit("PERMANENT_ID", permanentId);

  socket.on("REGISTER_PEER", peerId => {
    permanentToPeerId[permanentId] = peerId;
  });

  socket.on("RESOLVE_ID", (targetPermanentId, cb) => {
    cb(permanentToPeerId[targetPermanentId] || null);
  });

  socket.on("disconnect", () => {
    delete permanentToPeerId[permanentId];
  });
});

/* -------- Start -------- */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
