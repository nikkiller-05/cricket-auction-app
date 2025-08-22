const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');

// Download routes (public access for results)
router.get('/download-results', downloadController.downloadExcel);
router.get('/download-results-csv', downloadController.downloadCSV);

module.exports = router;
