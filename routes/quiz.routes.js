const express = require('express');
const { authMiddleware, requireRoles } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/quiz.controller');

const router = express.Router();

router.get('/', ctrl.listQuizzes);

/** TEMP: public for deadline testing — re-protect with auth before production */
router.post('/generate', ctrl.generateAiQuiz);

router.post(
  '/ai/generate',
  authMiddleware(true),
  requireRoles('faculty', 'admin', 'student'),
  ctrl.generateAiQuiz,
);

router.post('/manual', authMiddleware(true), requireRoles('faculty', 'admin'), ctrl.createManualQuiz);

router.get('/mine/attempts', authMiddleware(true), ctrl.listMyAttempts);

router.patch('/:id/archive', authMiddleware(true), ctrl.archiveQuiz);
router.post('/:id/submit', authMiddleware(true), ctrl.submitQuiz);

/** Declare parametric GET last — avoids treating "manual" / "mine" segments as Mongo ids */
router.get('/:id', authMiddleware(false), ctrl.getQuiz);

module.exports = router;
