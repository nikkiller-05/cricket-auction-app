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
  enableCaptains: true,
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

// --- Persistence: best-effort Supabase snapshot ---------------------------
// In-memory state above stays the source of truth. After any mutation we
// schedule a debounced write of the whole state so a restart can restore it.
const snapshotStore = require('./snapshotStore');

const SNAPSHOT_DEBOUNCE_MS = 1000;
let snapshotTimer = null;

function serializeState() {
  return { auctionData, settings, actionHistory, playerBiddingHistory };
}

// Throttle-trailing: coalesce a burst of mutations into a single write and
// never keep the process alive just for a pending snapshot.
function scheduleSnapshot() {
  if (snapshotTimer) return;
  snapshotTimer = setTimeout(() => {
    snapshotTimer = null;
    snapshotStore.saveState(serializeState());
  }, SNAPSHOT_DEBOUNCE_MS);
  if (snapshotTimer.unref) snapshotTimer.unref();
}

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
    scheduleSnapshot();
    return settings;
  },

  // Config management (for updating settings from UI)
  getConfig() {
    return { 
      teamCount: settings.teamCount,
      startingBudget: settings.startingBudget,
      maxPlayersPerTeam: settings.maxPlayersPerTeam,
      basePrice: settings.basePrice,
      biddingIncrements: settings.biddingIncrements
    };
  },

  updateConfig(newConfig) {
    console.log('Updating config:', newConfig);
    settings = { ...settings, ...newConfig };
    scheduleSnapshot();
    return settings;
  },

  // Auction data management
  updateAuctionData(data) {
    auctionData = { ...auctionData, ...data };
    scheduleSnapshot();
    return auctionData;
  },

  // Player management
  getPlayers() {
    return auctionData.players;
  },

  setPlayers(players) {
    auctionData.players = players;
    scheduleSnapshot();
    return players;
  },

  // Team management
  getTeams() {
    return auctionData.teams;
  },

  setTeams(teams) {
    auctionData.teams = teams;
    scheduleSnapshot();
    return teams;
  },

  // Create default teams from settings.teamCount when none exist yet.
  // Used by flows that start an auction without an Excel upload (manual add,
  // registrations import). Returns the current teams either way.
  ensureTeamsInitialized() {
    if (Array.isArray(auctionData.teams) && auctionData.teams.length > 0) {
      return auctionData.teams;
    }
    const teams = [];
    for (let i = 1; i <= settings.teamCount; i++) {
      teams.push({
        id: i,
        name: `Team ${i}`,
        budget: settings.startingBudget,
        players: [],
        captain: null,
        captainAmount: 0
      });
    }
    auctionData.teams = teams;
    scheduleSnapshot();
    return teams;
  },

  // Current bid management
  getCurrentBid() {
    return auctionData.currentBid;
  },

  setCurrentBid(bid) {
    auctionData.currentBid = bid;
    scheduleSnapshot();
    return bid;
  },

  // Auction status management
  getAuctionStatus() {
    return auctionData.auctionStatus;
  },

  setAuctionStatus(status) {
    auctionData.auctionStatus = status;
    scheduleSnapshot();
    return status;
  },

  // Stats management
  getStats() {
    return auctionData.stats;
  },

  updateStats(stats) {
    auctionData.stats = stats;
    scheduleSnapshot();
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
    scheduleSnapshot();
  },

  getPlayerBiddingHistory(playerId) {
    return playerBiddingHistory[playerId] || [];
  },

  removeLastBidFromPlayerHistory(playerId) {
    if (playerBiddingHistory[playerId] && playerBiddingHistory[playerId].length > 0) {
      const removedBid = playerBiddingHistory[playerId].pop();
      console.log(`Removed last bid from player ${playerId} history:`, removedBid);
      scheduleSnapshot();
      return removedBid;
    }
    return null;
  },

  clearPlayerBiddingHistory(playerId) {
    playerBiddingHistory[playerId] = [];
    console.log(`Cleared bidding history for player ${playerId}`);
    scheduleSnapshot();
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
    scheduleSnapshot();
  },

  getActionHistory() {
    return [...actionHistory];
  },

  removeActionById(actionId) {
    const index = actionHistory.findIndex(action => action.id === actionId);
    if (index !== -1) {
      const removed = actionHistory.splice(index, 1)[0];
      scheduleSnapshot();
      return removed;
    }
    return null;
  },

  removeLastAction() {
    const removed = actionHistory.pop();
    scheduleSnapshot();
    return removed;
  },

  clearActionHistory() {
    actionHistory = [];
    scheduleSnapshot();
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
    
    scheduleSnapshot();
    return auctionData;
  },

  // --- Persistence API (best-effort; safe no-op when Supabase is off) ---

  // Restore state from the last Supabase snapshot. Call once on startup.
  async loadSnapshot() {
    const snap = await snapshotStore.loadState();
    if (!snap) return false;
    if (snap.auctionData) auctionData = snap.auctionData;
    if (snap.settings) settings = snap.settings;
    if (snap.actionHistory) actionHistory = snap.actionHistory;
    if (snap.playerBiddingHistory) playerBiddingHistory = snap.playerBiddingHistory;
    return true;
  },

  // Force an immediate snapshot write (e.g. on graceful shutdown).
  async flushSnapshot() {
    if (snapshotTimer) {
      clearTimeout(snapshotTimer);
      snapshotTimer = null;
    }
    await snapshotStore.saveState(serializeState());
  }
};

module.exports = dataService;
