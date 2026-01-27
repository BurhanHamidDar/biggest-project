const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

const { restrictTo } = require('../middleware/rbacMiddleware');

router.post('/', restrictTo('admin'), subjectController.createSubject);
router.get('/', subjectController.getSubjects);
router.delete('/:id', restrictTo('admin'), subjectController.deleteSubject);

module.exports = router;
