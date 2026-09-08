// server.js - This is your main file
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app'); // Import the Express app
const config = require('./config/config');

// Fail fast: a real JWT secret is mandatory — never run on a default.
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set. Refusing to start. Set JWT_SECRET in the environment.');
  process.exit(1);
}

// Create HTTP server
const server = http.createServer(app);

// Allowed browser origins for websockets — override with ALLOWED_ORIGINS (comma-separated).
const defaultOrigins = [
  'http://localhost:3000',
  'https://cricket-auction-live-awer.onrender.com',
  'https://goldenbidx.com',
  'https://www.goldenbidx.com',
];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : defaultOrigins;

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

const socketService = require('./services/socketService');
socketService.init(io);

const dataService = require('./services/dataService');

// ONLY place where server.listen is called
const PORT = process.env.PORT || 5000;

// Restore any saved auction state before accepting connections, so a restart
// or redeploy resumes the auction instead of starting empty.
dataService.loadSnapshot()
  .then((restored) => {
    if (restored) console.log('♻️  Restored auction state from Supabase snapshot');
  })
  .catch((err) => console.log('⚠️  Snapshot restore skipped:', err.message))
  .finally(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Cricket Auction API is ready!`);
      console.log(`🌐 Admin Panel: http://localhost:3000/admin`);
      console.log(`👥 Viewer Mode: http://localhost:3000`);
    });
  });

// On a planned shutdown (Render deploy/restart sends SIGTERM), flush the
// latest state so nothing in the debounce window is lost.
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received - flushing auction snapshot before exit`);
  try {
    await dataService.flushSnapshot();
  } catch (err) {
    console.log('⚠️  Snapshot flush on shutdown failed:', err.message);
  }
  process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
