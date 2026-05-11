const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/proctoring.controller');

const router = express.Router();
router.use(authMiddleware(true));

router.post('/events', ctrl.ingestEvents);
router.post('/webcam-alert', ctrl.webcamDeniedAlert);
router.get('/session/:sessionId', ctrl.sessionSummary);

module.exports = router;
