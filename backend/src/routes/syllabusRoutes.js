const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');

const { restrictTo } = require('../middleware/rbacMiddleware');

router.post('/', restrictTo('admin', 'teacher'), syllabusController.createSyllabus);
router.get('/', syllabusController.getSyllabus);
router.delete('/:id', restrictTo('admin'), syllabusController.deleteSyllabus);

module.exports = router;
