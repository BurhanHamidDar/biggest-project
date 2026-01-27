const express = require('express');
const router = express.Router();
const remarkController = require('../controllers/remarkController');

router.post('/', remarkController.createRemark);
router.get('/:student_id', remarkController.getStudentRemarks);

module.exports = router;
