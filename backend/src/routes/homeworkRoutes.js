const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');

router.post('/', homeworkController.createHomework);
router.get('/', homeworkController.getHomework);
router.delete('/:id', homeworkController.deleteHomework);

module.exports = router;
