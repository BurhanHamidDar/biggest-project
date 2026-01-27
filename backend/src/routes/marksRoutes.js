const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const { restrictTo } = require('../middleware/rbacMiddleware');

router.post('/', restrictTo('admin', 'teacher'), marksController.createTest); // Create Draft
router.get('/', restrictTo('admin', 'teacher'), marksController.getTests); // List History
router.get('/:id', restrictTo('admin', 'teacher'), marksController.getTestDetails); // Details
router.put('/:id', restrictTo('admin', 'teacher'), marksController.updateTest); // Update/Finalize
router.delete('/:id', restrictTo('admin', 'teacher'), marksController.deleteTest); // Delete Draft

module.exports = router;
