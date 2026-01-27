const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

const { restrictTo } = require('../middleware/rbacMiddleware');

router.post('/', restrictTo('admin'), noticeController.createNotice);
router.get('/', noticeController.getNotices);
router.delete('/:id', restrictTo('admin'), noticeController.deleteNotice);

module.exports = router;
