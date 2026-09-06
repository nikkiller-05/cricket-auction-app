const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifySuperAdmin, verifyAdmin } = require('../middlewares/authMiddleware');

// Login route (public)
router.post('/login', authController.login);

// Sub-admin management (super-admin and admin only)
router.post('/sub-admin', verifyAdmin, authController.createSubAdmin);
router.get('/sub-admins', verifyAdmin, authController.getSubAdmins);
router.delete('/sub-admin/:id', verifySuperAdmin, authController.deleteSubAdmin);

// Organizer accounts (super-admin only)
router.post('/organizer', verifySuperAdmin, authController.createOrganizer);
router.get('/organizers', verifySuperAdmin, authController.getOrganizers);

module.exports = router;
