const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
});

router.post('/signup', limiter, ctrl.signup);
router.post('/login', limiter, ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/verify-email/:token', ctrl.verifyEmail);

module.exports = router;
