const express = require('express');
const router = express.Router();
const studentNotesController = require('../controllers/studentNotesController');
const authMiddleware = require('../middleware/authMiddleware');

// Base path: /api/student-notes

// Create a new note (Protected, Role checked in controller)
router.post('/', authMiddleware, studentNotesController.createNote);

// Get notes by student ID
router.get('/by-student/:studentId', authMiddleware, studentNotesController.getNotesByStudent);

// Delete a note
router.delete('/:id', authMiddleware, studentNotesController.deleteNote);

module.exports = router;
