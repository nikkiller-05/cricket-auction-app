const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifySuperAdmin, verifyAdmin, verifyRegistrationManager } = require('../middlewares/authMiddleware');

// Login route (public)
router.post('/login', authController.login);
// Forgot password request (public) — emails a reset link or flags a request for the super-admin.
router.post('/forgot-password', authController.forgotPassword);
// Complete a password reset via emailed token (public).
router.post('/reset-password/confirm', authController.resetPasswordWithToken);

// Sub-admin management (super-admin and admin only)
router.post('/sub-admin', verifyAdmin, authController.createSubAdmin);
router.get('/sub-admins', verifyAdmin, authController.getSubAdmins);
router.delete('/sub-admin/:id', verifySuperAdmin, authController.deleteSubAdmin);

// Organizer accounts (super-admin only)
router.post('/organizer', verifySuperAdmin, authController.createOrganizer);
router.get('/organizers', verifySuperAdmin, authController.getOrganizers);
router.delete('/organizer/:id', verifySuperAdmin, authController.deleteOrganizer);

// Password management
router.post('/change-password', verifyRegistrationManager, authController.changePassword);
router.post('/users/:id/reset-password', verifySuperAdmin, authController.resetUserPassword);

module.exports = router;
