const express = require('express');
const { authMiddleware, requireRoles } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/quiz.controller');

const router = express.Router();

/** 
 * PUBLIC / AUTHENTICATED ROUTES 
 */
router.get('/', authMiddleware(true), ctrl.listQuizzes);
router.get('/mine/attempts', authMiddleware(true), ctrl.listMyAttempts);
router.post('/:id/submit', authMiddleware(true), ctrl.submitQuiz);
router.get('/:id', authMiddleware(false), ctrl.getQuiz);

/**
 * AI GENERATION (Shared for Practice and Faculty Assignment)
 * Logic inside controller handles "assignedBy" logic based on role.
 */
router.post('/generate', authMiddleware(true), ctrl.generateAiQuiz);

/**
 * FACULTY-ONLY COMMANDS (RBAC LOCKED)
 */
router.post(
  '/manual', 
  authMiddleware(true), 
  requireRoles('faculty', 'admin'), 
  ctrl.createManualQuiz
);

router.patch(
  '/:id/archive', 
  authMiddleware(true), 
  requireRoles('faculty', 'admin'), 
  ctrl.archiveQuiz
);

module.exports = router;
