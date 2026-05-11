const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/report.controller');

const router = express.Router();
router.use(authMiddleware(true));

router.get('/attempt/:attemptId/pdf', ctrl.pdfReport);
router.get('/download', ctrl.pdfDownload);

module.exports = router;
