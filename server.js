// server.js
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

// Update points every second
setInterval(() => {
  for(let i=0;i<colorNames.length;i++){
    const delta = Math.floor(Math.random()*(Math.abs(votes[i])+5));
    points[i] += votes[i] >= 0 ? delta : -delta;
  }
  io.emit('update', {votes, points});
}, 1000);

// Vote decay every 20 seconds
setInterval(() => {
  for(let i=0;i<colorNames.length;i++){
    if(votes[i] > 0) votes[i]--;
    else if(votes[i] < 0) votes[i]++;
  }
  io.emit('update', {votes, points});
}, 20000);

io.on('connection', socket => {
  // Send initial state
  socket.emit('update', {votes, points});

  // Listen for vote changes from clients
  socket.on('vote', ({index, delta}) => {
    votes[index] += delta;
    io.emit('update', {votes, points});
  });
});

server.listen(3000, () => console.log('Server running on port 3000'));
