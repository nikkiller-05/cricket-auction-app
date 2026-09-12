// --- Multi-auction state (Phase B) ----------------------------------------
// Each auction keeps its own live state object, keyed by auctionId in a Map.
// Today there is a single DEFAULT auction and controllers operate on the
// "active" one; B2 threads an explicit auctionId. Every method reads S()
// (never a captured global), which is what keeps concurrent auctions race-free
// once B2 lands.
const DEFAULT_AUCTION_ID = 'default';

function blankAuctionData() {
  return {
    players: [],
    teams: [],
    currentBid: null,
    auctionStatus: 'stopped',
    fileUploaded: false,
    fileName: null,
    // Smart Random selection / mystery-reveal flow (before live bidding).
    // null when idle, else { stage, playerId, mode, startedAt, revealStartedAt, by }
    selection: null,
    stats: {
      highestBid: null,
      lowestBid: null,
      totalSold: 0,
      totalUnsold: 0,
      averageBid: 0
    }
  };
}

function defaultSettings() {
  return {
    teamCount: 4,
    startingBudget: 1000,
    maxPlayersPerTeam: 15,
    basePrice: 10,
    currency: 'INR',
    enableCaptains: true,
    enableRetention: false,
    retentionsPerTeam: 0,
    biddingIncrements: [
      { threshold: 50, increment: 5 },
      { threshold: 100, increment: 10 },
      { threshold: 200, increment: 20 }
    ]
  };
}

function blankState() {
  return {
    auctionData: blankAuctionData(),
    settings: defaultSettings(),
    actionHistory: [], // undo history
    playerBiddingHistory: {} // key = playerId -> array of bids
  };
}

const auctions = new Map();
let activeAuctionId = DEFAULT_AUCTION_ID;

// Active auction's state; auto-creates the default on first access.
function S() {
  let s = auctions.get(activeAuctionId);
  if (!s) {
    s = blankState();
    auctions.set(activeAuctionId, s);
  }
  return s;
}
S(); // seed the default auction

// --- Persistence: best-effort Supabase snapshot ---------------------------
// In-memory state above stays the source of truth. After any mutation we
// schedule a debounced write of the whole state so a restart can restore it.
const snapshotStore = require('./snapshotStore');

const SNAPSHOT_DEBOUNCE_MS = 1000;
let snapshotTimer = null;

