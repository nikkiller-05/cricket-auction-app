const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifySuperAdmin, verifyAdmin } = require('../middlewares/authMiddleware');

// Login route (public)
router.post('/login', (req, res, next) => {
    console.log('Login route hit with body:', req.body);
    authController.login(req, res, next);
  });

// Sub-admin management (super-admin and admin only)
router.post('/sub-admin', verifyAdmin, authController.createSubAdmin);
router.get('/sub-admins', verifyAdmin, authController.getSubAdmins);
router.delete('/sub-admin/:id', verifySuperAdmin, authController.deleteSubAdmin);

module.exports = router;
