const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Public — no auth. Anyone visiting the homepage can leave a star rating.
router.post('/', feedbackController.submit);

module.exports = router;
