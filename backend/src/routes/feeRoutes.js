const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');

const { restrictTo } = require('../middleware/rbacMiddleware');

// Configuration
router.post('/types', restrictTo('admin'), feeController.createFeeType);
router.get('/types', restrictTo('admin'), feeController.getFeeTypes); // Admin only?

router.post('/structure', restrictTo('admin'), feeController.createFeeStructure);
router.get('/structure', restrictTo('admin'), feeController.getFeeStructure);

// Payments & Dues
router.post('/payment', restrictTo('admin'), feeController.recordPayment);
router.get('/status', feeController.getStudentFeeStatus); // Public/Auth for Parents

// Manual Status Update (HR/Admin)
// Manual Status Update (HR/Admin)
router.put('/status', feeController.updateFeeStatus);

module.exports = router;
