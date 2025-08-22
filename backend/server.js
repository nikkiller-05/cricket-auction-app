// server.js - This is your main file
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app'); // Import the Express app
const config = require('./config/config');

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://cricket-auction-live-awer.onrender.com"
    ],
    methods: ["GET", "POST"]
  }
});

const socketService = require('./services/socketService');
socketService.init(io);

// ONLY place where server.listen is called
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Cricket Auction API is ready!`);
  console.log(`🌐 Admin Panel: http://localhost:3000/admin`);
  console.log(`👥 Viewer Mode: http://localhost:3000`);
});
