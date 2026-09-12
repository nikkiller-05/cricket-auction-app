const socketIo = require('socket.io');
const { runWithAuction, currentAuctionId, DEFAULT_AUCTION_ID } = require('./auctionContext');

let io = null;

// Every auction has its own Socket.IO room so events only reach the clients
// watching that auction.
const roomFor = (id) => `auction:${id || DEFAULT_AUCTION_ID}`;

const socketService = {
  init: (socketIo) => {
    io = socketIo;
    console.log('🚀 Socket.IO service initialized');

    io.on('connection', (socket) => {
      // The client tells us which auction it's watching (default when omitted).
      const auctionId = socket.handshake.query?.auctionId || DEFAULT_AUCTION_ID;
      socket.data.auctionId = auctionId;
      socket.join(roomFor(auctionId));
      console.log(`👤 User connected: ${socket.id} (auction: ${auctionId})`);

      // Send initial auction data for THIS client's auction.
      try {
        runWithAuction(auctionId, () => {
          const dataService = require('./dataService');
          const auctionData = dataService.getAuctionData();
          console.log('📤 Sending initial auction data to:', socket.id);
          socket.emit('auctionData', auctionData);
        });
      } catch (error) {
        console.error('❌ Error sending initial data:', error);
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
    if (!io) {
      console.error('❌ Socket.IO not initialized');
      return;
    }
    // Scope the broadcast to the current auction's room. Controllers run inside
    // the auction context (HTTP middleware / deferred re-entry), so this targets
    // exactly the clients watching that auction.
    const room = roomFor(currentAuctionId());
    console.log(`📡 Broadcasting event: ${event} -> ${room}`);
    if (event === 'auctionData' && data) {
      const optimizedData = {
        ...data,
        players: data.players || [],
        teams: data.teams || [],
        currentBid: data.currentBid,
        auctionStatus: data.auctionStatus,
        stats: data.stats
      };
      io.to(room).emit(event, optimizedData);
    } else {
      io.to(room).emit(event, data);
    }
  }
};

module.exports = socketService;
