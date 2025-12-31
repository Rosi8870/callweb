const { PeerServer } = require("peer");

PeerServer({
  port: 9000,
  path: "/peer",
  allow_discovery: true
});

console.log("✅ PeerJS running on http://localhost:9000");
