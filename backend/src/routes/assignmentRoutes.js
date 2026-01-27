const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

const { restrictTo } = require('../middleware/rbacMiddleware');

// Class Teacher
router.post('/class-teacher', restrictTo('admin'), assignmentController.assignClassTeacher);
router.get('/class-teachers', assignmentController.getClassTeachers); // Maybe public/auth?
router.delete('/class-teacher', restrictTo('admin'), assignmentController.removeClassTeacher);

// Subject Teacher
router.post('/subject-teacher', restrictTo('admin'), assignmentController.assignSubjectTeacher);
router.get('/subject-teachers', assignmentController.getSubjectTeachers); // Maybe public/auth?
router.delete('/subject-teacher/:id', restrictTo('admin'), assignmentController.removeSubjectTeacher);

module.exports = router;
