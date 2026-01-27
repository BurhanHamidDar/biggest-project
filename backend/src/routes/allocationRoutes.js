const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const { restrictTo } = require('../middleware/rbacMiddleware');

// All allocation routes are Admin Only
router.post('/class-teacher', restrictTo('admin'), allocationController.assignClassTeacher);
router.post('/subject-teacher', restrictTo('admin'), allocationController.assignSubjectTeacher);
router.get('/', allocationController.getClassAllocations);
router.delete('/subject-teacher/:id', restrictTo('admin'), allocationController.removeSubjectTeacher);

module.exports = router;
