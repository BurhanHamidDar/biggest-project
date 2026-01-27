const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

const { restrictTo } = require('../middleware/rbacMiddleware');

router.post('/', restrictTo('admin'), classController.createClass);
router.get('/', classController.getClasses);
router.delete('/:id', restrictTo('admin'), classController.deleteClass);

router.post('/section', restrictTo('admin'), classController.createSection);

module.exports = router;
