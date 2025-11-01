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

  // Create team squads sheet (includes all players: sold, retained, AND captains)
  createTeamSquadsSheet(auctionData) {
    try {
      const teams = auctionData.teams || [];
      
      if (teams.length === 0) {
        return [['No teams available']];
      }

      // Get ALL players for each team (sold, retained, captains - include ALL statuses assigned to teams)
      const playersByTeam = {};
      teams.forEach(team => {
        playersByTeam[team.id] = (auctionData.players || [])
          .filter(p => p.team === team.id && p.team !== '' && p.team !== null)
          .sort((a, b) => {
            // Sort captains first, then by price descending
            const aIsCaptain = a.role && a.role.toLowerCase().includes('captain');
            const bIsCaptain = b.role && b.role.toLowerCase().includes('captain');
            
            if (aIsCaptain && !bIsCaptain) return -1;
            if (!aIsCaptain && bIsCaptain) return 1;
            
            return (b.finalBid || 0) - (a.finalBid || 0);
          });
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
        headers.push(`${team.name} Status`);
        
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
            
            // Determine status - prioritize Captain role first, then other statuses
            let status = 'Sold'; // default
            if (player.role && player.role.toLowerCase().includes('captain')) {
              status = 'Captain';
            } else if (player.status === 'retained') {
              status = 'Retained';
            }
            row.push(status);
          } else {
            row.push('', '', '', '');
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
      const captains = allPlayers.filter(p => p.role && p.role.toLowerCase().includes('captain'));
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
          const teamPlayers = allPlayers.filter(p => p.team === team.id && p.team !== '' && p.team !== null);
          const totalSpent = teamPlayers.reduce((sum, player) => sum + (player.finalBid || 0), 0);
          const playersCount = teamPlayers.length;
          
          return {
            'Team Name': team.name || '',
            'Budget': team.budget ? `₹${team.budget}` : '',
            'Total Spent': `₹${totalSpent}`,
            'Remaining Budget': team.budget ? `₹${team.budget - totalSpent}` : '',
            'Total Players': playersCount,
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
      
      const soldAndRetainedPlayers = [...soldPlayers, ...retainedPlayers];
      const totalMoneySpent = soldAndRetainedPlayers.reduce((sum, player) => sum + (player.finalBid || 0), 0);
      
      const auctionSummary = [{
        'Total Players': allPlayers.length,
        'Players Sold': soldPlayers.length,
        'Players Retained': retainedPlayers.length,
        'Players Unsold': unsoldPlayers.length,
        'Players Yet To Auction': yetToAuction.length,
        'Total Teams': teams.length,
        'Total Money Spent': `₹${totalMoneySpent}`,
        'Average Player Price': soldAndRetainedPlayers.length > 0 ? 
          `₹${Math.round(totalMoneySpent / soldAndRetainedPlayers.length)}` : '₹0'
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
  },

  // Generate team squads only Excel file
  async generateTeamSquadsExcel(auctionData) {
    try {
      if (!auctionData || !auctionData.players) {
        throw new Error('No auction data provided');
      }

      console.log('Starting team squads Excel generation...');
      
      const workbook = new ExcelJS.Workbook();
      workbook.created = new Date();
      workbook.modified = new Date();

      // Team Squads Sheet
      const ws = workbook.addWorksheet('Team Squads');
      const teamSquadsData = this.createTeamSquadsSheet(auctionData);
      
      teamSquadsData.forEach(row => {
        ws.addRow(row);
      });

      // Auto-fit columns
      ws.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? String(cell.value).length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      console.log('Team squads Excel generated successfully');
      return buffer;

    } catch (error) {
      console.error('Error generating team squads Excel:', error);
      throw new Error('Failed to generate team squads Excel: ' + error.message);
    }
  },

  // Generate auction summary only Excel file
  async generateAuctionSummaryExcel(auctionData) {
    try {
      if (!auctionData || !auctionData.players) {
        throw new Error('No auction data provided');
      }

      console.log('Starting auction summary Excel generation...');
      
      const workbook = new ExcelJS.Workbook();
      workbook.created = new Date();
      workbook.modified = new Date();

      const allPlayers = auctionData.players || [];
      const soldPlayers = allPlayers.filter(p => p.status === 'sold');
      const retainedPlayers = allPlayers.filter(p => p.status === 'retained');
      const unsoldPlayers = allPlayers.filter(p => p.status === 'unsold');
      const yetToAuction = allPlayers.filter(p => p.status === 'available');
      const teams = auctionData.teams || [];

      // 1. Auction Summary Sheet
      const ws1 = workbook.addWorksheet('Auction Summary');
      
      const soldAndRetainedPlayers = [...soldPlayers, ...retainedPlayers];
      const totalMoneySpent = soldAndRetainedPlayers.reduce((sum, player) => sum + (player.finalBid || 0), 0);
      
      const auctionSummary = [{
        'Total Players': allPlayers.length,
        'Players Sold': soldPlayers.length,
        'Players Retained': retainedPlayers.length,
        'Players Unsold': unsoldPlayers.length,
        'Players Yet To Auction': yetToAuction.length,
        'Total Teams': teams.length,
        'Total Money Spent': `₹${totalMoneySpent}`,
        'Average Player Price': soldAndRetainedPlayers.length > 0 ? 
          `₹${Math.round(totalMoneySpent / soldAndRetainedPlayers.length)}` : '₹0'
      }];

      // Add headers
      const summaryHeaders = Object.keys(auctionSummary[0] || {});
      ws1.addRow(summaryHeaders);
      
      // Add data
      auctionSummary.forEach(row => {
        ws1.addRow(Object.values(row));
      });

      this.setColumnWidths(ws1, auctionSummary);

      // 2. Team Finances Sheet
      if (teams.length > 0) {
        const ws2 = workbook.addWorksheet('Team Finances');
        
        const teamFinances = teams.map(team => {
          const teamPlayers = allPlayers.filter(p => p.team === team.id && p.team !== '' && p.team !== null);
          const totalSpent = teamPlayers.reduce((sum, player) => sum + (player.finalBid || 0), 0);
          const playersCount = teamPlayers.length;
          
          return {
            'Team Name': team.name || '',
            'Budget': team.budget ? `₹${team.budget}` : '',
            'Total Spent': `₹${totalSpent}`,
            'Remaining Budget': team.budget ? `₹${team.budget - totalSpent}` : '',
            'Total Players': playersCount,
            'Average Price': playersCount > 0 ? `₹${Math.round(totalSpent / playersCount)}` : '₹0'
          };
        });

        // Add headers
        const headers = Object.keys(teamFinances[0] || {});
        ws2.addRow(headers);
        
        // Add data
        teamFinances.forEach(row => {
          ws2.addRow(Object.values(row));
        });

        this.setColumnWidths(ws2, teamFinances);
      }

      // 3. Category Analysis Sheet
      const categories = [...new Set(allPlayers.map(p => p.category).filter(Boolean))];
      if (categories.length > 0) {
        const ws3 = workbook.addWorksheet('Category Analysis');
        
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
        ws3.addRow(headers);
        
        // Add data
        categoryAnalysis.forEach(row => {
          ws3.addRow(Object.values(row));
        });

        this.setColumnWidths(ws3, categoryAnalysis);
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      console.log('Auction summary Excel generated successfully');
      return buffer;

    } catch (error) {
      console.error('Error generating auction summary Excel:', error);
      throw new Error('Failed to generate auction summary Excel: ' + error.message);
    }
  }
};

module.exports = secureExcelService;