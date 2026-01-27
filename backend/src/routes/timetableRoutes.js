const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

const { restrictTo } = require('../middleware/rbacMiddleware');

router.post('/', restrictTo('admin'), timetableController.createTimetableEntry);
router.get('/', timetableController.getTimetable);
router.delete('/:id', restrictTo('admin'), timetableController.deleteTimetableEntry);
// router.put('/:id', timetableController.updateTimetableEntry); // To be added

module.exports = router;
