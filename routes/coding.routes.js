const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/coding.controller');

const router = express.Router();
router.use(authMiddleware(true));

router.post('/submit', ctrl.submitCoding);

module.exports = router;
