const dataService = require('../services/dataService');
const socketService = require('../services/socketService');
const { getNextBidIncrement, calculateStats } = require('../utils/biddingRules');

const auctionController = {
  // Save auction settings
  saveSettings: async (req, res) => {
    try {
      console.log('Received settings:', req.body);
      
      const { 
        teamCount, 
        startingBudget, 
        maxPlayersPerTeam, 
        basePrice, 
        biddingIncrements, 
        enableRetention = false, 
        retentionsPerTeam = 0 
      } = req.body;
      
      // Validate settings
      if (!teamCount || teamCount < 2 || teamCount > 16) {
        return res.status(400).json({ error: 'Team count must be between 2 and 16' });
      }
      
      if (!startingBudget || startingBudget < 100) {
        return res.status(400).json({ error: 'Starting budget must be at least ₹100' });
      }
      
      if (!maxPlayersPerTeam || maxPlayersPerTeam < 5 || maxPlayersPerTeam > 25) {
        return res.status(400).json({ error: 'Max players per team must be between 5 and 25' });
      }
      
      if (!basePrice || basePrice < 5) {
        return res.status(400).json({ error: 'Base price must be at least ₹5' });
      }
      
      if (!biddingIncrements || !Array.isArray(biddingIncrements) || biddingIncrements.length === 0) {
        return res.status(400).json({ error: 'Bidding increments are required' });
      }
      
      const sortedIncrements = biddingIncrements.sort((a, b) => a.threshold - b.threshold);
      
      const newSettings = {
        teamCount: parseInt(teamCount),
        startingBudget: parseInt(startingBudget),
        maxPlayersPerTeam: parseInt(maxPlayersPerTeam),
        basePrice: parseInt(basePrice),
        biddingIncrements: sortedIncrements,
        enableRetention: Boolean(enableRetention),
        retentionsPerTeam: parseInt(retentionsPerTeam) || 0
      };
      
      dataService.updateSettings(newSettings);
      
      console.log('Settings saved successfully:', newSettings);
      
      res.json({ 
        message: 'Settings saved successfully',
        settings: dataService.getSettings()
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ 
        error: 'Error saving settings: ' + error.message 
      });
    }
  },

  // Get auction data
  getAuctionData: (req, res) => {
    try {
      const auctionData = dataService.getAuctionData();
      const correctedStats = calculateStats(auctionData.players || []);
      dataService.updateStats(correctedStats);
      
      res.json({
        ...auctionData,
        stats: correctedStats
      });
    } catch (error) {
      console.error('Error fetching auction data:', error);
      res.status(500).json({ error: 'Error fetching auction data' });
    }
  },

  // Start auction
  startAuction: async (req, res) => {
    try {
      console.log('Start auction request received');
      const auctionData = dataService.getAuctionData();
      
      if (!auctionData.fileUploaded || auctionData.players.length === 0) {
        return res.status(400).json({ 
          error: 'Please upload a player file before starting the auction' 
        });
      }

      const availablePlayers = auctionData.players.filter(p => 
        p.status === 'available' && p.category !== 'captain'
      );
      
      if (availablePlayers.length === 0) {
        return res.status(400).json({
          error: 'No players available for auction'
        });
      }

      dataService.setAuctionStatus('running');
      socketService.emit('auctionStatusChanged', 'running');
      
      console.log('Auction started successfully');
      res.json({ 
        message: 'Auction started',
        availablePlayers: availablePlayers.length
      });
    } catch (error) {
      console.error('Error starting auction:', error);
      res.status(500).json({ error: 'Error starting auction' });
    }
  },

  // Stop auction
  stopAuction: async (req, res) => {
    try {
      console.log('Stop auction request received');
      dataService.setAuctionStatus('stopped');
      dataService.setCurrentBid(null);
      
      const players = dataService.getPlayers();
      players.forEach(player => {
        if (player.currentBid > 0 && player.status === 'available') {
          player.currentBid = 0;
          player.biddingTeam = null;
        }
      });
      dataService.setPlayers(players);
      
      socketService.emit('auctionStatusChanged', 'stopped');
      socketService.emit('currentBidUpdated', null);
      socketService.emit('playersUpdated', players);
      
      console.log('Auction stopped successfully');
      res.json({ message: 'Auction stopped' });
    } catch (error) {
      console.error('Error stopping auction:', error);
      res.status(500).json({ error: 'Error stopping auction' });
    }
  },

  // Start player bidding
  startBidding: async (req, res) => {
    try {
      const playerId = req.params.playerId;
      console.log('Start bidding request for player:', playerId);
      
      const players = dataService.getPlayers();
      const player = players.find(p => p.id === playerId);
      
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      if (player.status !== 'available') {
        return res.status(400).json({ error: 'Player not available for bidding' });
      }

      if (player.category === 'captain') {
        return res.status(400).json({ error: 'Captains cannot be bid on' });
      }

      if (player.status === 'retained') {
        return res.status(400).json({ error: 'Retained players cannot be bid on' });
      }

      if (dataService.getCurrentBid()) {
        return res.status(400).json({ error: 'Another player is currently being bid on' });
      }

      const settings = dataService.getSettings();
      
      // FIXED: Set currentBid with NO biddingTeam initially (so first bid starts at base price)
      const currentBid = {
        playerId: playerId,
        currentAmount: settings.basePrice,
        biddingTeam: null  // No team initially - first bidder gets base price
      };

      player.currentBid = settings.basePrice; // Show base price as current bid

      // Clear bidding history for this player
      dataService.clearPlayerBiddingHistory(playerId);

      dataService.setCurrentBid(currentBid);
      dataService.setPlayers(players);

      socketService.emit('currentBidUpdated', currentBid);
      socketService.emit('playersUpdated', players);

      console.log('Bidding started for player:', player.name, 'at base price:', settings.basePrice);
      res.json({ 
        message: 'Bidding started for player',
        player: player,
        basePrice: settings.basePrice
      });
    } catch (error) {
      console.error('Error starting bidding:', error);
      res.status(500).json({ error: 'Error starting bidding for player' });
    }
  },

  // FIXED: Place bid - first bid at base price, subsequent bids with increment
  placeBid: async (req, res) => {
    try {
      const { teamId } = req.body;
      console.log('Place bid request for team:', teamId);
      
      const currentBid = dataService.getCurrentBid();
      if (!currentBid) {
        return res.status(400).json({ error: 'No active bidding' });
      }

      const teams = dataService.getTeams();
      const team = teams.find(t => t.id === parseInt(teamId));
      if (!team) {
        return res.status(400).json({ error: 'Invalid team' });
      }

      const settings = dataService.getSettings();
      let newBidAmount;

      // FIXED: Check if this is the first bid or subsequent bid
      if (!currentBid.biddingTeam) {
        // FIRST BID: Team bids at base price (no increment)
        newBidAmount = settings.basePrice;
        console.log(`First bid from ${team.name}: ₹${newBidAmount} (base price)`);
      } else {
        // SUBSEQUENT BIDS: Add increment to current amount
        const increment = getNextBidIncrement(currentBid.currentAmount, settings.biddingIncrements);
        newBidAmount = currentBid.currentAmount + increment;
        console.log(`Subsequent bid from ${team.name}: ₹${newBidAmount} (₹${currentBid.currentAmount} + ₹${increment})`);
        
        // Store the current bid in history BEFORE updating (for undo functionality)
        dataService.addBidToPlayerHistory(currentBid.playerId, {
          teamId: parseInt(currentBid.biddingTeam),
          amount: currentBid.currentAmount,
          teamName: teams.find(t => t.id === parseInt(currentBid.biddingTeam))?.name
        });
      }

      // Check if team has sufficient budget
      if (team.budget < newBidAmount) {
        return res.status(400).json({ error: 'Insufficient budget' });
      }

      // Update current bid
      currentBid.currentAmount = newBidAmount;
      currentBid.biddingTeam = teamId.toString();

      const players = dataService.getPlayers();
      const player = players.find(p => p.id === currentBid.playerId);
      player.currentBid = newBidAmount;
      player.biddingTeam = teamId.toString();

      dataService.setCurrentBid(currentBid);
      dataService.setPlayers(players);

      socketService.emit('currentBidUpdated', currentBid);
      socketService.emit('playersUpdated', players);

      console.log('Bid placed successfully:', newBidAmount, 'by team:', team.name);
      
      res.json({ 
        message: 'Bid placed successfully',
        currentBid: currentBid,
        isFirstBid: !currentBid.biddingTeam || currentBid.currentAmount === settings.basePrice
      });
    } catch (error) {
      console.error('Error placing bid:', error);
      res.status(500).json({ error: 'Error placing bid' });
    }
  },

  // Sell player (with action tracking)
  sellPlayer: async (req, res) => {
    try {
      console.log('Sell player request received');
      const currentBid = dataService.getCurrentBid();
      if (!currentBid || !currentBid.biddingTeam) {
        return res.status(400).json({ error: 'No active bid to complete' });
      }

      const players = dataService.getPlayers();
      const teams = dataService.getTeams();
      
      const player = players.find(p => p.id === currentBid.playerId);
      const team = teams.find(t => t.id === parseInt(currentBid.biddingTeam));

      const settings = dataService.getSettings();
      const teamPlayerCount = players.filter(p => p.team === team.id && (p.status === 'sold' || p.status === 'assigned')).length;
      
      if (teamPlayerCount >= settings.maxPlayersPerTeam) {
        return res.status(400).json({ 
          error: `Team ${team.name} has reached maximum player limit (${settings.maxPlayersPerTeam})` 
        });
      }

      // Record action for undo functionality
      dataService.addAction({
        type: 'PLAYER_SOLD',
        playerId: player.id,
        playerName: player.name,
        teamId: team.id,
        teamName: team.name,
        amount: currentBid.currentAmount,
        previousPlayerState: {
          status: player.status,
          team: player.team,
          finalBid: player.finalBid,
          currentBid: player.currentBid,
          biddingTeam: player.biddingTeam
        },
        previousTeamBudget: team.budget,
        previousTeamPlayers: [...team.players]
      });

      player.status = 'sold';
      player.finalBid = currentBid.currentAmount;
      player.team = team.id;
      player.currentBid = 0;
      player.biddingTeam = null;

      team.budget -= currentBid.currentAmount;
      team.players.push(player.id);

      // Clear bidding history for this player after sale
      dataService.clearPlayerBiddingHistory(player.id);

      dataService.setCurrentBid(null);
      dataService.setPlayers(players);
      dataService.setTeams(teams);

      const stats = calculateStats(players);
      dataService.updateStats(stats);

      socketService.emit('currentBidUpdated', null);
      socketService.emit('playersUpdated', players);
      socketService.emit('teamsUpdated', teams);
      socketService.emit('statsUpdated', stats);
      
      // Emit playerSold event for live transaction tracking
      socketService.emit('playerSold', {
        player: player,
        team: team,
        finalBid: player.finalBid
      });

      console.log('Player sold:', player.name, 'to team:', team.name, 'for:', player.finalBid);
      res.json({ 
        message: 'Player sold successfully',
        player: player,
        team: team
      });
    } catch (error) {
      console.error('Error selling player:', error);
      res.status(500).json({ error: 'Error selling player' });
    }
  },

  // Mark player as unsold
  markUnsold: async (req, res) => {
    try {
      console.log('Mark player as unsold request received');
      const currentBid = dataService.getCurrentBid();
      if (!currentBid) {
        return res.status(400).json({ error: 'No active bidding' });
      }

      const players = dataService.getPlayers();
      const player = players.find(p => p.id === currentBid.playerId);
      player.status = 'unsold';
      player.currentBid = 0;
      player.biddingTeam = null;

      // Clear bidding history for this player
      dataService.clearPlayerBiddingHistory(player.id);

      dataService.setCurrentBid(null);
      dataService.setPlayers(players);

      const stats = calculateStats(players);
      dataService.updateStats(stats);

      socketService.emit('currentBidUpdated', null);
      socketService.emit('playersUpdated', players);
      socketService.emit('statsUpdated', stats);
      
      // Emit playerUnsold event for live transaction tracking
      socketService.emit('playerUnsold', {
        player: player
      });

      console.log('Player marked as unsold:', player.name);
      res.json({ 
        message: 'Player marked as unsold',
        player: player
      });
    } catch (error) {
      console.error('Error marking player as unsold:', error);
      res.status(500).json({ error: 'Error marking player as unsold' });
    }
  },

  // Cancel current bidding session
  cancelBidding: async (req, res) => {
    try {
      console.log('Cancel bidding request received');
      const currentBid = dataService.getCurrentBid();
      if (!currentBid) {
        return res.status(400).json({ error: 'No active bidding to cancel' });
      }

      const players = dataService.getPlayers();
      const player = players.find(p => p.id === currentBid.playerId);
      
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Reset player to available state
      player.status = 'available';
      player.currentBid = 0;
      player.biddingTeam = null;

      // Clear bidding history for this player
      dataService.clearPlayerBiddingHistory(player.id);

      // Clear current bid
      dataService.setCurrentBid(null);
      dataService.setPlayers(players);

      const stats = calculateStats(players);
      dataService.updateStats(stats);

      socketService.emit('currentBidUpdated', null);
      socketService.emit('playersUpdated', players);
      socketService.emit('statsUpdated', stats);
      
      // Emit bidding cancelled event
      socketService.emit('biddingCancelled', {
        player: player,
        message: `Bidding cancelled for ${player.name}`
      });

      console.log('Bidding cancelled for player:', player.name);
      res.json({ 
        message: `Bidding cancelled for ${player.name}. Player is now available for bidding again.`,
        player: player
      });
    } catch (error) {
      console.error('Error cancelling bidding:', error);
      res.status(500).json({ error: 'Error cancelling bidding' });
    }
  },

  // Undo current bid (reverts to previous team's bid)
  undoCurrentBid: async (req, res) => {
    try {
      console.log('=== UNDO CURRENT BID REQUEST ===');
      
      const currentBid = dataService.getCurrentBid();
      if (!currentBid) {
        return res.status(400).json({ error: 'No active bid to undo' });
      }

      const players = dataService.getPlayers();
      const teams = dataService.getTeams();
      const player = players.find(p => p.id === currentBid.playerId);
      
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      console.log('Current bid state:', currentBid);
      
      // Get bidding history for this player
      const biddingHistory = dataService.getPlayerBiddingHistory(currentBid.playerId);
      console.log('Bidding history for player:', biddingHistory);

      if (biddingHistory.length > 0) {
        // Get the previous bid (most recent in history)
        const previousBid = biddingHistory[biddingHistory.length - 1];
        console.log('Found previous bid, reverting to:', previousBid);

        // Remove this bid from history since we're reverting
        dataService.removeLastBidFromPlayerHistory(currentBid.playerId);

        // Restore previous bid state
        currentBid.currentAmount = previousBid.amount;
        currentBid.biddingTeam = previousBid.teamId.toString();

        player.currentBid = previousBid.amount;
        player.biddingTeam = previousBid.teamId.toString();

        const previousTeam = teams.find(t => t.id === previousBid.teamId);

        dataService.setCurrentBid(currentBid);
        dataService.setPlayers(players);

        socketService.emit('currentBidUpdated', currentBid);
        socketService.emit('playersUpdated', players);
        socketService.emit('bidUndone', {
          player: player.name,
          revertedToTeam: previousTeam?.name,
          revertedToAmount: previousBid.amount,
          message: 'Reverted to previous bid'
        });

        console.log(`✅ Bid undone: ${player.name} reverted to ₹${previousBid.amount} by ${previousTeam?.name}`);
        
        res.json({
          message: 'Bid undone successfully - reverted to previous bid',
          player: player.name,
          revertedToAmount: previousBid.amount,
          revertedToTeam: previousTeam?.name,
          currentBid: currentBid
        });

      } else {
        // No previous bids - revert to base price with no team
        console.log('No previous bids found, reverting to base price');
        
        const settings = dataService.getSettings();
        
        currentBid.currentAmount = settings.basePrice;
        currentBid.biddingTeam = null;

        player.currentBid = settings.basePrice;
        player.biddingTeam = null;

        dataService.setCurrentBid(currentBid);
        dataService.setPlayers(players);

        socketService.emit('currentBidUpdated', currentBid);
        socketService.emit('playersUpdated', players);
        socketService.emit('bidUndone', {
          player: player.name,
          revertedToTeam: null,
          revertedToAmount: settings.basePrice,
          message: 'Reverted to base price'
        });

        console.log(`✅ Bid undone: ${player.name} reverted to base price ₹${settings.basePrice}`);
        
        res.json({
          message: 'Bid undone successfully - reverted to base price',
          player: player.name,
          revertedToAmount: settings.basePrice,
          revertedToTeam: null,
          currentBid: currentBid
        });
      }

      console.log('=== UNDO CURRENT BID COMPLETED ===');

    } catch (error) {
      console.error('Error undoing current bid:', error);
      res.status(500).json({ error: 'Error undoing bid' });
    }
  },

  // Undo last sale
  undoLastSale: async (req, res) => {
    try {
      console.log('Undo last sale request received');
      
      const actionHistory = dataService.getActionHistory();
      const lastSaleAction = actionHistory
        .slice()
        .reverse()
        .find(action => action.type === 'PLAYER_SOLD');

      if (!lastSaleAction) {
        return res.status(400).json({ error: 'No recent sale to undo' });
      }

      const players = dataService.getPlayers();
      const teams = dataService.getTeams();
      
      const player = players.find(p => p.id === lastSaleAction.playerId);
      const team = teams.find(t => t.id === lastSaleAction.teamId);
      
      if (!player || !team) {
        return res.status(400).json({ error: 'Player or team not found for undo operation' });
      }

      // Restore player state
      player.status = lastSaleAction.previousPlayerState.status;
      player.team = lastSaleAction.previousPlayerState.team;
      player.finalBid = lastSaleAction.previousPlayerState.finalBid;
      player.currentBid = lastSaleAction.previousPlayerState.currentBid;
      player.biddingTeam = lastSaleAction.previousPlayerState.biddingTeam;

      // Restore team state
      team.budget = lastSaleAction.previousTeamBudget;
      team.players = [...lastSaleAction.previousTeamPlayers];

      // Remove the action from history
      dataService.removeActionById(lastSaleAction.id);

      dataService.setPlayers(players);
      dataService.setTeams(teams);

      const stats = calculateStats(players);
      dataService.updateStats(stats);

      socketService.emit('playersUpdated', players);
      socketService.emit('teamsUpdated', teams);
      socketService.emit('statsUpdated', stats);
      socketService.emit('saleUndone', {
        player: player.name,
        team: team.name,
        amount: lastSaleAction.amount
      });

      console.log(`Sale undone: ${player.name} returned from ${team.name}, ₹${lastSaleAction.amount} refunded`);
      
      res.json({
        message: 'Sale undone successfully',
        player: player.name,
        team: team.name,
        refundedAmount: lastSaleAction.amount
      });

    } catch (error) {
      console.error('Error undoing last sale:', error);
      res.status(500).json({ error: 'Error undoing sale' });
    }
  },

  // Get action history
  getActionHistory: async (req, res) => {
    try {
      const history = dataService.getActionHistory();
      res.json({ 
        history: history.slice(-20).reverse() // Last 20 actions, newest first
      });
    } catch (error) {
      console.error('Error fetching action history:', error);
      res.status(500).json({ error: 'Error fetching action history' });
    }
  },

  // Start fast track auction
  startFastTrack: async (req, res) => {
    try {
      console.log('Start fast track auction request received');
      const players = dataService.getPlayers();
      const unsoldPlayers = players.filter(p => p.status === 'unsold');
      
      if (unsoldPlayers.length === 0) {
        return res.status(400).json({ 
          error: 'No unsold players available for fast track auction' 
        });
      }

      unsoldPlayers.forEach(player => {
        player.status = 'available';
        player.currentBid = 0;
        player.finalBid = 0;
        player.team = null;
        player.biddingTeam = null;
      });

      dataService.setAuctionStatus('fast-track');
      dataService.setPlayers(players);
      
      socketService.emit('auctionStatusChanged', 'fast-track');
      socketService.emit('playersUpdated', players);
      socketService.emit('fastTrackStarted', { players: unsoldPlayers });

      console.log('Fast track auction started with', unsoldPlayers.length, 'players');
      res.json({ 
        message: 'Fast track auction started',
        unsoldPlayersCount: unsoldPlayers.length,
        players: unsoldPlayers
      });

    } catch (error) {
      console.error('Error starting fast track auction:', error);
      res.status(500).json({ error: 'Error starting fast track auction' });
    }
  },

  // End fast track auction
  endFastTrack: async (req, res) => {
    try {
      console.log('End fast track auction request received');
      const currentStatus = dataService.getAuctionStatus();
      
      if (currentStatus !== 'fast-track') {
        return res.status(400).json({ error: 'Fast track auction is not active' });
      }

      const players = dataService.getPlayers();
      const availablePlayers = players.filter(p => p.status === 'available' && p.category !== 'captain');
      
      const nextStatus = availablePlayers.length > 0 ? 'stopped' : 'finished';
      
      dataService.setAuctionStatus(nextStatus);
      dataService.setCurrentBid(null);

      players.forEach(player => {
        if (player.currentBid > 0 && player.status === 'available') {
          player.currentBid = 0;
          player.biddingTeam = null;
        }
      });

      dataService.setPlayers(players);

      const stats = calculateStats(players);
      dataService.updateStats(stats);

      socketService.emit('auctionStatusChanged', nextStatus);
      socketService.emit('currentBidUpdated', null);
      socketService.emit('playersUpdated', players);
      socketService.emit('statsUpdated', stats);
      socketService.emit('fastTrackEnded');

      console.log('Fast track auction ended, next status:', nextStatus);
      res.json({ 
        message: 'Fast track auction completed',
        nextStatus: nextStatus,
        availablePlayers: availablePlayers.length,
        finalStats: stats
      });

    } catch (error) {
      console.error('Error ending fast track auction:', error);
      res.status(500).json({ error: 'Error ending fast track auction' });
    }
  },

  // Reset and other methods remain unchanged...
  resetAuction: async (req, res) => {
    try {
      console.log('Reset auction request received');
      const auctionData = dataService.getAuctionData();
      
      if (!auctionData.fileUploaded || auctionData.players.length === 0) {
        return res.status(400).json({ 
          error: 'No player data to reset. Please upload a player file first.' 
        });
      }

      const players = dataService.getPlayers();
      const teams = dataService.getTeams();
      const settings = dataService.getSettings();

      // Reset all players to available status (except captains)
      players.forEach(player => {
        if (player.category !== 'captain') {
          player.status = 'available';
          player.currentBid = 0;
          player.finalBid = 0;
          player.team = null;
          player.biddingTeam = null;
        } else {
          player.finalBid = 0;
        }
      });

      // Reset all team budgets and players (keep captains)
      teams.forEach(team => {
        const captain = players.find(p => p.id === team.captain);
        team.budget = settings.startingBudget;
        team.players = captain ? [captain.id] : [];
      });

      dataService.setAuctionStatus('stopped');
      dataService.setCurrentBid(null);
      dataService.clearActionHistory();
      dataService.setPlayers(players);
      dataService.setTeams(teams);

      const stats = calculateStats(players);
      dataService.updateStats(stats);

      socketService.emit('auctionReset');
      socketService.emit('playersUpdated', players);
      socketService.emit('teamsUpdated', teams);
      socketService.emit('auctionStatusChanged', 'stopped');
      socketService.emit('currentBidUpdated', null);
      socketService.emit('statsUpdated', stats);

      console.log('Auction reset successfully');
      res.json({ 
        message: 'Auction reset successfully. All players are now available for bidding.',
        availablePlayers: players.filter(p => p.status === 'available' && p.category !== 'captain').length
      });

    } catch (error) {
      console.error('Error resetting auction:', error);
      res.status(500).json({ error: 'Error resetting auction' });
    }
  },

  // Finish entire auction
  finishAuction: async (req, res) => {
    try {
      console.log('Finish entire auction request received');
      dataService.setAuctionStatus('finished');
      dataService.setCurrentBid(null);

      const players = dataService.getPlayers();

      players.forEach(player => {
        if (player.currentBid > 0 && player.status === 'available') {
          player.currentBid = 0;
          player.biddingTeam = null;
        }
      });

      dataService.setPlayers(players);

      const stats = calculateStats(players);
      dataService.updateStats(stats);

      socketService.emit('auctionStatusChanged', 'finished');
      socketService.emit('currentBidUpdated', null);
      socketService.emit('playersUpdated', players);
      socketService.emit('statsUpdated', stats);
      socketService.emit('auctionFinished');

      console.log('Entire auction completed and finished');
      res.json({ 
        message: 'Entire auction completed and finished',
        finalStats: stats
      });

    } catch (error) {
      console.error('Error finishing auction:', error);
      res.status(500).json({ error: 'Error finishing auction' });
    }
  }
};

module.exports = auctionController;
