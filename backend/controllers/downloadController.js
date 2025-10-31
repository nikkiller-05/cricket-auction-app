const dataService = require('../services/dataService');
const secureExcelService = require('../services/secureExcelService');

const downloadController = {
  // Download Excel results
  async downloadExcel(req, res) {
    try {
      const auctionData = dataService.getAuctionData();
      
      if (!auctionData || !auctionData.players || auctionData.players.length === 0) {
        return res.status(400).json({ 
          error: 'No auction data available for download' 
        });
      }

      console.log('Generating Excel with', auctionData.players.length, 'players');

      const buffer = await secureExcelService.generateAuctionReport(auctionData);

      // Set headers for file download
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `cricket-auction-complete-${timestamp}.xlsx`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Length', buffer.length);
      
      console.log(`Sending Excel file: ${filename}, size: ${buffer.length} bytes`);
      
      res.send(buffer);

    } catch (error) {
      console.error('Error generating Excel file:', error);
      res.status(500).json({ 
        error: 'Failed to generate Excel file',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Download Team Squads only
  async downloadTeamSquads(req, res) {
    try {
      console.log('downloadTeamSquads called');
      const auctionData = dataService.getAuctionData();
      
      if (!auctionData || !auctionData.players || auctionData.players.length === 0) {
        return res.status(400).json({ 
          error: 'No auction data available for download' 
        });
      }

      console.log('Generating Team Squads Excel with secureExcelService');
      const buffer = await secureExcelService.generateTeamSquadsExcel(auctionData);

      // Set headers for file download
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `team-squads-${timestamp}.xlsx`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Length', buffer.length);
      
      console.log(`Sending Team Squads file: ${filename}, size: ${buffer.length} bytes`);
      
      res.send(buffer);

    } catch (error) {
      console.error('Error generating Team Squads Excel:', error);
      res.status(500).json({ 
        error: 'Failed to generate Team Squads Excel file',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Download Auction Summary only
  async downloadAuctionSummary(req, res) {
    try {
      console.log('downloadAuctionSummary called');
      const auctionData = dataService.getAuctionData();
      
      if (!auctionData || !auctionData.players || auctionData.players.length === 0) {
        return res.status(400).json({ 
          error: 'No auction data available for download' 
        });
      }

      console.log('Generating Auction Summary Excel with secureExcelService');
      const buffer = await secureExcelService.generateAuctionSummaryExcel(auctionData);

      // Set headers for file download
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `auction-summary-${timestamp}.xlsx`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Length', buffer.length);
      
      console.log(`Sending Auction Summary file: ${filename}, size: ${buffer.length} bytes`);
      
      res.send(buffer);

    } catch (error) {
      console.error('Error generating Auction Summary Excel:', error);
      res.status(500).json({ 
        error: 'Failed to generate Auction Summary Excel file',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Download CSV results (as ZIP)
  async downloadCSV(req, res) {
    try {
      const auctionData = dataService.getAuctionData();
      
      if (!auctionData || !auctionData.players || auctionData.players.length === 0) {
        return res.status(400).json({ 
          error: 'No auction data available for download' 
        });
      }

      // For now, return a simple message
      // You can implement ZIP generation here using archiver package
      res.json({ 
        message: 'CSV download not implemented yet. Use Excel download instead.',
        excelEndpoint: '/api/download-results'
      });

    } catch (error) {
      console.error('Error generating CSV:', error);
      res.status(500).json({ error: 'Error generating CSV files' });
    }
  }
};

module.exports = downloadController;
