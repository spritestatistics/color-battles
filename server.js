const fs = require("fs");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });

const DATA_FILE = "data.json";

// Load or create data file
let data;
try {
  data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
} catch {
  data = { 
    points: Array(10).fill(0),
    votes:  Array(10).fill(0)
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Auto-save to file every 5 seconds
setInterval(() => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}, 5000);

// Serve static files (your index.html)
app.use(express.static(__dirname));

io.on("connection", socket => {
  console.log("✅ A user connected:", socket.id);

  // Send current data to new user
  socket.emit("init", data);

  // When client updates votes or points
  socket.on("update", updated => {
    data.points = updated.points;
    data.votes  = updated.votes;

    // Broadcast to all clients
    socket.broadcast.emit("sync", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
