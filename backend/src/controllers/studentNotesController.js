const supabase = require('../config/supabaseClient');
const notificationController = require('./notificationController');

// Create a new note
const createNote = async (req, res) => {
    try {
        const { student_id, note_text, note_type } = req.body;
        const teacher_id = req.user.id; // From authMiddleware

        // 1. Validation
        if (!student_id || !note_text) {
            return res.status(400).json({ error: 'Student ID and Note Text are required' });
        }
        if (note_text.length > 500) {
            return res.status(400).json({ error: 'Note text must be under 500 characters' });
        }
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Only teachers can add notes' });
        }

        // 2. Insert Note
        const { data: note, error } = await supabase
            .from('student_notes')
            .insert([
                {
                    student_id,
                    teacher_id,
                    note_text,
                    note_type: note_type || 'General'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // 3. Send Notification to Student
        try {
            // Get teacher name for the notification body
            const { data: teacherProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', teacher_id)
                .single();

            const teacherName = teacherProfile?.full_name || 'A teacher';

            await notificationController.sendNotificationToUser(
                student_id,
                'New Teacher Note',
                `${teacherName} has added a new note to your profile.`
            );
        } catch (notifyError) {
            console.error('Failed to send notification for note:', notifyError);
            // Don't fail the request if notification fails
        }

        res.status(201).json(note);

    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
};

// Get notes for a student
const getNotesByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Role Check
        const viewerId = req.user.id;
        const viewerRole = req.user.role;

        // Students can only see their own
        if (viewerRole === 'student' && viewerId !== studentId) {
            return res.status(403).json({ error: 'Unauthorized to view these notes' });
        }

        // Teachers/Admins can view
        if (viewerRole !== 'student' && viewerRole !== 'teacher' && viewerRole !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Fetch notes with Teacher details
        const { data: notes, error } = await supabase
            .from('student_notes')
            .select(`
                *,
                teacher:profiles!student_notes_teacher_id_fkey (
                    full_name,
                    id
                )
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to flatten teacher name
        const formattedNotes = notes.map(note => ({
            ...note,
            teacher_name: note.teacher?.full_name || 'Unknown Teacher'
        }));

        res.status(200).json(formattedNotes);

    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
};

// Delete a note
const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher_id = req.user.id; // From authMiddleware (the requester)

        // 1. Check if note exists and belongs to this teacher
        const { data: note, error: fetchError } = await supabase
            .from('student_notes')
            .select('teacher_id')
            .eq('id', id)
            .single();

        if (fetchError || !note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (note.teacher_id !== teacher_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own notes' });
        }

        // 2. Delete the note
        const { error: deleteError } = await supabase
            .from('student_notes')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        res.status(200).json({ message: 'Note deleted successfully' });

    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note', details: error.message });
    }
};

module.exports = {
    createNote,
    getNotesByStudent,
    deleteNote
};
