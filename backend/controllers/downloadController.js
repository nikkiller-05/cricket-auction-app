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

  // Download Sale Log (chronological purchase record)
  async downloadSaleLog(req, res) {
    try {
      const auctionData = dataService.getAuctionData();
      if (!auctionData || !auctionData.players || auctionData.players.length === 0) {
        return res.status(400).json({ error: 'No auction data available for download' });
      }

      const buffer = await secureExcelService.generateSaleLogExcel(auctionData);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `sale-log-${timestamp}.xlsx`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error('Error generating Sale Log:', error);
      res.status(500).json({ error: 'Failed to generate Sale Log' });
    }
  },

  // Download full auction backup as JSON (admin/super-admin only - route-guarded)
  async downloadBackup(req, res) {
    try {
      const auctionData = dataService.getAuctionData();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `auction-backup-${timestamp}.json`;
      const json = JSON.stringify(auctionData, null, 2);

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', Buffer.byteLength(json));
      res.send(json);
    } catch (error) {
      console.error('Error generating backup:', error);
      res.status(500).json({ error: 'Failed to generate backup' });
    }
  }
};

module.exports = downloadController;
