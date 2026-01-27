const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Strict Logic Routes
router.get('/status', attendanceController.getAttendanceStatus);
router.post('/finalize', attendanceController.finalizeAttendance);
router.get('/history', attendanceController.getRecentAttendance);

router.post('/', attendanceController.markAttendance);
router.get('/', attendanceController.getAttendance);
router.get('/student-report', attendanceController.getStudentAttendanceReport);

module.exports = router;
