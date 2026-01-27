const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { restrictTo } = require('../middleware/rbacMiddleware');

// Public / Semi-Public Routes
router.get('/public', settingsController.getPublicSettings); // Used by Login screen

// Admin Routes (Settings)
router.get('/', restrictTo('admin'), settingsController.getSettings);
router.put('/', restrictTo('admin'), settingsController.updateSettings);

// Admin Routes (Account Control)
router.get('/accounts/disabled', restrictTo('admin'), settingsController.getDisabledAccounts);
router.post('/accounts/disable', restrictTo('admin'), settingsController.disableAccount);
router.post('/accounts/enable', restrictTo('admin'), settingsController.enableAccount);

module.exports = router;
