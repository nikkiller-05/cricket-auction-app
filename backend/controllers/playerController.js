const multer = require('multer');
const secureExcelService = require('../services/secureExcelService');
const { v4: uuidv4 } = require('uuid');
const dataService = require('../services/dataService');
const socketService = require('../services/socketService');
const { determineCategory } = require('../utils/categoryParser');
const { calculateStats } = require('../utils/biddingRules'); // Import fixed calculateStats
const config = require('../config/config');
const imageStorage = require('../config/storage');
const { fetchPlayerStatsBatch } = require('../utils/enrichPlayerStats');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      ...config.upload.allowedMimeTypes, // Excel/CSV
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp' // Images
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel, CSV, and image files are allowed.'));
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
        const cricHeroesLink = row['CricHeroes Link'] || row['Profile URL'] || row['Link'] || row['CricHeroes'] || row['Profile'] || '';
        const imageUrl = row['Image URL'] || row['Photo URL'] || row['Picture URL'] || row['Image'] || row['Photo'] || row['Picture'] || row['Image Link'] || '';
        
        // Parse player stats (if available from enriched Excel)
        const matches = row['Matches'] || row['Match'] || '';
        const runs = row['Runs'] || row['Total Runs'] || '';
        const battingAvg = row['Batting Avg'] || row['Average'] || row['Avg'] || '';
        const highestScore = row['Highest Score'] || row['HS'] || row['High Score'] || '';
        const wickets = row['Wickets'] || row['Wkts'] || '';
        const economy = row['Economy'] || row['Econ'] || '';
        const bestBowling = row['Best Bowling'] || row['BB'] || row['Best'] || '';

        if (!name.trim()) {
          return null; // Skip empty names
        }

        return {
          id: uuidv4(),
          slNo: slNo,
          name: name.trim(),
          role: role.trim(),
          category: determineCategory(role),
          cricHeroesLink: cricHeroesLink.trim(),
          imageUrl: imageUrl.trim(),
          matches: matches.toString().trim(),
          runs: runs.toString().trim(),
          battingAvg: battingAvg.toString().trim(),
          highestScore: highestScore.toString().trim(),
          wickets: wickets.toString().trim(),
          economy: economy.toString().trim(),
          bestBowling: bestBowling.toString().trim(),
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

      // Auto-fetch stats for players with CricHeroes links (parallel batches for speed)
      const playersNeedingStats = players.filter(p => p.cricHeroesLink && !p.matches);
      
      if (playersNeedingStats.length > 0) {
        console.log(`\n🏏 Auto-fetching stats for ${playersNeedingStats.length} players (parallel batches)...`);
        const startTime = Date.now();
        
        const results = await fetchPlayerStatsBatch(playersNeedingStats);
        
        // Update players with fetched stats
        let fetchedCount = 0;
        results.forEach(({ player: playerInfo, stats }) => {
          const player = players.find(p => p.cricHeroesLink === playerInfo.cricHeroesLink);
          if (player && stats) {
            player.matches = stats.matches || '';
            player.runs = stats.runs || '';
            player.battingAvg = stats.battingAvg || '';
            player.highestScore = stats.highestScore || '';
            player.wickets = stats.wickets || '';
            player.economy = stats.economy || '';
            player.bestBowling = stats.bestBowling || '';
            // Only fill imageUrl if the Excel didn't already provide one
            if (!player.imageUrl && stats.imageUrl) {
              player.imageUrl = stats.imageUrl;
            }
            // Optional enrichment fields (kept lightweight; safe if undefined)
            if (stats.strikeRate) player.strikeRate = stats.strikeRate;
            fetchedCount++;
          }
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Stats fetching complete: ${fetchedCount}/${playersNeedingStats.length} in ${duration}s\n`);
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
          captain: null,
          captainAmount: 0
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
  },

  // Upload player image
  async uploadPlayerImage(req, res) {
    try {
      const { playerId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      const { buffer, mimetype } = req.file;

      // Validate image mimetype
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedImageTypes.includes(mimetype)) {
        return res.status(400).json({ 
          error: 'Invalid image type. Only JPEG, PNG, and WebP are allowed.' 
        });
      }

      console.log(`Uploading image for player ${playerId}, size: ${buffer.length} bytes`);

      // Upload to storage (Supabase or memory)
      const imageUrl = await imageStorage.uploadPlayerImage(buffer, playerId, mimetype);

      // Update player data with image URL
      const players = dataService.getPlayers();
      const playerIndex = players.findIndex(p => p.id === playerId);
      
      if (playerIndex !== -1) {
        players[playerIndex].imageUrl = imageUrl;
        dataService.setPlayers(players);
        socketService.emit('playersUpdated', players);
      }

      res.json({ 
        message: 'Image uploaded successfully',
        imageUrl,
        playerId
      });

    } catch (error) {
      console.error('Error uploading player image:', error);
      res.status(500).json({ 
        error: error.message || 'Error uploading player image' 
      });
    }
  }
};

// Export multer upload middleware
playerController.uploadMiddleware = upload.single('playerFile');

module.exports = playerController;
