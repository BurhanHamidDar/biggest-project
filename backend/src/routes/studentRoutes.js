const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

const { restrictTo } = require('../middleware/rbacMiddleware');

// Mobile App Route
router.get('/me', studentController.getMyProfile);
router.get('/marksheet', studentController.getMarksheet);

// Admin Routes
router.post('/', restrictTo('admin'), studentController.createStudent);
router.get('/', studentController.getStudents); // Teachers need this too
router.put('/:id', restrictTo('admin'), studentController.updateStudent);
router.delete('/:id', restrictTo('admin'), studentController.deleteStudent);

module.exports = router;
