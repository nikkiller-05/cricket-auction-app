const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/registrationController');
const {
  verifySuperAdmin,
  verifyConfigPermission,
  verifyRegistrationManager,
} = require('../middlewares/authMiddleware');

// ---- Public (no auth) ----
router.get('/public/:slug', ctrl.getPublicEvent);
router.post('/public/:slug/submit', ctrl.uploadFields, ctrl.submitRegistration);

// ---- Events ----
router.get('/events', verifyRegistrationManager, ctrl.listEvents);
router.post('/events', verifySuperAdmin, ctrl.uploadQr, ctrl.createEvent);
router.put('/events/:id', verifySuperAdmin, ctrl.uploadQr, ctrl.updateEvent);
router.delete('/events/:id', verifySuperAdmin, ctrl.deleteEvent);

// ---- Registrations review (super-admin / admin / organizer) ----
router.get('/events/:eventId/registrations', verifyRegistrationManager, ctrl.listRegistrations);
router.patch('/registrations/:id/status', verifyRegistrationManager, ctrl.setRegistrationStatus);
router.delete('/registrations/:id', verifyRegistrationManager, ctrl.deleteRegistration);

// ---- Import verified players into the live auction (admin / super-admin) ----
router.post('/events/:eventId/import-to-auction', verifyConfigPermission, ctrl.importToAuction);

module.exports = router;
