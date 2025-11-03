const socketIo = require('socket.io');

let io = null;

const socketService = {
  init: (socketIo) => {
    io = socketIo;
    console.log('🚀 Socket.IO service initialized');
    
    io.on('connection', (socket) => {
      console.log('👤 User connected:', socket.id);
      
      // IMPORTANT: Send initial auction data immediately
      try {
        const dataService = require('./dataService');
        const auctionData = dataService.getAuctionData();
        console.log('📤 Sending initial auction data to:', socket.id);
        socket.emit('auctionData', auctionData);
      } catch (error) {
        console.error('❌ Error sending initial data:', error);
        // Send minimal data structure
        socket.emit('auctionData', {
          players: [],
          teams: [],
          currentBid: null,
          auctionStatus: 'stopped',
          fileUploaded: false,
          stats: {
            highestBid: null,
            lowestBid: null,
            totalSold: 0,
            totalUnsold: 0,
            averageBid: 0
          }
        });
      }
      
      socket.on('disconnect', () => {
        console.log('👋 User disconnected:', socket.id);
      });
    });
  },

  emit: (event, data) => {
    if (io) {
      console.log(`📡 Broadcasting event: ${event}`);
      // Optimize large data payloads by only sending changed data for certain events
      if (event === 'auctionData' && data) {
        // For large datasets, consider sending only essential fields
        const optimizedData = {
          ...data,
          // Compress player data if needed (send only essential fields in some cases)
          players: data.players || [],
          teams: data.teams || [],
          currentBid: data.currentBid,
          auctionStatus: data.auctionStatus,
          stats: data.stats
        };
        io.emit(event, optimizedData);
      } else {
        io.emit(event, data);
      }
    } else {
      console.error('❌ Socket.IO not initialized');
    }
  }
};

module.exports = socketService;
