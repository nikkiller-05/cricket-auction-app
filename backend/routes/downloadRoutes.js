const express = require('express');
const { requireAuctionAccess } = require('../middlewares/authMiddleware');
const verifyConfigPermission = requireAuctionAccess('config');

console.log('Download routes file loaded');

// Lazily resolve the controller per request so a load-time error in the
// controller can't take down the whole route table.
const call = (method) => (req, res) => {
  try {
    const downloadController = require('../controllers/downloadController');
    downloadController[method](req, res);
  } catch (error) {
    console.error(`Error in download route (${method}):`, error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Grouped, resource-oriented routes — mounted at /api/downloads.
const router = express.Router();
router.get('/results', call('downloadExcel'));          // Complete report (Excel, all sheets)
router.get('/sale-log', call('downloadSaleLog'));       // Chronological purchase log (Excel)
router.get('/unsold', call('downloadUnsold'));          // Unsold players (Excel)
router.get('/backup', verifyConfigPermission, call('downloadBackup')); // Full snapshot (JSON, admin)

// Back-compat aliases for the old flat paths — mounted at /api.
// Temporary: remove once every client uses /api/downloads/*.
const legacy = express.Router();
legacy.get('/download-results', call('downloadExcel'));
legacy.get('/download-sale-log', call('downloadSaleLog'));
legacy.get('/download-unsold', call('downloadUnsold'));
legacy.get('/download-backup', verifyConfigPermission, call('downloadBackup'));

console.log('Download routes configured');

module.exports = { router, legacy };
