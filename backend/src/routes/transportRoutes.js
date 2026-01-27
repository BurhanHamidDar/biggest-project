const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const { restrictTo } = require('../middleware/rbacMiddleware');

// Mobile App Route
router.get('/my-bus', transportController.getMyBus);

// Admin Routes (Buses)
router.post('/buses', restrictTo('admin'), transportController.createBus);
router.get('/buses', transportController.getBuses);
router.get('/buses/:id/passengers', transportController.getBusPassengers); // Maybe restrict to admin/teacher?
router.delete('/buses/:id', restrictTo('admin'), transportController.deleteBus);

// Admin Routes (Drivers)
router.post('/drivers', restrictTo('admin'), transportController.createDriver);
router.get('/drivers', transportController.getDrivers);
router.put('/drivers/:id', restrictTo('admin'), transportController.updateDriver);
router.delete('/drivers/:id', restrictTo('admin'), transportController.deleteDriver);

// Assignments
router.post('/assign', restrictTo('admin'), transportController.assignStudentToBus);

module.exports = router;
