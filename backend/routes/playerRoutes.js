const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { verifyConfigPermission } = require('../middlewares/authMiddleware');

// Upload players file (admin/super-admin only)
router.post('/upload', playerController.uploadMiddleware, verifyConfigPermission, playerController.uploadPlayers);

// Upload player image (admin/super-admin only)
router.post('/upload-image/:playerId', playerController.uploadMiddleware, verifyConfigPermission, playerController.uploadPlayerImage);

// Validate file before upload
router.post('/validate', playerController.uploadMiddleware, playerController.validateFile);

// Manual player management (admin/super-admin only)
router.post('/add', verifyConfigPermission, playerController.addPlayer);

// Clear auction data (admin/super-admin only)
// NOTE: keep this specific route BEFORE the parametric '/:id' routes below,
// otherwise DELETE /clear would be captured by DELETE /:id.
router.delete('/clear', verifyConfigPermission, playerController.clearAuction);

// Edit / delete a single player by id (admin/super-admin only)
router.put('/:id', verifyConfigPermission, playerController.updatePlayer);
router.delete('/:id', verifyConfigPermission, playerController.deletePlayer);

module.exports = router;
