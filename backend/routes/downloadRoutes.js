const express = require('express');
const router = express.Router();

console.log('Download routes file loaded');

// Test route that tries to require downloadController safely
router.get('/download-results', (req, res) => {
  try {
    const downloadController = require('../controllers/downloadController');
    downloadController.downloadExcel(req, res);
  } catch (error) {
    console.error('Error requiring downloadController:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.get('/download-results-csv', (req, res) => {
  try {
    const downloadController = require('../controllers/downloadController');
    downloadController.downloadCSV(req, res);
  } catch (error) {
    console.error('Error requiring downloadController for CSV:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Test route for team squads with safe require
router.get('/download-team-squads', (req, res) => {
  console.log('Team squads route hit!');
  try {
    const downloadController = require('../controllers/downloadController');
    downloadController.downloadTeamSquads(req, res);
  } catch (error) {
    console.error('Error in team squads route:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Test route for auction summary with safe require
router.get('/download-auction-summary', (req, res) => {
  console.log('Auction summary route hit!');
  try {
    const downloadController = require('../controllers/downloadController');
    downloadController.downloadAuctionSummary(req, res);
  } catch (error) {
    console.error('Error in auction summary route:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

console.log('Download routes configured');

module.exports = router;
