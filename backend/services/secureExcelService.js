const ExcelJS = require('exceljs');

const secureExcelService = {
  // Helper function to set column widths
  setColumnWidths(worksheet, data) {
    if (!data || data.length === 0) return;
    
    const keys = Object.keys(data[0]);
    keys.forEach((key, index) => {
      const maxLength = Math.max(
        key.length, // Header length
        ...data.map(row => String(row[key] || '').length)
      );
      const column = worksheet.getColumn(index + 1);
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
  },

  // Read Excel file from buffer (secure replacement for xlsx.read)
  async readExcelFromBuffer(buffer) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      // Get first worksheet
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found in Excel file');
      }
      
      const data = [];
      
      // Convert to JSON format similar to xlsx
      const headers = [];
      const headerRow = worksheet.getRow(1);
      
      // Safely extract headers
      headerRow.eachCell((cell, colNumber) => {
        const headerValue = cell.value;
        if (headerValue !== null && headerValue !== undefined) {
          headers[colNumber - 1] = String(headerValue).trim();
        }
      });
      
      // Filter out undefined headers
      const validHeaders = headers.filter(h => h && h.trim());
      if (validHeaders.length === 0) {
        throw new Error('No valid headers found in Excel file');
      }
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const rowData = {};
          let hasData = false;
          
          row.eachCell((cell, colNumber) => {
            const headerName = headers[colNumber - 1];
            if (headerName) {
              const cellValue = cell.value;
              rowData[headerName] = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : '';
              if (rowData[headerName]) {
                hasData = true;
              }
            }
          });
          
          // Only add rows that have actual data
          if (hasData) {
            data.push(rowData);
          }
        }
      });
      
      return data;
    } catch (error) {
      throw new Error('Error reading Excel file: ' + error.message);
    }
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

      // Create data rows
      for (let i = 0; i < maxPlayers; i++) {
        const row = [];
        teams.forEach((team, teamIndex) => {
          const teamPlayers = playersByTeam[team.id] || [];
          const player = teamPlayers[i];
          
          if (player) {
            row.push(player.name || '');
            row.push(player.role || '');
            row.push(player.finalBid ? `₹${player.finalBid}` : '');
          } else {
            row.push('', '', '');
          }
          
          // Add separator column except for last team
          if (teamIndex < teams.length - 1) {
            row.push(''); // Empty separator column
          }
        });
        sheetData.push(row);
      }

      return sheetData;

    } catch (error) {
      console.error('Error creating team squads sheet:', error);
      return [['Error creating team squads data']];
    }
  },

  // Generate comprehensive auction report
  async generateAuctionReport(auctionData) {
    try {
      if (!auctionData || !auctionData.players) {
        throw new Error('No auction data provided');
      }

      console.log('Starting auction report generation...');
      
      const workbook = new ExcelJS.Workbook();
      workbook.created = new Date();
      workbook.modified = new Date();

      // Filter players by status
      const allPlayers = auctionData.players || [];
      const yetToAuction = allPlayers.filter(p => p.status === 'available');
      const soldPlayers = allPlayers.filter(p => p.status === 'sold');
      const retainedPlayers = allPlayers.filter(p => p.status === 'retained');
      const unsoldPlayers = allPlayers.filter(p => p.status === 'unsold');

      // 1. Players Yet To Auction Sheet
      if (yetToAuction.length > 0) {
        const ws1 = workbook.addWorksheet('Players Yet To Auction');
        
        const yetToAuctionData = yetToAuction.map(player => ({
          'Player Name': player.name || '',
          'Role': player.role || '',
          'Team': player.team || '',
          'Base Price': player.basePrice ? `₹${player.basePrice}` : '',
          'Category': player.category || '',
          'Experience': player.experience || '',
          'Age': player.age || '',
          'Batting Style': player.battingStyle || '',
          'Bowling Style': player.bowlingStyle || '',
          'Nationality': player.nationality || ''
        }));

        // Add headers
        const headers = Object.keys(yetToAuctionData[0] || {});
        ws1.addRow(headers);
        
        // Add data
        yetToAuctionData.forEach(row => {
          ws1.addRow(Object.values(row));
        });

        this.setColumnWidths(ws1, yetToAuctionData);
      }

      // 2. Sold Players Sheet
      if (soldPlayers.length > 0) {
        const ws2 = workbook.addWorksheet('Players Sold');
        
        const soldPlayersData = soldPlayers.map(player => ({
          'Player Name': player.name || '',
          'Team': auctionData.teams?.find(t => t.id === player.team)?.name || player.team || '',
          'Role': player.role || '',
          'Base Price': player.basePrice ? `₹${player.basePrice}` : '',
          'Final Bid': player.finalBid ? `₹${player.finalBid}` : '',
          'Category': player.category || '',
          'Experience': player.experience || '',
          'Age': player.age || '',
          'Batting Style': player.battingStyle || '',
          'Bowling Style': player.bowlingStyle || '',
          'Nationality': player.nationality || ''
        }));

        // Add headers
        const headers = Object.keys(soldPlayersData[0] || {});
        ws2.addRow(headers);
        
        // Add data
        soldPlayersData.forEach(row => {
          ws2.addRow(Object.values(row));
        });

        this.setColumnWidths(ws2, soldPlayersData);
      }

      // 3. Team Captains Sheet
      const captains = allPlayers.filter(p => p.role === 'Captain' || p.role === 'captain');
      if (captains.length > 0) {
        const wsCaptains = workbook.addWorksheet('Team Captains');
        
        const captainsData = captains.map(player => ({
          'Captain Name': player.name || '',
          'Team': auctionData.teams?.find(t => t.id === player.team)?.name || player.team || '',
          'Status': player.status || '',
          'Base Price': player.basePrice ? `₹${player.basePrice}` : '',
          'Final Bid': player.finalBid ? `₹${player.finalBid}` : '',
          'Experience': player.experience || '',
          'Age': player.age || '',
          'Nationality': player.nationality || ''
        }));

        // Add headers
        const headers = Object.keys(captainsData[0] || {});
        wsCaptains.addRow(headers);
        
        // Add data
        captainsData.forEach(row => {
          wsCaptains.addRow(Object.values(row));
        });

        this.setColumnWidths(wsCaptains, captainsData);
      }

      // 4. Unsold Players Sheet
      if (unsoldPlayers.length > 0) {
        const ws3 = workbook.addWorksheet('Players Unsold');
        
        const unsoldPlayersData = unsoldPlayers.map(player => ({
          'Player Name': player.name || '',
          'Role': player.role || '',
          'Base Price': player.basePrice ? `₹${player.basePrice}` : '',
          'Category': player.category || '',
          'Experience': player.experience || '',
          'Age': player.age || '',
          'Batting Style': player.battingStyle || '',
          'Bowling Style': player.bowlingStyle || '',
          'Nationality': player.nationality || ''
        }));

        // Add headers
        const headers = Object.keys(unsoldPlayersData[0] || {});
        ws3.addRow(headers);
        
        // Add data
        unsoldPlayersData.forEach(row => {
          ws3.addRow(Object.values(row));
        });

        this.setColumnWidths(ws3, unsoldPlayersData);
      }

      // 5. Team Squads Sheet
      const ws4 = workbook.addWorksheet('Team Squads');
      const teamSquadsData = this.createTeamSquadsSheet(auctionData);
      
      teamSquadsData.forEach(row => {
        ws4.addRow(row);
      });

      // 6. Team Finances Sheet
      const teams = auctionData.teams || [];
      if (teams.length > 0) {
        const ws5 = workbook.addWorksheet('Team Finances');
        
        const teamFinances = teams.map(team => {
          const teamPlayers = allPlayers.filter(p => p.team === team.id && p.status === 'sold');
          const totalSpent = teamPlayers.reduce((sum, player) => sum + (player.finalBid || 0), 0);
          const playersCount = teamPlayers.length;
          
          return {
            'Team Name': team.name || '',
            'Budget': team.budget ? `₹${team.budget}` : '',
            'Total Spent': `₹${totalSpent}`,
            'Remaining Budget': team.budget ? `₹${team.budget - totalSpent}` : '',
            'Players Bought': playersCount,
            'Average Price': playersCount > 0 ? `₹${Math.round(totalSpent / playersCount)}` : '₹0'
          };
        });

        // Add headers
        const headers = Object.keys(teamFinances[0] || {});
        ws5.addRow(headers);
        
        // Add data
        teamFinances.forEach(row => {
          ws5.addRow(Object.values(row));
        });

        this.setColumnWidths(ws5, teamFinances);
      }

      // 7. Auction Summary Sheet
      const ws6 = workbook.addWorksheet('Auction Summary');
      
      const auctionSummary = [{
        'Total Players': allPlayers.length,
        'Players Sold': soldPlayers.length,
        'Players Retained': retainedPlayers.length,
        'Players Unsold': unsoldPlayers.length,
        'Players Yet To Auction': yetToAuction.length,
        'Total Teams': teams.length,
        'Total Money Spent': `₹${soldPlayers.reduce((sum, player) => sum + (player.finalBid || 0), 0)}`,
        'Average Player Price': soldPlayers.length > 0 ? 
          `₹${Math.round(soldPlayers.reduce((sum, player) => sum + (player.finalBid || 0), 0) / soldPlayers.length)}` : '₹0'
      }];

      // Add headers
      const summaryHeaders = Object.keys(auctionSummary[0] || {});
      ws6.addRow(summaryHeaders);
      
      // Add data
      auctionSummary.forEach(row => {
        ws6.addRow(Object.values(row));
      });

      this.setColumnWidths(ws6, auctionSummary);

      // 8. Category Analysis Sheet
      const categories = [...new Set(allPlayers.map(p => p.category).filter(Boolean))];
      if (categories.length > 0) {
        const ws7 = workbook.addWorksheet('Category Analysis');
        
        const categoryAnalysis = categories.map(category => {
          const categoryPlayers = allPlayers.filter(p => p.category === category);
          const soldInCategory = categoryPlayers.filter(p => p.status === 'sold');
          
          return {
            'Category': category,
            'Total Players': categoryPlayers.length,
            'Players Sold': soldInCategory.length,
            'Players Unsold': categoryPlayers.filter(p => p.status === 'unsold').length,
            'Players Yet To Auction': categoryPlayers.filter(p => p.status === 'available').length,
            'Total Spent': `₹${soldInCategory.reduce((sum, player) => sum + (player.finalBid || 0), 0)}`,
            'Average Price': soldInCategory.length > 0 ? 
              `₹${Math.round(soldInCategory.reduce((sum, player) => sum + (player.finalBid || 0), 0) / soldInCategory.length)}` : '₹0'
          };
        });

        // Add headers
        const headers = Object.keys(categoryAnalysis[0] || {});
        ws7.addRow(headers);
        
        // Add data
        categoryAnalysis.forEach(row => {
          ws7.addRow(Object.values(row));
        });

        this.setColumnWidths(ws7, categoryAnalysis);
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      console.log('Auction report generated successfully');
      return buffer;

    } catch (error) {
      console.error('Error generating auction report:', error);
      throw new Error('Failed to generate auction report: ' + error.message);
    }
  }
};

module.exports = secureExcelService;