// server.js
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // serve HTML/JS

const colorNames = ["red","blue","green","yellow","purple","orange","cyan","pink","white","black"];
let votes = Array(colorNames.length).fill(0);
let points = Array(colorNames.length).fill(0);

const SAVE_FILE = 'data.json';

// ✅ Load saved data if exists
function loadData() {
  if (fs.existsSync(SAVE_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
      if (saved.votes && saved.points) {
        votes = saved.votes;
        points = saved.points;
        console.log("✅ Loaded saved data");
      }
    } catch (err) {
      console.log("❌ Error loading save file:", err);
    }
  } else {
    console.log("ℹ️ No save file found, starting fresh.");
  }
}

// ✅ Save data to file
function saveData() {
  const data = JSON.stringify({ votes, points });
  fs.writeFile(SAVE_FILE, data, err => {
    if (err) console.error("❌ Error saving data:", err);
  });
}

// Load on boot
loadData();

// ✅ Update points every second
setInterval(() => {
  for (let i = 0; i < colorNames.length; i++) {
    const delta = Math.floor(Math.random() * (Math.abs(votes[i]) + 5));
    points[i] += votes[i] >= 0 ? delta : -delta;
  }
  io.emit('update', { votes, points });

  saveData(); // ✅ auto-save
}, 1000);

// ✅ Vote decay every 20 seconds
setInterval(() => {
  for (let i = 0; i < colorNames.length; i++) {
    if (votes[i] > 0) votes[i]--;
    else if (votes[i] < 0) votes[i]++;
  }
  io.emit('update', { votes, points });

  saveData(); // ✅ auto-save
}, 20000);

io.on('connection', socket => {
  socket.emit('update', { votes, points });

  socket.on('vote', ({ index, delta }) => {
    votes[index] += delta;
    io.emit('update', { votes, points });

    saveData(); // ✅ Save on vote change
  });
});

// ✅ Save every 5 seconds (extra safety)
setInterval(saveData, 5000);

server.listen(3000, () => console.log('✅ Server running on port 3000'));