function serializeState() {
  const s = S();
  return {
    auctionData: s.auctionData,
    settings: s.settings,
    actionHistory: s.actionHistory,
    playerBiddingHistory: s.playerBiddingHistory
  };
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
      ...S().auctionData,
      settings: this.getSettings()
    };
  },

  // Settings management
  getSettings() {
    return { ...S().settings };
  },

  updateSettings(newSettings) {
    console.log('Updating settings:', newSettings);
    S().settings = { ...S().settings, ...newSettings };
    scheduleSnapshot();
    return S().settings;
  },

  // Config management (for updating settings from UI)
  getConfig() {
    const settings = S().settings;
    return {
      teamCount: settings.teamCount,
      startingBudget: settings.startingBudget,
      maxPlayersPerTeam: settings.maxPlayersPerTeam,
      basePrice: settings.basePrice,
      currency: settings.currency,
      biddingIncrements: settings.biddingIncrements
    };
  },

  updateConfig(newConfig) {
    console.log('Updating config:', newConfig);
    S().settings = { ...S().settings, ...newConfig };
    scheduleSnapshot();
    return S().settings;
  },

  // Auction data management
  updateAuctionData(data) {
    S().auctionData = { ...S().auctionData, ...data };
    scheduleSnapshot();
    return S().auctionData;
  },

  // Player management
  getPlayers() {
    return S().auctionData.players;
  },

  setPlayers(players) {
    S().auctionData.players = players;
    scheduleSnapshot();
    return players;
  },

  // Team management
  getTeams() {
    return S().auctionData.teams;
  },

  setTeams(teams) {
    S().auctionData.teams = teams;
    scheduleSnapshot();
    return teams;
  },

  // Create default teams from settings.teamCount when none exist yet.
  // Used by flows that start an auction without an Excel upload (manual add,
  // registrations import). Returns the current teams either way.
  ensureTeamsInitialized() {
    const s = S();
    if (Array.isArray(s.auctionData.teams) && s.auctionData.teams.length > 0) {
      return s.auctionData.teams;
    }
    const teams = [];
    for (let i = 1; i <= s.settings.teamCount; i++) {
      teams.push({
        id: i,
        name: `Team ${i}`,
        budget: s.settings.startingBudget,
        players: [],
        captain: null,
        captainAmount: 0,
        logoUrl: null
      });
    }
    s.auctionData.teams = teams;
    scheduleSnapshot();
    return teams;
  },

  // Current bid management
  getCurrentBid() {
    return S().auctionData.currentBid;
  },

  setCurrentBid(bid) {
    S().auctionData.currentBid = bid;
    scheduleSnapshot();
    return bid;
  },

  // Smart Random selection state (mystery-reveal flow)
  getSelection() {
    return S().auctionData.selection;
  },

  setSelection(selection) {
    S().auctionData.selection = selection;
    scheduleSnapshot();
    return selection;
  },

  // Auction status management
  getAuctionStatus() {
    return S().auctionData.auctionStatus;
  },

  setAuctionStatus(status) {
    S().auctionData.auctionStatus = status;
    scheduleSnapshot();
    return status;
  },

  // Stats management
  getStats() {
    return S().auctionData.stats;
  },

  updateStats(stats) {
    S().auctionData.stats = stats;
    scheduleSnapshot();
    return stats;
  },

  // NEW: Player-specific bidding history management
  initializeBiddingHistoryForPlayer(playerId) {
    const hist = S().playerBiddingHistory;
    if (!hist[playerId]) {
      hist[playerId] = [];
      console.log(`Initialized bidding history for player ${playerId}`);
    }
  },

  addBidToPlayerHistory(playerId, bid) {
    this.initializeBiddingHistoryForPlayer(playerId);
    const hist = S().playerBiddingHistory;
    hist[playerId].push({
      ...bid,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });
    console.log(`Added bid to player ${playerId} history:`, bid);
    console.log(`Current history for player ${playerId}:`, hist[playerId]);
    scheduleSnapshot();
  },

  getPlayerBiddingHistory(playerId) {
    return S().playerBiddingHistory[playerId] || [];
  },

  removeLastBidFromPlayerHistory(playerId) {
    const hist = S().playerBiddingHistory;
    if (hist[playerId] && hist[playerId].length > 0) {
      const removedBid = hist[playerId].pop();
      console.log(`Removed last bid from player ${playerId} history:`, removedBid);
      scheduleSnapshot();
      return removedBid;
    }
    return null;
  },

  clearPlayerBiddingHistory(playerId) {
    S().playerBiddingHistory[playerId] = [];
    console.log(`Cleared bidding history for player ${playerId}`);
    scheduleSnapshot();
  },

  getPreviousBidForPlayer(playerId) {
    const history = this.getPlayerBiddingHistory(playerId);
    return history.length > 0 ? history[history.length - 1] : null;
  },

  // Action history methods (for sale undo)
  addAction(action) {
    const s = S();
    s.actionHistory.push({
      ...action,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });
    // Keep only last 50 actions
    if (s.actionHistory.length > 50) {
      s.actionHistory = s.actionHistory.slice(-50);
    }
    console.log('Action recorded:', action.type, action.playerName);
    scheduleSnapshot();
  },

  getActionHistory() {
    return [...S().actionHistory];
  },

  removeActionById(actionId) {
    const hist = S().actionHistory;
    const index = hist.findIndex(action => action.id === actionId);
    if (index !== -1) {
      const removed = hist.splice(index, 1)[0];
      scheduleSnapshot();
      return removed;
    }
    return null;
  },

  removeLastAction() {
    const removed = S().actionHistory.pop();
    scheduleSnapshot();
    return removed;
  },

  clearActionHistory() {
    S().actionHistory = [];
    scheduleSnapshot();
  },

  // Reset all data
  resetAuctionData() {
    const s = S();
    s.auctionData = {
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

    s.actionHistory = [];
    s.playerBiddingHistory = {}; // Clear all player bidding histories

    scheduleSnapshot();
    return s.auctionData;
  },

  // --- Persistence API (best-effort; safe no-op when Supabase is off) ---

  // Restore state from the last Supabase snapshot. Call once on startup.
  async loadSnapshot() {
    const snap = await snapshotStore.loadState();
    if (!snap) return false;
    const s = S();
    if (snap.auctionData) s.auctionData = snap.auctionData;
    if (snap.settings) s.settings = snap.settings;
    if (snap.actionHistory) s.actionHistory = snap.actionHistory;
    if (snap.playerBiddingHistory) s.playerBiddingHistory = snap.playerBiddingHistory;
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
