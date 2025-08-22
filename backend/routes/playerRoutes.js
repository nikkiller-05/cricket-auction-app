const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { verifyConfigPermission } = require('../middlewares/authMiddleware');

// Upload players file (admin/super-admin only)
router.post('/upload', playerController.uploadMiddleware, verifyConfigPermission, playerController.uploadPlayers);

// Validate file before upload
router.post('/validate', playerController.uploadMiddleware, playerController.validateFile);

// Clear auction data (admin/super-admin only)
router.delete('/clear', verifyConfigPermission, playerController.clearAuction);

module.exports = router;
