const dataService = require('../services/dataService');
const socketService = require('../services/socketService');

const teamController = {
  // Get all teams
  getTeams: (req, res) => {
    try {
      const teams = dataService.getTeams();
      res.json({ teams });
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ error: 'Error fetching teams' });
    }
  },

  // Get team by ID
  getTeamById: (req, res) => {
    try {
      const { id } = req.params;
      const teams = dataService.getTeams();
      const team = teams.find(t => t.id === parseInt(id));
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const players = dataService.getPlayers();
      const teamPlayers = players.filter(p => p.team === team.id && (p.status === 'sold' || p.status === 'assigned'));

      res.json({ 
        team,
        players: teamPlayers
      });
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({ error: 'Error fetching team' });
    }
  },

  // Update team name
  updateTeam: (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Team name is required' });
      }

      const teams = dataService.getTeams();
      const teamIndex = teams.findIndex(t => t.id === parseInt(id));
      
      if (teamIndex === -1) {
        return res.status(404).json({ error: 'Team not found' });
      }

      teams[teamIndex].name = name.trim();
      dataService.setTeams(teams);

      socketService.emit('teamsUpdated', teams);

      res.json({ 
        message: 'Team updated successfully',
        team: teams[teamIndex]
      });
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({ error: 'Error updating team' });
    }
  },

  // NEW: Update multiple teams
  updateTeams: async (req, res) => {
    try {
      const { teams } = req.body;
      
      if (!teams || !Array.isArray(teams)) {
        return res.status(400).json({ error: 'Teams array is required' });
      }

      // Validate each team
      for (const team of teams) {
        if (!team.id || !team.name || team.name.trim() === '') {
          return res.status(400).json({ error: 'Each team must have an id and name' });
        }
      }

      const existingTeams = dataService.getTeams();
      
      // Update teams
      teams.forEach(updatedTeam => {
        const teamIndex = existingTeams.findIndex(t => t.id === updatedTeam.id);
        if (teamIndex !== -1) {
          existingTeams[teamIndex].name = updatedTeam.name.trim();
          console.log(`Updated team ${updatedTeam.id}: ${updatedTeam.name}`);
        }
      });

      dataService.setTeams(existingTeams);

      // Broadcast updates via Socket.IO
      const socketService = require('../services/socketService');
      socketService.emit('teamsUpdated', existingTeams);

      console.log('Teams updated successfully');
      res.json({ 
        message: 'Teams updated successfully',
        teams: existingTeams
      });
    } catch (error) {
      console.error('Error updating teams:', error);
      res.status(500).json({ error: 'Error updating teams' });
    }
  },

  // Get team statistics
  getTeamStats: (req, res) => {
    try {
      const { id } = req.params;
      const teams = dataService.getTeams();
      const team = teams.find(t => t.id === parseInt(id));
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const players = dataService.getPlayers();
      const teamPlayers = players.filter(p => p.team === team.id && (p.status === 'sold' || p.status === 'assigned'));
      
      // Calculate team statistics
      const boughtPlayers = teamPlayers.filter(p => p.category !== 'captain');
      const totalSpent = boughtPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
      const averageSpent = boughtPlayers.length > 0 ? Math.round(totalSpent / boughtPlayers.length) : 0;
      
      // Categorize players
      const playersByCategory = {
        captain: teamPlayers.filter(p => p.category === 'captain').length,
        batter: teamPlayers.filter(p => p.category === 'batter').length,
        bowler: teamPlayers.filter(p => p.category === 'bowler').length,
        allrounder: teamPlayers.filter(p => p.category === 'allrounder').length,
        'wicket-keeper': teamPlayers.filter(p => p.category === 'wicket-keeper').length,
        other: teamPlayers.filter(p => !['captain', 'batter', 'bowler', 'allrounder', 'wicket-keeper'].includes(p.category)).length
      };

      const stats = {
        totalPlayers: teamPlayers.length,
        boughtPlayers: boughtPlayers.length,
        totalSpent,
        averageSpent,
        budgetRemaining: team.budget,
        budgetUsed: totalSpent,
        budgetPercentage: team.budget > 0 ? Math.round((totalSpent / (totalSpent + team.budget)) * 100) : 0,
        playersByCategory,
        mostExpensivePlayer: boughtPlayers.length > 0 ? 
          boughtPlayers.reduce((max, p) => p.finalBid > max.finalBid ? p : max) : null,
        cheapestPlayer: boughtPlayers.length > 0 ? 
          boughtPlayers.reduce((min, p) => p.finalBid < min.finalBid ? p : min) : null
      };

      res.json({ 
        team,
        stats,
        players: teamPlayers
      });
    } catch (error) {
      console.error('Error fetching team stats:', error);
      res.status(500).json({ error: 'Error fetching team statistics' });
    }
  },

  // Get team budget info
  getTeamBudget: (req, res) => {
    try {
      const { id } = req.params;
      const teams = dataService.getTeams();
      const team = teams.find(t => t.id === parseInt(id));
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const players = dataService.getPlayers();
      const teamPlayers = players.filter(p => p.team === team.id && p.status === 'sold' && p.category !== 'captain');
      const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
      const settings = dataService.getSettings();

      res.json({
        teamId: team.id,
        teamName: team.name,
        budgetRemaining: team.budget,
        budgetSpent: totalSpent,
        initialBudget: settings.startingBudget,
        playersCount: teamPlayers.length,
        maxPlayers: settings.maxPlayersPerTeam,
        canBuyMore: teamPlayers.length < settings.maxPlayersPerTeam
      });
    } catch (error) {
      console.error('Error fetching team budget:', error);
      res.status(500).json({ error: 'Error fetching team budget' });
    }
  },

  // Reset team (remove all players except captain, restore budget)
  resetTeam: (req, res) => {
    try {
      const { id } = req.params;
      const teams = dataService.getTeams();
      const teamIndex = teams.findIndex(t => t.id === parseInt(id));
      
      if (teamIndex === -1) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const players = dataService.getPlayers();
      const settings = dataService.getSettings();
      
      // Find team captain
      const captain = players.find(p => p.team === teams[teamIndex].id && p.category === 'captain');
      
      // Reset all non-captain players
      players.forEach(player => {
        if (player.team === teams[teamIndex].id && player.category !== 'captain') {
          player.status = 'available';
          player.team = null;
          player.finalBid = 0;
          player.currentBid = 0;
          player.biddingTeam = null;
        }
      });

      // Reset team budget and players
      teams[teamIndex].budget = settings.startingBudget;
      teams[teamIndex].players = captain ? [captain.id] : [];

      dataService.setTeams(teams);
      dataService.setPlayers(players);

      socketService.emit('teamsUpdated', teams);
      socketService.emit('playersUpdated', players);

      res.json({ 
        message: 'Team reset successfully',
        team: teams[teamIndex]
      });
    } catch (error) {
      console.error('Error resetting team:', error);
      res.status(500).json({ error: 'Error resetting team' });
    }
  },

  // Get team comparison
  compareTeams: (req, res) => {
    try {
      const teams = dataService.getTeams();
      const players = dataService.getPlayers();
      
      const teamComparison = teams.map(team => {
        const teamPlayers = players.filter(p => p.team === team.id && (p.status === 'sold' || p.status === 'assigned'));
        const boughtPlayers = teamPlayers.filter(p => p.category !== 'captain');
        const totalSpent = boughtPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
        
        return {
          id: team.id,
          name: team.name,
          totalPlayers: teamPlayers.length,
          boughtPlayers: boughtPlayers.length,
          totalSpent,
          budgetRemaining: team.budget,
          averagePlayerCost: boughtPlayers.length > 0 ? Math.round(totalSpent / boughtPlayers.length) : 0,
          playersByCategory: {
            captain: teamPlayers.filter(p => p.category === 'captain').length,
            batter: teamPlayers.filter(p => p.category === 'batter').length,
            bowler: teamPlayers.filter(p => p.category === 'bowler').length,
            allrounder: teamPlayers.filter(p => p.category === 'allrounder').length,
            'wicket-keeper': teamPlayers.filter(p => p.category === 'wicket-keeper').length
          }
        };
      });

      res.json({ teams: teamComparison });
    } catch (error) {
      console.error('Error comparing teams:', error);
      res.status(500).json({ error: 'Error comparing teams' });
    }
  },

  // Assign captain to team
  assignCaptain: (req, res) => {
    try {
      console.log('🏏 assignCaptain method called');
      console.log('🏏 Request body:', req.body);
      console.log('🏏 Request body type:', typeof req.body);
      console.log('🏏 Request body keys:', Object.keys(req.body));
      
      const { teamId, captainId } = req.body;
      
      console.log('🏏 Extracted teamId:', teamId, 'type:', typeof teamId);
      console.log('🏏 Extracted captainId:', captainId, 'type:', typeof captainId);
      
      if (!teamId || !captainId) {
        console.log('🏏 Validation failed - missing teamId or captainId');
        return res.status(400).json({ error: 'Team ID and Captain ID are required' });
      }

      const teams = dataService.getTeams();
      const players = dataService.getPlayers();
      
      console.log('🏏 Total teams:', teams.length);
      console.log('🏏 Total players:', players.length);
      
      const team = teams.find(t => t.id === parseInt(teamId));
      const captain = players.find(p => p.id === captainId); // Keep as string for UUID
      
      console.log('🏏 Found team:', team ? `Team ${team.id} - ${team.name}` : 'Not found');
      console.log('🏏 Found captain:', captain ? `${captain.name} (ID: ${captain.id}, Category: ${captain.category})` : 'Not found');
      
      if (!team) {
        console.log('🏏 Team not found error');
        return res.status(404).json({ error: 'Team not found' });
      }
      
      if (!captain || captain.category !== 'captain') {
        console.log('🏏 Captain validation failed');
        console.log('🏏 Captain exists:', !!captain);
        if (captain) {
          console.log('🏏 Captain category:', captain.category);
        }
        // Let's also check all available captains
        const allCaptains = players.filter(p => p.category === 'captain');
        console.log('🏏 Available captains:', allCaptains.map(c => `${c.name} (ID: ${c.id})`));
        return res.status(404).json({ error: 'Captain not found or invalid player category' });
      }

      // Check if captain is already assigned to another team
      if (captain.team && captain.team !== parseInt(teamId)) {
        return res.status(400).json({ error: 'Captain is already assigned to another team' });
      }

      // Remove captain from previous team if any
      const previousTeam = teams.find(t => t.captain === captainId); // Use string ID
      if (previousTeam && previousTeam.id !== parseInt(teamId)) {
        previousTeam.captain = null;
        previousTeam.players = previousTeam.players.filter(pid => pid !== captainId); // Use string ID
      }

      // Assign captain to new team
      captain.team = parseInt(teamId);
      captain.status = 'assigned';
      captain.finalBid = 0; // Captains are free
      
      team.captain = captainId; // Use string ID
      if (!team.players.includes(captainId)) { // Use string ID
        team.players.push(captainId); // Use string ID
      }

      dataService.setTeams(teams);
      dataService.setPlayers(players);

      // Broadcast updates
      socketService.emit('teamsUpdated', teams);
      socketService.emit('playersUpdated', players);

      res.json({ 
        message: 'Captain assigned successfully',
        teams,
        players,
        team,
        captain
      });
    } catch (error) {
      console.error('Error assigning captain:', error);
      res.status(500).json({ error: 'Error assigning captain' });
    }
  },

  // Unassign captain from team
  unassignCaptain: (req, res) => {
    try {
      const { teamId } = req.body;
      
      if (!teamId) {
        return res.status(400).json({ error: 'Team ID is required' });
      }

      const teams = dataService.getTeams();
      const players = dataService.getPlayers();
      
      const team = teams.find(t => t.id === parseInt(teamId));
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      if (!team.captain) {
        return res.status(400).json({ error: 'No captain assigned to this team' });
      }

      const captain = players.find(p => p.id === team.captain); // team.captain is already string ID
      if (captain) {
        captain.team = null;
        captain.status = 'available';
        captain.finalBid = 0;
      }

      const captainId = team.captain; // Store before clearing
      team.captain = null;
      team.players = team.players.filter(pid => pid !== captainId); // Use stored captain ID

      dataService.setTeams(teams);
      dataService.setPlayers(players);

      // Broadcast updates
      socketService.emit('teamsUpdated', teams);
      socketService.emit('playersUpdated', players);

      res.json({ 
        message: 'Captain unassigned successfully',
        teams,
        players,
        team
      });
    } catch (error) {
      console.error('Error unassigning captain:', error);
      res.status(500).json({ error: 'Error unassigning captain' });
    }
  },

  // Assign retained player to team
  assignRetention: (req, res) => {
    try {
      const { teamId, playerId, retentionAmount = 0, retentionsPerTeam = 5 } = req.body;
      
      if (!teamId || !playerId) {
        return res.status(400).json({ error: 'Team ID and Player ID are required' });
      }

      if (retentionAmount < 0) {
        return res.status(400).json({ error: 'Retention amount must be ≥ ₹0' });
      }

      const teams = dataService.getTeams();
      const players = dataService.getPlayers();
      const settings = dataService.getSettings();

      const team = teams.find(t => t.id === parseInt(teamId));
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const player = players.find(p => p.id === playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      if (player.category === 'captain') {
        return res.status(400).json({ error: 'Captains cannot be retained players' });
      }

      if (player.status === 'retained' && player.team !== null) {
        return res.status(400).json({ error: 'Player is already retained by another team' });
      }

      // Check if team has reached retention limit
      const currentRetentions = players.filter(p => p.team === team.id && p.status === 'retained').length;
      const maxRetentions = retentionsPerTeam || 5; // Use passed parameter or default to 5
      if (currentRetentions >= maxRetentions) {
        return res.status(400).json({ error: `Team has reached maximum retention limit (${maxRetentions} players)` });
      }

      // Check if team has enough budget
      const retentionAmountNum = parseInt(retentionAmount) || 0;
      if (team.budget < retentionAmountNum) {
        return res.status(400).json({ error: 'Insufficient team budget for this retention amount' });
      }

      // Assign player to team as retained
      player.team = team.id;
      player.status = 'retained';
      player.retentionAmount = retentionAmountNum;
      player.finalBid = retentionAmountNum; // Set finalBid to retention amount for consistency

      // Update team budget
      team.budget -= retentionAmountNum;

      // Add to team's player list if not already there
      if (!team.players.includes(player.id)) {
        team.players.push(player.id);
      }

      dataService.setTeams(teams);
      dataService.setPlayers(players);

      // Broadcast updates
      socketService.emit('teamsUpdated', teams);
      socketService.emit('playersUpdated', players);
      socketService.emit('playerRetained', { 
        player: player, 
        team: team, 
        retentionAmount: retentionAmountNum 
      });

      res.json({ 
        message: `${player.name} retained by ${team.name} for ₹${retentionAmountNum}`,
        teams,
        players,
        player,
        team
      });
    } catch (error) {
      console.error('Error assigning retention:', error);
      res.status(500).json({ error: 'Error assigning retention' });
    }
  },

  // Remove retention from player
  unassignRetention: (req, res) => {
    try {
      const { playerId } = req.body;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      const teams = dataService.getTeams();
      const players = dataService.getPlayers();
      
      const player = players.find(p => p.id === playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      if (player.status !== 'retained') {
        return res.status(400).json({ error: 'Player is not currently retained' });
      }

      const team = teams.find(t => t.id === player.team);
      if (team) {
        // Restore the retention amount to team budget
        team.budget += (player.retentionAmount || 0);
        
        // Remove player from team's player list
        team.players = team.players.filter(pid => pid !== player.id);
      }

      // Reset player status
      const retentionAmount = player.retentionAmount || 0;
      player.team = null;
      player.status = 'available';
      player.retentionAmount = 0;
      player.finalBid = 0;

      dataService.setTeams(teams);
      dataService.setPlayers(players);

      // Broadcast updates
      socketService.emit('teamsUpdated', teams);
      socketService.emit('playersUpdated', players);
      socketService.emit('playerRetentionRemoved', { 
        player: player, 
        team: team, 
        refundedAmount: retentionAmount 
      });

      res.json({ 
        message: `${player.name} retention removed, ₹${retentionAmount} refunded to team`,
        teams,
        players,
        player,
        team
      });
    } catch (error) {
      console.error('Error removing retention:', error);
      res.status(500).json({ error: 'Error removing retention' });
    }
  }
};

module.exports = teamController;
