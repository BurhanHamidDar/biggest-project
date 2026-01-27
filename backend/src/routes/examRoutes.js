const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middleware/authMiddleware'); // NEW
const { restrictTo } = require('../middleware/rbacMiddleware');

// Exams
router.post('/', restrictTo('admin'), examController.createExam);
router.get('/', examController.getExams);
router.put('/:id', restrictTo('admin'), examController.updateExam);
router.delete('/:id', restrictTo('admin'), examController.deleteExam);

// Class Tests
router.post('/class-test', restrictTo('teacher'), examController.createClassTest);
router.get('/class-tests', restrictTo('teacher'), examController.getClassTests);

// Class Tests
router.post('/class-test', restrictTo('teacher'), examController.createClassTest);
router.get('/class-tests', restrictTo('teacher'), examController.getClassTests);
router.post('/class-test-subject', restrictTo('teacher'), examController.addClassTestSubject);

// Exam Subjects (Configuration)
router.post('/subjects', restrictTo('admin'), examController.addExamSubject);
router.get('/subjects', examController.getExamSubjects);

// Marks
router.post('/marks', restrictTo('admin', 'teacher'), examController.enterMarks);
router.get('/marks', examController.getMarks);

// Admin: Marksheets
router.get('/results/grid', authMiddleware, examController.getExamResultsGrid); // NEW
router.get('/marksheets/pending', restrictTo('admin'), examController.getPendingMarksheets);
router.post('/marksheets/upload', restrictTo('admin'), examController.uploadMarksheet);

// Student: View Result (Fee Locked)
router.get('/student-result', examController.getStudentResult);

module.exports = router;
