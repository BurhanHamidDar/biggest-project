// Force Deployment Update
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Auth Middleware
const authMiddleware = require('./middleware/authMiddleware');
app.use(authMiddleware);

// Routes
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const transportRoutes = require('./routes/transportRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const examRoutes = require('./routes/examRoutes');
const feeRoutes = require('./routes/feeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const remarkRoutes = require('./routes/remarkRoutes');

app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
    res.send('School Management System API is running');
});

// ... (health check)

app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/allocations', require('./routes/allocationRoutes'));
app.use('/api/homework', homeworkRoutes);
app.use('/api/marks', require('./routes/marksRoutes')); // Added Class Marks Module
app.use('/api/remarks', remarkRoutes);

const timetableRoutes = require('./routes/timetableRoutes');
app.use('/api/timetable', timetableRoutes);
app.use('/api/student-notes', require('./routes/studentNotesRoutes'));
app.use('/api/inbox', require('./routes/inboxRoutes'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
