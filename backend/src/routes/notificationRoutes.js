const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authMiddleware, notificationController.registerToken);
router.post('/test', authMiddleware, notificationController.sendTestNotification); // Remove in prod or restrict to admin

module.exports = router;
