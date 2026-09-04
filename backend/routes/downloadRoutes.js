const express = require('express');
const router = express.Router();
const { verifyConfigPermission } = require('../middlewares/authMiddleware');

console.log('Download routes file loaded');

// Complete auction report (Excel, all sheets incl. Sale Log)
router.get('/download-results', (req, res) => {
  try {
    const downloadController = require('../controllers/downloadController');
    downloadController.downloadExcel(req, res);
  } catch (error) {
    console.error('Error requiring downloadController:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Sale log (Excel, chronological purchase record)
router.get('/download-sale-log', (req, res) => {
  try {
    const downloadController = require('../controllers/downloadController');
    downloadController.downloadSaleLog(req, res);
  } catch (error) {
    console.error('Error in sale log route:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Full auction backup (JSON) - admin/super-admin only
router.get('/download-backup', verifyConfigPermission, (req, res) => {
  try {
    const downloadController = require('../controllers/downloadController');
    downloadController.downloadBackup(req, res);
  } catch (error) {
    console.error('Error in backup route:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

console.log('Download routes configured');

module.exports = router;
