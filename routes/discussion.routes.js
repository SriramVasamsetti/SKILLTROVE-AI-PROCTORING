const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/discussion.controller');

const router = express.Router();

router.get('/', ctrl.listDiscussions);
router.get('/:id', ctrl.getDiscussion);

router.post('/', authMiddleware(true), ctrl.createDiscussion);
router.delete('/:id', authMiddleware(true), ctrl.deleteDiscussion);
router.post('/:id/comments', authMiddleware(true), ctrl.commentOnThread);
router.post('/:id/posts', authMiddleware(true), ctrl.addQA);
router.post('/:id/posts/:postId/replies', authMiddleware(true), ctrl.replyToQA);

module.exports = router;
