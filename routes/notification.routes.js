const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notification.controller');

const router = express.Router();
router.use(authMiddleware(true));

router.get('/', ctrl.mine);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
