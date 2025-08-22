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
      const teamPlayers = players.filter(p => p.team === team.id && p.status === 'sold');

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
      const teamPlayers = players.filter(p => p.team === team.id && p.status === 'sold');
      
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
        const teamPlayers = players.filter(p => p.team === team.id && p.status === 'sold');
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
  }
};

module.exports = teamController;
