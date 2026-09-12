// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' })); // room for inline team-logo data URLs

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const playerRoutes = require('./routes/playerRoutes');
const teamRoutes = require('./routes/teamRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api', downloadRoutes);
app.use('/api/registrations', registrationRoutes);

// ENHANCED ERROR HANDLING MIDDLEWARE (Must be AFTER routes)
app.use((err, req, res, next) => {
  // Never log secrets (passwords, tokens) that may be present in the body.
  const SENSITIVE = ['password', 'currentPassword', 'newPassword', 'token'];
  const safeBody = { ...(req.body || {}) };
  SENSITIVE.forEach((k) => { if (safeBody[k] !== undefined) safeBody[k] = '[REDACTED]'; });

  console.error('\n=== DETAILED ERROR INFORMATION ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Request Method:', req.method);
  console.error('Request URL:', req.url);
  console.error('Request Body:', safeBody);
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('=== END ERROR INFORMATION ===\n');
  
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
    path: req.url,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl
  });
});

module.exports = app;
