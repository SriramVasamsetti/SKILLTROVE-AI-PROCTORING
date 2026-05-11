const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/user.controller');

const router = express.Router();
router.use(authMiddleware(true));

router.get('/me', ctrl.getProfile);
router.patch('/me', ctrl.updateProfile);
router.patch('/me/password', ctrl.updatePassword);
router.delete('/me', ctrl.deleteAccount);

module.exports = router;
