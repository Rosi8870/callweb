/* ================= SOCKET ================= */
const socket = io("https://your-backend.onrender.com", {
  transports: ["websocket"],
});


/* ================= MIC (ONCE) ================= */
let localStream;
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => localStream = stream)
  .catch(() => alert("Microphone permission required"));

/* ================= PEER ================= */
const peer = new Peer(undefined, {
  host: "your-backend.onrender.com",
  port: 443,
  path: "/peer",
  secure: true
});

/* ================= STATE ================= */
let myPeerId = "";
let permanentId = "";
let currentCall = null;
let timerInterval = null;
let seconds = 0;

/* ================= ELEMENTS ================= */
const statusEl = document.getElementById("status");
const permanentIdEl = document.getElementById("permanentId");
const myPeerIdEl = document.getElementById("myPeerId");
const toastEl = document.getElementById("toast");

const callBtn = document.getElementById("callBtn");
const endBtn = document.getElementById("endBtn");
const copyPermanentBtn = document.getElementById("copyPermanentBtn");
const callTimer = document.getElementById("callTimer");

/* ================= TOAST ================= */
function toast(msg) {
  toastEl.innerText = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2000);
}

/* ================= TIMER ================= */
function startTimer() {
  stopTimer(); // safety
  seconds = 0;
  callTimer.innerText = "00:00";
  callTimer.classList.remove("hidden");

  timerInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    callTimer.innerText = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  callTimer.classList.add("hidden");
}

/* ================= PERMANENT ID ================= */
socket.on("PERMANENT_ID", id => {
  permanentId = id;
  permanentIdEl.innerText = id;
});

/* ================= PEER READY ================= */
peer.on("open", id => {
  myPeerId = id;
  myPeerIdEl.innerText = id;
  statusEl.innerText = "Ready";
  socket.emit("REGISTER_PEER", id);
});

/* ================= COPY PERMANENT ID ================= */
copyPermanentBtn.onclick = async () => {
  await navigator.clipboard.writeText(permanentId);
  toast("Permanent ID copied");
};

/* ================= UI HELPERS ================= */
function setIdleUI() {
  callBtn.hidden = false;
  copyPermanentBtn.hidden = false;
  endBtn.hidden = true;
  stopTimer();
  statusEl.innerText = "Ready";
}

function setConnectedUI() {
  callBtn.hidden = true;
  copyPermanentBtn.hidden = true;
  endBtn.hidden = false;
  statusEl.innerText = "Connected";
}

/* ================= CALL ================= */
callBtn.onclick = () => {
  const targetPermanentId = callId.value.trim();
  if (!targetPermanentId) return;

  statusEl.innerText = "Calling…";
  callBtn.hidden = true;
  copyPermanentBtn.hidden = true;

  socket.emit("RESOLVE_PERMANENT_ID", targetPermanentId, peerId => {
    if (!peerId) {
      toast("User offline");
      setIdleUI();
      return;
    }

    currentCall = peer.call(peerId, localStream);

    currentCall.on("stream", stream => {
      remoteAudio.srcObject = stream;

      // ✅ CALL ACTUALLY CONNECTED HERE
      setConnectedUI();
      startTimer();
    });

    currentCall.on("close", () => {
      setIdleUI();
    });
  });
};

/* ================= END CALL ================= */
endBtn.onclick = () => {
  if (currentCall) {
    currentCall.close();
    currentCall = null;
  }
  setIdleUI();
};

/* ================= INCOMING CALL ================= */
peer.on("call", call => {
  incoming.classList.remove("hidden");
  callerPermanentId.innerText = call.peer;

  answerBtn.onclick = () => {
    incoming.classList.add("hidden");

    call.answer(localStream);
    currentCall = call;

    call.on("stream", stream => {
      remoteAudio.srcObject = stream;

      // ✅ START TIMER ONLY AFTER ANSWER
      setConnectedUI();
      startTimer();
    });

    call.on("close", () => {
      setIdleUI();
    });
  };

  rejectBtn.onclick = () => {
    incoming.classList.add("hidden");
  };
});
