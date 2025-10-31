let auctionData = {
  players: [],
  teams: [],
  currentBid: null,
  auctionStatus: 'stopped',
  fileUploaded: false,
  fileName: null,
  stats: {
    highestBid: null,
    lowestBid: null,
    totalSold: 0,
    totalUnsold: 0,
    averageBid: 0
  }
};

let settings = {
  teamCount: 4,
  startingBudget: 1000,
  maxPlayersPerTeam: 15,
  basePrice: 10,
  enableRetention: false,
  retentionsPerTeam: 0,
  biddingIncrements: [
    { threshold: 50, increment: 5 },
    { threshold: 100, increment: 10 },
    { threshold: 200, increment: 20 }
  ]
};

// Action history for undo functionality
let actionHistory = [];

// NEW: Per-player bidding history (key = playerId, value = array of bids)
let playerBiddingHistory = {};

const dataService = {
  // Get complete auction data
  getAuctionData() {
    return { 
      ...auctionData,
      settings: this.getSettings()
    };
  },

  // Settings management
  getSettings() {
    return { ...settings };
  },

  updateSettings(newSettings) {
    console.log('Updating settings:', newSettings);
    settings = { ...settings, ...newSettings };
    return settings;
  },

  // Auction data management
  updateAuctionData(data) {
    auctionData = { ...auctionData, ...data };
    return auctionData;
  },

  // Player management
  getPlayers() {
    return auctionData.players;
  },

  setPlayers(players) {
    auctionData.players = players;
    return players;
  },

  // Team management
  getTeams() {
    return auctionData.teams;
  },

  setTeams(teams) {
    auctionData.teams = teams;
    return teams;
  },

  // Current bid management
  getCurrentBid() {
    return auctionData.currentBid;
  },

  setCurrentBid(bid) {
    auctionData.currentBid = bid;
    return bid;
  },

  // Auction status management
  getAuctionStatus() {
    return auctionData.auctionStatus;
  },

  setAuctionStatus(status) {
    auctionData.auctionStatus = status;
    return status;
  },

  // Stats management
  getStats() {
    return auctionData.stats;
  },

  updateStats(stats) {
    auctionData.stats = stats;
    return stats;
  },

  // NEW: Player-specific bidding history management
  initializeBiddingHistoryForPlayer(playerId) {
    if (!playerBiddingHistory[playerId]) {
      playerBiddingHistory[playerId] = [];
      console.log(`Initialized bidding history for player ${playerId}`);
    }
  },

  addBidToPlayerHistory(playerId, bid) {
    this.initializeBiddingHistoryForPlayer(playerId);
    playerBiddingHistory[playerId].push({
      ...bid,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });
    console.log(`Added bid to player ${playerId} history:`, bid);
    console.log(`Current history for player ${playerId}:`, playerBiddingHistory[playerId]);
  },

  getPlayerBiddingHistory(playerId) {
    return playerBiddingHistory[playerId] || [];
  },

  removeLastBidFromPlayerHistory(playerId) {
    if (playerBiddingHistory[playerId] && playerBiddingHistory[playerId].length > 0) {
      const removedBid = playerBiddingHistory[playerId].pop();
      console.log(`Removed last bid from player ${playerId} history:`, removedBid);
      return removedBid;
    }
    return null;
  },

  clearPlayerBiddingHistory(playerId) {
    playerBiddingHistory[playerId] = [];
    console.log(`Cleared bidding history for player ${playerId}`);
  },

  getPreviousBidForPlayer(playerId) {
    const history = this.getPlayerBiddingHistory(playerId);
    return history.length > 0 ? history[history.length - 1] : null;
  },

  // Action history methods (for sale undo)
  addAction(action) {
    actionHistory.push({
      ...action,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });
    // Keep only last 50 actions
    if (actionHistory.length > 50) {
      actionHistory = actionHistory.slice(-50);
    }
    console.log('Action recorded:', action.type, action.playerName);
  },

  getActionHistory() {
    return [...actionHistory];
  },

  removeActionById(actionId) {
    const index = actionHistory.findIndex(action => action.id === actionId);
    if (index !== -1) {
      return actionHistory.splice(index, 1)[0];
    }
    return null;
  },

  removeLastAction() {
    return actionHistory.pop();
  },

  clearActionHistory() {
    actionHistory = [];
  },

  // Reset all data
  resetAuctionData() {
    auctionData = {
      players: [],
      teams: [],
      currentBid: null,
      auctionStatus: 'stopped',
      fileUploaded: false,
      fileName: null,
      stats: {
        highestBid: null,
        lowestBid: null,
        totalSold: 0,
        totalUnsold: 0,
        averageBid: 0
      }
    };
    
    actionHistory = [];
    playerBiddingHistory = {}; // Clear all player bidding histories
    
    return auctionData;
  }
};

module.exports = dataService;
