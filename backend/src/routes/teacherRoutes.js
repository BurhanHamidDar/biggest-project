const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

const { restrictTo, protect } = require('../middleware/rbacMiddleware');
const authMiddleware = require('../middleware/authMiddleware'); // Standard auth

// Mobile App Route
router.get('/me', authMiddleware, teacherController.getMyProfile);
router.get('/my-students', authMiddleware, teacherController.getMyStudents);
router.get('/students/:id', authMiddleware, teacherController.getStudentDetails); // NEW

// Admin Routes
router.post('/', restrictTo('admin'), teacherController.createTeacher);
router.get('/', teacherController.getTeachers); // Students might need this? Or just public?
router.put('/:id', restrictTo('admin'), teacherController.updateTeacher);
router.delete('/:id', restrictTo('admin'), teacherController.deleteTeacher);

module.exports = router;
