const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/heatmap', authMiddleware(true), ctrl.myHeatmap);
router.get('/history', authMiddleware(true), ctrl.quizHistory);

router.get('/leaderboard', authMiddleware(false), ctrl.leaderboard);
router.post('/leaderboard/rebuild', authMiddleware(true), ctrl.refreshLeaderboard);
router.get('/faculty/students', authMiddleware(true), ctrl.getFacultyStudentAnalytics);

module.exports = router;
