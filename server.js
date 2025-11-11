const fs = require("fs");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });

const DATA_FILE = "data.json";

// Load or initialize data
let data;
try {
  data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
} catch {
  data = {
    votes: Array(10).fill(0),
    points: Array(10).fill(0),
    ppmHistory: Array(10).fill(0).map(() => [])
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.use(express.static(__dirname));

// On connect: send full game state
io.on("connection", socket => {
  socket.emit("update", data);

  socket.on("vote", ({ index, delta }) => {
    data.votes[index] += delta;
    io.emit("update", data);
  });
});

// SERVER-SIDE POINT GENERATION
setInterval(() => {
  for (let i = 0; i < 10; i++) {
    const amount = Math.floor(Math.random() * (Math.abs(data.votes[i]) + 7));
    data.points[i] += data.votes[i] >= 0 ? amount : -amount;
  }
}, 1000);

// SERVER-SIDE DECAY
setInterval(() => {
  for (let i = 0; i < 10; i++) {
    if (data.votes[i] > 0) data.votes[i]--;
    else if (data.votes[i] < 0) data.votes[i]++;
  }
}, 20000);

// ✅ SERVER-SIDE PPM TRACKING
setInterval(() => {
  for (let i = 0; i < 10; i++) {

    // push current points into history
    data.ppmHistory[i].push(data.points[i]);

    // keep exactly 60 seconds of history
    if (data.ppmHistory[i].length > 60)
      data.ppmHistory[i].shift();

    // calculate PPM
    let ppm = 0;
    if (data.ppmHistory[i].length === 60) {
      ppm = data.points[i] - data.ppmHistory[i][0];
    }

    // attach ppm to data packet sent to client
    data.ppm = data.ppm || Array(10).fill(0);
    data.ppm[i] = ppm;
  }

  io.emit("update", data);

}, 1000);

// Save every 5 seconds
setInterval(() => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}, 5000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("✅ SERVER RUNNING ON PORT", PORT);
});



