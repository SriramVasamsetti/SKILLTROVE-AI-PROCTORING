const express = require('express');
const ctrl = require('../controllers/group.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', ctrl.listGroups);
router.post('/', authMiddleware(false), ctrl.createGroup);
router.patch('/:id', authMiddleware(false), ctrl.updateGroup);
router.delete('/:id', authMiddleware(false), ctrl.deleteGroup);

module.exports = router;
