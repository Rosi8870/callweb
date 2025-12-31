/* -------- CONFIG -------- */
const BACKEND_URL = location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://callweb-backend.onrender.com";

/* -------- Socket -------- */
const socket = io(BACKEND_URL, { transports: ["websocket"] });

/* -------- Peer (CHANGING ID) -------- */
const peer = new Peer(undefined, {
  host: BACKEND_URL.replace("https://", "").replace("http://", ""),
  secure: BACKEND_URL.startsWith("https"),
  port: BACKEND_URL.startsWith("https") ? 443 : 3000,
  path: "/"
});

/* -------- Media -------- */
let localStream;
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => localStream = stream);

/* -------- UI -------- */
const permanentIdEl = document.getElementById("permanentId");
const callBtn = document.getElementById("callBtn");
const targetIdInput = document.getElementById("targetId");
const remoteAudio = document.getElementById("remoteAudio");

/* -------- Receive Permanent ID -------- */
socket.on("PERMANENT_ID", id => {
  permanentIdEl.innerText = id;
});

/* -------- Register Peer -------- */
peer.on("open", peerId => {
  socket.emit("REGISTER_PEER", peerId);
});

/* -------- Call -------- */
callBtn.onclick = () => {
  const targetId = targetIdInput.value.trim();
  if (!targetId) return;

  socket.emit("RESOLVE_ID", targetId, peerId => {
    if (!peerId) {
      alert("User offline");
      return;
    }

    const call = peer.call(peerId, localStream);
    call.on("stream", stream => {
      remoteAudio.srcObject = stream;
    });
  });
};

/* -------- Incoming Call -------- */
peer.on("call", call => {
  call.answer(localStream);
  call.on("stream", stream => {
    remoteAudio.srcObject = stream;
  });
});
