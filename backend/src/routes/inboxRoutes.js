const express = require('express');
const router = express.Router();
const inboxController = require('../controllers/inboxController');
const requireAuth = require('../middleware/authMiddleware');

router.use(requireAuth); // All inbox routes require login

router.get('/', inboxController.getInbox);
router.patch('/:id/read', inboxController.markAsRead);
router.patch('/read-all', inboxController.markAllAsRead);

module.exports = router;
