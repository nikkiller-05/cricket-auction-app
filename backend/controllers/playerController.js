const multer = require('multer');
const secureExcelService = require('../services/secureExcelService');
const { v4: uuidv4 } = require('uuid');
const dataService = require('../services/dataService');
const socketService = require('../services/socketService');
const { determineCategory } = require('../utils/categoryParser');
const { calculateStats } = require('../utils/biddingRules'); // Import fixed calculateStats
const config = require('../config/config');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

// Helper function to parse file buffer
const parseFileBuffer = async (buffer, mimetype) => {
  try {
    console.log('Parsing file with mimetype:', mimetype, 'Buffer size:', buffer.length);
    
    if (!buffer || buffer.length === 0) {
      throw new Error('File buffer is empty');
    }
    
    let data;
    
    if (mimetype === 'text/csv') {
      // Parse CSV
      const csvText = buffer.toString('utf8');
      console.log('CSV content preview:', csvText.substring(0, 200));
      
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      if (headers.length === 0 || !headers[0]) {
        throw new Error('No valid headers found in CSV');
      }
      
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      }).filter(row => row[headers[0]]); // Filter empty rows
      
    } else {
      // Parse Excel using secure service
      data = await secureExcelService.readExcelFromBuffer(buffer);
    }

    console.log('Parsed data:', data?.length, 'rows');
    return data;
  } catch (error) {
    console.error('Error parsing file:', error.message);
    throw new Error('Error parsing file: ' + error.message);
  }
};

const playerController = {
  // Upload and process players
  async uploadPlayers(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { buffer, mimetype, originalname } = req.file;
      
      // Parse file from memory buffer
      const data = await parseFileBuffer(buffer, mimetype);
      
      if (!data || data.length === 0) {
        return res.status(400).json({ error: 'No data found in file' });
      }

      // Validate required columns
      const firstRow = data[0];
      const hasName = 'Name' in firstRow || 'Player Name' in firstRow || 'PlayerName' in firstRow;

      if (!hasName) {
        return res.status(400).json({ 
          error: 'Required column "Name" not found. Please ensure your file has a Name column.' 
        });
      }

      // Reset previous data
      dataService.resetAuctionData();

      // Parse players from file
      const players = data.map((row, index) => {
        const name = row['Name'] || row['Player Name'] || row['PlayerName'] || '';
        const role = row['Role/Category'] || row['Role'] || row['Category'] || '';
        const slNo = row['Sl.No'] || row['SlNo'] || row['Serial'] || (index + 1);

        if (!name.trim()) {
          return null; // Skip empty names
        }

        return {
          id: uuidv4(),
          slNo: slNo,
          name: name.trim(),
          role: role.trim(),
          category: determineCategory(role),
          status: 'available',
          currentBid: 0,
          finalBid: 0,
          team: null,
          biddingTeam: null
        };
      }).filter(Boolean); // Remove null entries

      if (players.length === 0) {
        return res.status(400).json({ error: 'No valid players found in file' });
      }

      // Separate captains and regular players
      const captains = players.filter(p => p.category === 'captain');
      const regularPlayers = players.filter(p => p.category !== 'captain');

      dataService.setPlayers([...captains, ...regularPlayers]);
      
      // Update file status
      const auctionData = dataService.getAuctionData();
      dataService.updateAuctionData({
        fileUploaded: true,
        fileName: originalname
      });

      // Initialize teams
      const teams = [];
      const settings = dataService.getSettings();
      for (let i = 1; i <= settings.teamCount; i++) {
        teams.push({
          id: i,
          name: `Team ${i}`,
          budget: settings.startingBudget,
          players: [],
          captain: null
        });
      }

      // Don't auto-assign captains - they will be manually assigned
      // Keep captains as available players initially
      captains.forEach(captain => {
        captain.status = 'available';
        captain.finalBid = 0;
        captain.team = null;
      });

      dataService.setTeams(teams);

      // FIXED: Calculate initial stats (should exclude captains)
      const allPlayers = dataService.getPlayers();
      const initialStats = calculateStats(allPlayers);
      dataService.updateStats(initialStats);

      // Broadcast updates
      socketService.emit('playersUpdated', dataService.getPlayers());
      socketService.emit('teamsUpdated', dataService.getTeams());
      socketService.emit('statsUpdated', initialStats); // Send corrected stats
      socketService.emit('fileUploaded', { 
        fileName: originalname, 
        playerCount: players.length,
        captainCount: captains.length 
      });

      res.json({ 
        message: 'Players uploaded and processed successfully',
        fileName: originalname,
        playerCount: players.length,
        captainCount: captains.length,
        regularPlayerCount: regularPlayers.length,
        categories: [...new Set(players.map(p => p.category))],
        players: dataService.getPlayers(),
        teams: dataService.getTeams(),
        stats: initialStats
      });

    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ 
        error: error.message || 'Error processing player file' 
      });
    }
  },

  // Validate file
  async validateFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('Validating file:', req.file.originalname, 'Type:', req.file.mimetype);
      
      const { buffer, mimetype, originalname } = req.file;
      const data = await parseFileBuffer(buffer, mimetype);
      
      console.log('Parsed data length:', data?.length);
      console.log('First row sample:', data?.[0]);
      
      if (!data || data.length === 0) {
        return res.status(400).json({ error: 'No data found in file' });
      }

      // Check columns
      const firstRow = data[0];
      if (!firstRow) {
        return res.status(400).json({ error: 'First row is empty or invalid' });
      }
      
      const columns = Object.keys(firstRow);
      const hasName = columns.some(col => 
        ['name', 'player name', 'playername'].includes(col.toLowerCase())
      );
      
      const preview = data.slice(0, 5).map((row, index) => ({
        index: index + 1,
        data: row
      }));

      res.json({
        valid: hasName,
        fileName: originalname,
        totalRows: data.length,
        columns,
        preview,
        suggestions: hasName ? [] : ['Please ensure your file has a "Name" column']
      });

    } catch (error) {
      console.error('File validation error:', error);
      res.status(500).json({ 
        error: 'Error validating file: ' + error.message 
      });
    }
  },

  // Clear auction data
  async clearAuction(req, res) {
    try {
      dataService.resetAuctionData();
      
      socketService.emit('auctionCleared');
      socketService.emit('playersUpdated', []);
      socketService.emit('teamsUpdated', []);
      socketService.emit('auctionStatusChanged', 'stopped');
      socketService.emit('statsUpdated', { 
        highestBid: null,
        lowestBid: null,
        totalSold: 0,
        totalUnsold: 0,
        averageBid: 0
      });
      
      res.json({ message: 'Auction data cleared successfully' });
    } catch (error) {
      console.error('Error clearing auction:', error);
      res.status(500).json({ error: 'Error clearing auction data' });
    }
  }
};

// Export multer upload middleware
playerController.uploadMiddleware = upload.single('playerFile');

module.exports = playerController;
