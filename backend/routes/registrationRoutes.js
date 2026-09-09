const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/registrationController');
const {
  verifyConfigPermission,
  verifyRegistrationManager,
} = require('../middlewares/authMiddleware');

// ---- Public (no auth) ----
router.get('/public/:slug', ctrl.getPublicEvent);
router.post('/public/:slug/submit', ctrl.uploadFields, ctrl.submitRegistration);

// ---- Events (super-admin / admin manage all; organizers manage their own) ----
router.get('/events', verifyRegistrationManager, ctrl.listEvents);
router.post('/events', verifyRegistrationManager, ctrl.uploadEventFiles, ctrl.createEvent);
router.put('/events/:id', verifyRegistrationManager, ctrl.uploadEventFiles, ctrl.updateEvent);
router.delete('/events/:id', verifyRegistrationManager, ctrl.deleteEvent);

// ---- Registrations review (super-admin / admin / organizer) ----
router.get('/events/:eventId/registrations', verifyRegistrationManager, ctrl.listRegistrations);
router.get('/events/:eventId/export', verifyRegistrationManager, ctrl.exportRegistrations);
router.patch('/registrations/:id/status', verifyRegistrationManager, ctrl.setRegistrationStatus);
router.delete('/registrations/:id', verifyRegistrationManager, ctrl.deleteRegistration);

// ---- Import verified players into the live auction (admin / super-admin) ----
router.post('/events/:eventId/import-to-auction', verifyConfigPermission, ctrl.importToAuction);

module.exports = router;
