const xlsx = require('xlsx');

const excelService = {
  // Helper function to set column widths
  setColumnWidths(worksheet, data) {
    if (!data || data.length === 0) return;
    
    const keys = Object.keys(data[0]);
    const columnWidths = keys.map(key => {
      const maxLength = Math.max(
        key.length, // Header length
        ...data.map(row => String(row[key] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    worksheet['!cols'] = columnWidths;
  },

  // FIXED: Create team squads sheet (excludes captains from sold players)
  createTeamSquadsSheet(auctionData) {
    try {
      const teams = auctionData.teams || [];
      
      if (teams.length === 0) {
        return [['No teams available']];
      }

      // Get players for each team (exclude captains from main squad display)
      const playersByTeam = {};
      teams.forEach(team => {
        playersByTeam[team.id] = (auctionData.players || [])
          .filter(p => p.team === team.id && p.status === 'sold')
          .sort((a, b) => (b.finalBid || 0) - (a.finalBid || 0)); // Sort by price descending
      });

      const maxPlayers = Math.max(...teams.map(team => playersByTeam[team.id]?.length || 0), 1);

      // Create sheet data as array of arrays
      const sheetData = [];

      // Create headers row
      const headers = [];
      teams.forEach((team, index) => {
        headers.push(`${team.name} Name`);
        headers.push(`${team.name} Role`);
        headers.push(`${team.name} Price`);
        
        // Add separator column except for last team
        if (index < teams.length - 1) {
          headers.push(''); // Empty separator column
        }
      });
      sheetData.push(headers);

      // Add player rows
      for (let i = 0; i < maxPlayers; i++) {
        const row = [];
        
        teams.forEach((team, teamIndex) => {
          const teamPlayers = playersByTeam[team.id] || [];
          const player = teamPlayers[i];
          
          if (player) {
            row.push(player.name || '');
            row.push(player.role || '');
            if (player.category === 'captain') {
              row.push('Captain');
            } else {
              row.push(`₹${player.finalBid || 0}`);
            }
          } else {
            row.push(''); // Empty name
            row.push(''); // Empty role
            row.push(''); // Empty price
          }
          
          // Add separator column except for last team
          if (teamIndex < teams.length - 1) {
            row.push(''); // Empty separator
          }
        });
        
        sheetData.push(row);
      }

      // Add empty separator row
      sheetData.push(new Array(headers.length).fill(''));

      // Add summary rows
      const summaryData = [
        { label: 'Players:', getValue: (teamPlayers) => `${teamPlayers.length}` },
        { label: 'Spent:', getValue: (teamPlayers, team, settings) => {
          const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
          return `₹${totalSpent}`;
        }},
        { label: 'Remaining:', getValue: (teamPlayers, team) => `₹${team.budget || 0}` },
        { label: 'Utilization:', getValue: (teamPlayers, team, settings) => {
          const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
          const percentage = Math.round((totalSpent / (settings.startingBudget || 1000)) * 100);
          return `${percentage}%`;
        }}
      ];

      summaryData.forEach(summary => {
        const row = [];
        teams.forEach((team, teamIndex) => {
          const teamPlayers = playersByTeam[team.id] || [];
          
          row.push(summary.getValue(teamPlayers, team, auctionData.settings));
          row.push('');
          row.push('');
          
          // Add separator column except for last team
          if (teamIndex < teams.length - 1) {
            row.push('');
          }
        });
        sheetData.push(row);
      });

      return sheetData;

    } catch (error) {
      console.error('Error creating team squads data:', error);
      return [['Error creating team squads sheet: ' + error.message]];
    }
  },

  // Generate complete Excel workbook
  generateAuctionExcel(auctionData) {
    try {
      console.log('Starting Excel generation with data:', {
        players: auctionData.players?.length || 0,
        teams: auctionData.teams?.length || 0
      });

      // Create new workbook
      const workbook = xlsx.utils.book_new();

      // 1. Players Yet To Be Auctioned Sheet
      const yetToAuction = auctionData.players
        .filter(p => p.status === 'available' && p.category !== 'captain')
        .map(player => ({
          'Sl.No': player.slNo || '',
          'Name': player.name || '',
          'Role': player.role || '',
          'Category': player.category || '',
          'Base Price': `₹${auctionData.settings?.basePrice || 10}`
        }));

      if (yetToAuction.length > 0) {
        console.log('Creating Yet To Auction sheet with', yetToAuction.length, 'players');
        const ws1 = xlsx.utils.json_to_sheet(yetToAuction);
        this.setColumnWidths(ws1, yetToAuction);
        xlsx.utils.book_append_sheet(workbook, ws1, 'Players Yet To Auction');
      }

      // 2. FIXED: Sold Players Sheet (EXCLUDE CAPTAINS)
      const soldPlayers = auctionData.players
        .filter(p => p.status === 'sold' && p.category !== 'captain') // FIXED: Exclude captains
        .map(player => {
          const team = auctionData.teams?.find(t => t.id === player.team);
          return {
            'Sl.No': player.slNo || '',
            'Name': player.name || '',
            'Role': player.role || '',
            'Category': player.category || '',
            'Team': team ? team.name : 'N/A',
            'Final Price': `₹${player.finalBid || 0}`,
            'Status': 'Sold'
          };
        });

      if (soldPlayers.length > 0) {
        console.log('Creating Sold Players sheet with', soldPlayers.length, 'players (excluding captains)');
        const ws2 = xlsx.utils.json_to_sheet(soldPlayers);
        this.setColumnWidths(ws2, soldPlayers);
        xlsx.utils.book_append_sheet(workbook, ws2, 'Players Sold');
      }

      // 2a. NEW: Team Captains Sheet (Separate from sold players)
      const captains = auctionData.players
        .filter(p => p.category === 'captain')
        .map(player => {
          const team = auctionData.teams?.find(t => t.id === player.team);
          return {
            'Sl.No': player.slNo || '',
            'Name': player.name || '',
            'Role': player.role || '',
            'Team': team ? team.name : 'N/A',
            'Status': 'Captain (Auto-assigned)'
          };
        });

      if (captains.length > 0) {
        console.log('Creating Captains sheet with', captains.length, 'captains');
        const wsCaptains = xlsx.utils.json_to_sheet(captains);
        this.setColumnWidths(wsCaptains, captains);
        xlsx.utils.book_append_sheet(workbook, wsCaptains, 'Team Captains');
      }

      // 3. Unsold Players Sheet
      const unsoldPlayers = auctionData.players
        .filter(p => p.status === 'unsold')
        .map(player => ({
          'Sl.No': player.slNo || '',
          'Name': player.name || '',
          'Role': player.role || '',
          'Category': player.category || '',
          'Last Bid': player.currentBid > 0 ? `₹${player.currentBid}` : 'No Bids'
        }));

      if (unsoldPlayers.length > 0) {
        console.log('Creating Unsold Players sheet with', unsoldPlayers.length, 'players');
        const ws3 = xlsx.utils.json_to_sheet(unsoldPlayers);
        this.setColumnWidths(ws3, unsoldPlayers);
        xlsx.utils.book_append_sheet(workbook, ws3, 'Players Unsold');
      }

      // 4. Team Squads Sheet - FIXED
      console.log('Creating Team Squads sheet...');
      const teamSquadsData = this.createTeamSquadsSheet(auctionData);
      if (Array.isArray(teamSquadsData) && teamSquadsData.length > 0) {
        const ws4 = xlsx.utils.aoa_to_sheet(teamSquadsData);
        
        // Set column widths
        if (teamSquadsData.length > 0 && teamSquadsData[0]?.length > 0) {
          const columnWidths = teamSquadsData.map((_, colIndex) => {
            let maxWidth = 10; // Minimum width
            
            teamSquadsData.forEach(row => {
              if (row && row[colIndex] && typeof row[colIndex] === 'string') {
                maxWidth = Math.max(maxWidth, row[colIndex].length);
              }
            });
            
            return { wch: Math.min(maxWidth + 2, 30) }; // Max width 30
          });
          ws4['!cols'] = columnWidths;
        }
        
        xlsx.utils.book_append_sheet(workbook, ws4, 'Team Squads');
        console.log('Team Squads sheet created successfully');
      } else {
        console.log('No team squads data available');
      }

      // 5. Team Finances Sheet
      const teamFinances = (auctionData.teams || []).map(team => {
        const teamPlayers = auctionData.players?.filter(p => p.team === team.id && p.status === 'sold') || [];
        const soldPlayersOnly = teamPlayers.filter(p => p.category !== 'captain'); // Exclude captains from spending
        const totalSpent = soldPlayersOnly.reduce((sum, p) => sum + (p.finalBid || 0), 0);
        const playersCount = teamPlayers.length;
        const captainCount = teamPlayers.filter(p => p.category === 'captain').length;
        const boughtPlayersCount = playersCount - captainCount;
        
        return {
          'Team Name': team.name,
          'Initial Budget': `₹${auctionData.settings?.startingBudget || 1000}`,
          'Total Spent': `₹${totalSpent}`,
          'Remaining Budget': `₹${team.budget || 0}`,
          'Total Players': playersCount,
          'Captains': captainCount,
          'Players Bought': boughtPlayersCount,
          'Average Price Per Player': boughtPlayersCount > 0 ? `₹${Math.round(totalSpent / boughtPlayersCount)}` : '₹0',
          'Budget Utilization': `${Math.round(((totalSpent / (auctionData.settings?.startingBudget || 1000)) * 100))}%`
        };
      });

      if (teamFinances.length > 0) {
        console.log('Creating Team Finances sheet');
        const ws5 = xlsx.utils.json_to_sheet(teamFinances);
        this.setColumnWidths(ws5, teamFinances);
        xlsx.utils.book_append_sheet(workbook, ws5, 'Team Finances');
      }

      // 6. Auction Summary Sheet
      const soldPlayersCount = auctionData.players?.filter(p => p.status === 'sold' && p.category !== 'captain').length || 0;
      const captainsCount = auctionData.players?.filter(p => p.category === 'captain').length || 0;
      
      const auctionSummary = [
        {
          'Metric': 'Total Players',
          'Count': auctionData.players?.length || 0,
          'Details': 'Including captains'
        },
        {
          'Metric': 'Players Available',
          'Count': auctionData.players?.filter(p => p.status === 'available' && p.category !== 'captain').length || 0,
          'Details': 'Excluding captains'
        },
        {
          'Metric': 'Players Sold (Bidding)',
          'Count': soldPlayersCount,
          'Details': 'Sold through auction bidding'
        },
        {
          'Metric': 'Team Captains',
          'Count': captainsCount,
          'Details': 'Auto-assigned captains'
        },
        {
          'Metric': 'Players Unsold',
          'Count': auctionData.players?.filter(p => p.status === 'unsold').length || 0,
          'Details': 'Failed to sell'
        },
        {
          'Metric': 'Total Teams',
          'Count': auctionData.teams?.length || 0,
          'Details': 'Participating teams'
        },
        {
          'Metric': 'Base Price',
          'Count': `₹${auctionData.settings?.basePrice || 10}`,
          'Details': 'Starting price per player'
        },
        {
          'Metric': 'Team Budget',
          'Count': `₹${auctionData.settings?.startingBudget || 1000}`,
          'Details': 'Initial budget per team'
        }
      ];

      if (auctionData.stats?.highestBid) {
        auctionSummary.push({
          'Metric': 'Highest Sale',
          'Count': `₹${auctionData.stats.highestBid.amount}`,
          'Details': auctionData.stats.highestBid.player?.name || 'Unknown'
        });
      }

      if (auctionData.stats?.averageBid) {
        auctionSummary.push({
          'Metric': 'Average Sale Price',
          'Count': `₹${Math.round(auctionData.stats.averageBid)}`,
          'Details': 'Excluding captains'
        });
      }

      console.log('Creating Auction Summary sheet');
      const ws6 = xlsx.utils.json_to_sheet(auctionSummary);
      this.setColumnWidths(ws6, auctionSummary);
      xlsx.utils.book_append_sheet(workbook, ws6, 'Auction Summary');

      // 7. Category-wise Analysis Sheet (Exclude captains)
      const categories = [...new Set(auctionData.players?.map(p => p.category) || [])].filter(c => c !== 'captain');
      if (categories.length > 0) {
        const categoryAnalysis = categories.map(category => {
          const categoryPlayers = auctionData.players?.filter(p => p.category === category) || [];
          const soldInCategory = categoryPlayers.filter(p => p.status === 'sold');
          const totalSpentInCategory = soldInCategory.reduce((sum, p) => sum + (p.finalBid || 0), 0);
          
          return {
            'Category': category.charAt(0).toUpperCase() + category.slice(1),
            'Total Players': categoryPlayers.length,
            'Players Sold': soldInCategory.length,
            'Players Unsold': categoryPlayers.filter(p => p.status === 'unsold').length,
            'Players Available': categoryPlayers.filter(p => p.status === 'available').length,
            'Total Spent': `₹${totalSpentInCategory}`,
            'Average Price': soldInCategory.length > 0 ? `₹${Math.round(totalSpentInCategory / soldInCategory.length)}` : '₹0',
            'Success Rate': `${Math.round((soldInCategory.length / categoryPlayers.length) * 100)}%`
          };
        });

        console.log('Creating Category Analysis sheet');
        const ws7 = xlsx.utils.json_to_sheet(categoryAnalysis);
        this.setColumnWidths(ws7, categoryAnalysis);
        xlsx.utils.book_append_sheet(workbook, ws7, 'Category Analysis');
      }

      // Generate Excel buffer
      console.log('Generating Excel buffer...');
      const buffer = xlsx.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true
      });

      console.log('Excel generation completed successfully. Buffer size:', buffer.length);
      return buffer;

    } catch (error) {
      console.error('Error generating Excel:', error);
      throw new Error('Failed to generate Excel file: ' + error.message);
    }
  },

  // Generate Teamwise Squads Excel (Player name, Role/Category, Price)
  generateTeamSquadsExcel(auctionData) {
    try {
      console.log('Starting Team Squads Excel generation');

      // Create new workbook
      const workbook = xlsx.utils.book_new();

      // Team Squads - Simple format with Player name, Role/Category, Price
      const teams = auctionData.teams || [];
      
      teams.forEach(team => {
        const teamPlayers = auctionData.players?.filter(p => p.team === team.id) || [];
        
        if (teamPlayers.length > 0) {
          const squadData = teamPlayers.map(player => ({
            'Player Name': player.name || '',
            'Role/Category': player.role || player.category || '',
            'Price': player.category === 'captain' ? 'Captain (Auto-assigned)' : `₹${player.finalBid || 0}`
          }));

          // Add team summary at the end
          squadData.push({
            'Player Name': '',
            'Role/Category': '',
            'Price': ''
          });
          
          const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
          squadData.push({
            'Player Name': 'TEAM SUMMARY',
            'Role/Category': `${teamPlayers.length} Players`,
            'Price': `Total: ₹${totalSpent}`
          });

          const ws = xlsx.utils.json_to_sheet(squadData);
          this.setColumnWidths(ws, squadData);
          
          // Clean team name for sheet name (remove invalid characters)
          const cleanTeamName = team.name.replace(/[\\\/\?\*\[\]]/g, '').substring(0, 31);
          xlsx.utils.book_append_sheet(workbook, ws, cleanTeamName);
        }
      });

      // Summary sheet with all teams
      const allTeamsData = [
        { 'Team': 'TEAM', 'Players': 'PLAYERS', 'Total Spent': 'TOTAL SPENT', 'Remaining Budget': 'REMAINING BUDGET' }
      ];
      
      teams.forEach(team => {
        const teamPlayers = auctionData.players?.filter(p => p.team === team.id) || [];
        const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.finalBid || 0), 0);
        
        allTeamsData.push({
          'Team': team.name,
          'Players': teamPlayers.length.toString(),
          'Total Spent': `₹${totalSpent}`,
          'Remaining Budget': `₹${team.budget || 0}`
        });
      });

      const summaryWs = xlsx.utils.json_to_sheet(allTeamsData);
      this.setColumnWidths(summaryWs, allTeamsData);
      xlsx.utils.book_append_sheet(workbook, summaryWs, 'All Teams Summary');

      // Generate Excel buffer
      console.log('Generating Team Squads Excel buffer...');
      const buffer = xlsx.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true
      });

      console.log('Team Squads Excel generation completed successfully. Buffer size:', buffer.length);
      return buffer;

    } catch (error) {
      console.error('Error generating Team Squads Excel:', error);
      throw new Error('Failed to generate Team Squads Excel file: ' + error.message);
    }
  },

  // Generate Auction Summary Excel
  generateAuctionSummaryExcel(auctionData) {
    try {
      console.log('Starting Auction Summary Excel generation');

      // Create new workbook
      const workbook = xlsx.utils.book_new();

      // 1. Overall Summary
      const soldPlayersCount = auctionData.players?.filter(p => p.status === 'sold' && p.category !== 'captain').length || 0;
      const captainsCount = auctionData.players?.filter(p => p.category === 'captain').length || 0;
      
      const overallSummary = [
        {
          'Metric': 'Total Players',
          'Count': auctionData.players?.length || 0,
          'Details': 'Including captains'
        },
        {
          'Metric': 'Players Available',
          'Count': auctionData.players?.filter(p => p.status === 'available' && p.category !== 'captain').length || 0,
          'Details': 'Excluding captains'
        },
        {
          'Metric': 'Players Sold (Bidding)',
          'Count': soldPlayersCount,
          'Details': 'Sold through auction bidding'
        },
        {
          'Metric': 'Team Captains',
          'Count': captainsCount,
          'Details': 'Auto-assigned captains'
        },
        {
          'Metric': 'Players Unsold',
          'Count': auctionData.players?.filter(p => p.status === 'unsold').length || 0,
          'Details': 'Failed to sell'
        },
        {
          'Metric': 'Total Teams',
          'Count': auctionData.teams?.length || 0,
          'Details': 'Participating teams'
        },
        {
          'Metric': 'Base Price',
          'Count': `₹${auctionData.settings?.basePrice || 10}`,
          'Details': 'Starting price per player'
        },
        {
          'Metric': 'Team Budget',
          'Count': `₹${auctionData.settings?.startingBudget || 1000}`,
          'Details': 'Initial budget per team'
        }
      ];

      if (auctionData.stats?.highestBid) {
        overallSummary.push({
          'Metric': 'Highest Sale',
          'Count': `₹${auctionData.stats.highestBid.amount}`,
          'Details': auctionData.stats.highestBid.player?.name || 'Unknown'
        });
      }

      if (auctionData.stats?.averageBid) {
        overallSummary.push({
          'Metric': 'Average Sale Price',
          'Count': `₹${Math.round(auctionData.stats.averageBid)}`,
          'Details': 'Excluding captains'
        });
      }

      const ws1 = xlsx.utils.json_to_sheet(overallSummary);
      this.setColumnWidths(ws1, overallSummary);
      xlsx.utils.book_append_sheet(workbook, ws1, 'Overall Summary');

      // 2. Team Financial Summary
      const teamFinances = (auctionData.teams || []).map(team => {
        const teamPlayers = auctionData.players?.filter(p => p.team === team.id && p.status === 'sold') || [];
        const soldPlayersOnly = teamPlayers.filter(p => p.category !== 'captain');
        const totalSpent = soldPlayersOnly.reduce((sum, p) => sum + (p.finalBid || 0), 0);
        const playersCount = teamPlayers.length;
        const captainCount = teamPlayers.filter(p => p.category === 'captain').length;
        const boughtPlayersCount = playersCount - captainCount;
        
        return {
          'Team Name': team.name,
          'Initial Budget': `₹${auctionData.settings?.startingBudget || 1000}`,
          'Total Spent': `₹${totalSpent}`,
          'Remaining Budget': `₹${team.budget || 0}`,
          'Total Players': playersCount,
          'Captains': captainCount,
          'Players Bought': boughtPlayersCount,
          'Average Price Per Player': boughtPlayersCount > 0 ? `₹${Math.round(totalSpent / boughtPlayersCount)}` : '₹0',
          'Budget Utilization': `${Math.round(((totalSpent / (auctionData.settings?.startingBudget || 1000)) * 100))}%`
        };
      });

      if (teamFinances.length > 0) {
        const ws2 = xlsx.utils.json_to_sheet(teamFinances);
        this.setColumnWidths(ws2, teamFinances);
        xlsx.utils.book_append_sheet(workbook, ws2, 'Team Finances');
      }

      // 3. Category-wise Analysis
      const categories = [...new Set(auctionData.players?.map(p => p.category) || [])].filter(c => c && c !== 'captain');
      if (categories.length > 0) {
        const categoryAnalysis = categories.map(category => {
          const categoryPlayers = auctionData.players?.filter(p => p.category === category) || [];
          const soldInCategory = categoryPlayers.filter(p => p.status === 'sold');
          const totalSpentInCategory = soldInCategory.reduce((sum, p) => sum + (p.finalBid || 0), 0);
          
          return {
            'Category': (category && typeof category === 'string') ? (category.charAt(0).toUpperCase() + category.slice(1)) : 'Unknown',
            'Total Players': categoryPlayers.length,
            'Players Sold': soldInCategory.length,
            'Players Unsold': categoryPlayers.filter(p => p.status === 'unsold').length,
            'Players Available': categoryPlayers.filter(p => p.status === 'available').length,
            'Total Spent': `₹${totalSpentInCategory}`,
            'Average Price': soldInCategory.length > 0 ? `₹${Math.round(totalSpentInCategory / soldInCategory.length)}` : '₹0',
            'Success Rate': `${Math.round((soldInCategory.length / categoryPlayers.length) * 100)}%`
          };
        });

        const ws3 = xlsx.utils.json_to_sheet(categoryAnalysis);
        this.setColumnWidths(ws3, categoryAnalysis);
        xlsx.utils.book_append_sheet(workbook, ws3, 'Category Analysis');
      }

      // Generate Excel buffer
      console.log('Generating Auction Summary Excel buffer...');
      const buffer = xlsx.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true
      });

      console.log('Auction Summary Excel generation completed successfully. Buffer size:', buffer.length);
      return buffer;

    } catch (error) {
      console.error('Error generating Auction Summary Excel:', error);
      throw new Error('Failed to generate Auction Summary Excel file: ' + error.message);
    }
  }
};

module.exports = excelService;
