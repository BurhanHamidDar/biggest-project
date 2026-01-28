const supabase = require('../config/supabaseClient');

// --- EXAMS (Term/Name) ---
exports.createExam = async (req, res) => {
    try {
        const { name, start_date, end_date, academic_year_id } = req.body;
        const { data, error } = await supabase
            .from('exams')
            .insert([{ name, start_date, end_date, academic_year_id }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getExams = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .order('start_date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('exams')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('exams')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- CLASS TESTS (Teacher Created) ---
exports.createClassTest = async (req, res) => {
    try {
        const { name, start_date, academic_year_id } = req.body;
        const teacher_id = req.user.id; // From auth

        // Create the exam as a 'class_test'
        const { data, error } = await supabase
            .from('exams')
            .insert([{
                name,
                start_date,
                end_date: start_date, // Usually 1 day
                academic_year_id,
                type: 'class_test',
                created_by: teacher_id
            }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getClassTests = async (req, res) => {
    try {
        const teacher_id = req.user.id;
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('created_by', teacher_id)
            .eq('type', 'class_test')
            .order('start_date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- EXAM SUBJECTS (Configuration) ---
exports.addExamSubject = async (req, res) => {
    try {
        const { exam_id, subject_id, class_id, max_marks, pass_marks, exam_date } = req.body;
        const { data, error } = await supabase
            .from('exam_subjects')
            .insert([{ exam_id, subject_id, class_id, max_marks, pass_marks, exam_date }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getExamSubjects = async (req, res) => {
    try {
        const { exam_id, class_id } = req.query;
        let query = supabase
            .from('exam_subjects')
            .select(`
                id, max_marks, pass_marks, exam_date, subject_id,
                subjects (name, code),
                classes (name)
            `)
            .eq('exam_id', exam_id);

        if (class_id) query = query.eq('class_id', class_id);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- TEACHER: ENTER MARKS (Strict Separation) ---
exports.enterMarks = async (req, res) => {
    try {
        const { exam_subject_id, marks_data, teacher_id } = req.body;
        // marks_data: [{ student_id, marks_obtained, remarks }]

        if (!exam_subject_id || !marks_data) return res.status(400).json({ error: 'Missing data' });

        // SECURITY CHECK: Enforce Teacher Assignment
        if (teacher_id) {
            // 1. Get Context
            const { data: examSubject, error: esErr } = await supabase
                .from('exam_subjects')
                .select('class_id, subject_id')
                .eq('id', exam_subject_id)
                .single();

            if (esErr || !examSubject) return res.status(404).json({ error: 'Exam Subject not found' });

            // 2. Validate Teacher is assigned to this Class+Subject
            // We check if the teacher is assigned to AT LEAST ONE section of this class for this subject.
            // If strictly section-based, we would need to check each student's section vs teacher's sections.
            // For now, Class+Subject validation is a strong baseline.

            const { data: assignment } = await supabase
                .from('subject_teachers')
                .select('id')
                .eq('teacher_id', teacher_id)
                .eq('class_id', examSubject.class_id)
                .eq('subject_id', examSubject.subject_id)
                .maybeSingle();

            if (!assignment) {
                // Check if they are a Class Teacher (HR) - HRs might have override? 
                // SDD says "Subjects assigned to them". So we stick to subject_teachers.
                return res.status(403).json({ error: 'You are not assigned to teach this subject.' });
            }
        }

        const upsertData = marks_data.map(m => ({
            exam_subject_id,
            student_id: m.student_id,
            marks_obtained: m.marks_obtained,
            remarks: m.remarks
        }));

        // Upsert Marks
        const { data, error } = await supabase
            .from('marks')
            .upsert(upsertData, { onConflict: 'exam_subject_id, student_id' })
            .select();

        if (error) throw error;

        // NOTIFICATION TRIGGER
        try {
            // Get Subject Name for context
            const { data: sub } = await supabase.from('exam_subjects').select('subjects(name)').eq('id', exam_subject_id).single();
            const subjectName = sub?.subjects?.name || 'Class Test';

            const studentIds = marks_data.map(m => m.student_id);
            // Batch fetch tokens
            const { data: tokens } = await supabase.from('push_tokens').select('token').in('user_id', studentIds);

            if (tokens && tokens.length > 0) {
                const tokenList = tokens.map(t => t.token);
                const { sendPushList } = require('../utils/expoPush');

                await sendPushList(
                    tokenList,
                    'New Marks Added 📝',
                    `Your marks for ${subjectName} have been updated.`,
                    { type: 'marks_update', exam_subject_id }
                );
            }
        } catch (notifError) {
            console.error('Notification Error (Marks):', notifError);
        }

        res.json({ message: 'Marks saved successfully', count: data.length });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMarks = async (req, res) => {
    try {
        const { exam_subject_id } = req.query;
        const { data, error } = await supabase
            .from('marks')
            .select(`
                student_id, marks_obtained, remarks,
                students: student_id (
                    admission_no, roll_no,
                    profiles: profiles!profile_id (full_name) 
                )
            `)
            .eq('exam_subject_id', exam_subject_id);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.addClassTestSubject = async (req, res) => {
    try {
        const { exam_id, subject_id, class_id, max_marks, pass_marks, exam_date } = req.body;
        const teacher_id = req.user.id;

        // Verify ownership of the exam
        const { data: exam } = await supabase.from('exams').select('created_by').eq('id', exam_id).single();
        if (!exam || exam.created_by !== teacher_id) {
            return res.status(403).json({ error: 'You can only edit your own class tests' });
        }

        const { data, error } = await supabase
            .from('exam_subjects')
            .insert([{ exam_id, subject_id, class_id, max_marks, pass_marks, exam_date }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- ADMIN: MARKSHEET MANAGEMENT ---

// 1. Get Students Pending Marksheet (Marks entered but no file)
exports.getPendingMarksheets = async (req, res) => {
    try {
        const { exam_id, class_id } = req.query;
        if (!exam_id || !class_id) return res.status(400).json({ error: 'Exam ID and Class ID required' });

        // A. Get All Students in Class
        const { data: students, error: sErr } = await supabase
            .from('students')
            .select('profile_id, admission_no, roll_no, profiles(full_name)')
            .eq('class_id', class_id)
            .is('deleted_at', null);

        if (sErr) throw sErr;

        // B. Get Existing Marksheets
        const { data: marksheets, error: mErr } = await supabase
            .from('student_marksheets')
            .select('student_id, file_url')
            .eq('exam_id', exam_id);

        if (mErr) throw mErr;

        // C. Check Marks Completeness (Optional but good)
        // For now, simpler: Return list of students identifying who has a file vs not.

        const marksheetMap = new Map(marksheets.map(m => [m.student_id, m.file_url]));

        const report = students.map(s => ({
            student_id: s.profile_id,
            name: s.profiles.full_name,
            admission_no: s.admission_no,
            has_marksheet: marksheetMap.has(s.profile_id),
            file_url: marksheetMap.get(s.profile_id) || null
        }));

        res.json(report);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Upload/Attach Marksheet (Admin Only)
exports.uploadMarksheet = async (req, res) => {
    try {
        const { student_id, exam_id, file_url } = req.body;
        // User requesting this must be Admin (Middleware usually handles, taking safe route)

        if (!student_id || !exam_id || !file_url) return res.status(400).json({ error: 'Missing fields' });

        const { data, error } = await supabase
            .from('student_marksheets')
            .upsert([{
                student_id,
                exam_id,
                file_url
            }], { onConflict: 'student_id, exam_id' })
            .select()
            .single();

        if (error) throw error;

        // NOTIFICATION TRIGGER
        try {
            const { sendPush } = require('../utils/expoPush');
            const { data: tokens } = await supabase.from('push_tokens').select('token').eq('user_id', student_id);

            if (tokens && tokens.length > 0) {
                // Send to all devices of that student
                const tokenList = tokens.map(t => t.token);
                const { sendPushList } = require('../utils/expoPush');
                await sendPushList(tokenList, 'Marksheet Available 📄', 'Your exam marksheet has been uploaded.', { exam_id });
            }
        } catch (notifError) {
            console.error('Notification Error (Marksheet):', notifError);
        }
        res.json({ message: 'Marksheet linked successfully', data });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- STUDENT: VIEW RESULT (Fee Locked) ---
exports.getStudentResult = async (req, res) => {
    try {
        const { student_id, exam_id } = req.query;
        if (!student_id || !exam_id) return res.status(400).json({ error: 'Data required' });

        // 1. CHECK FEE STATUS (Strict Lock)
        const { data: student } = await supabase.from('students').select('class_id').eq('profile_id', student_id).single();
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Check Fees
        const { data: fees } = await supabase.from('class_fee_structures').select('id, amount').eq('class_id', student.class_id);

        let isDefaulting = false;
        if (fees && fees.length > 0) {
            const { data: payments } = await supabase.from('student_fee_payments').select('class_fee_structure_id, amount_paid').eq('student_id', student_id);

            for (const fee of fees) {
                const paid = payments
                    .filter(p => p.class_fee_structure_id === fee.id)
                    .reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
                if (paid < fee.amount) {
                    isDefaulting = true;
                    break;
                }
            }
        }

        // 2. Fetch Marksheet linkage
        const { data: marksheet } = await supabase
            .from('student_marksheets')
            .select('file_url')
            .eq('student_id', student_id)
            .eq('exam_id', exam_id)
            .single();

        // 3. Fetch Raw Marks (Always visible? User says "Student will See subject-wise marks... See marksheet download only if fees are paid")
        // Interpretation: Raw marks on screen are Visible. Only Official PDF is locked.

        const { data: startMarks } = await supabase
            .from('marks')
            .select(`
                marks_obtained, remarks,
                exam_subjects!inner (
                    subjects(name, code),
                    max_marks, pass_marks
                )
            `)
            .eq('student_id', student_id)
            .eq('exam_subjects.exam_id', exam_id); // Filter via join

        const processedMarks = startMarks ? startMarks.map(m => ({
            subject: m.exam_subjects.subjects.name,
            code: m.exam_subjects.subjects.code,
            obtained: m.marks_obtained,
            total: m.exam_subjects.max_marks,
            grade: (m.marks_obtained / m.exam_subjects.max_marks) >= 0.35 ? 'Pass' : 'Fail' // Simple logic
        })) : [];

        // 4. Construct Response
        const response = {
            exam_id,
            student_id,
            marks: processedMarks,
            marksheet_url: null,
            locked: false,
            lock_reason: null
        };

        if (isDefaulting) {
            response.locked = true;
            response.lock_reason = "Fees Pending";
            // No URL sent
        } else {
            response.marksheet_url = marksheet?.file_url || null;
        }

        res.json(response);

    } catch (error) {
        console.error('Result Error:', error);
        res.status(500).json({ error: error.message });
    }
};
// --- ADMIN: CONSOLIDATED RESULTS GRID ---
exports.getExamResultsGrid = async (req, res) => {
    try {
        const { exam_id, class_id, section_id } = req.query;
        if (!exam_id || !class_id || !section_id) {
            return res.status(400).json({ error: 'Exam ID, Class ID, and Section ID are required' });
        }

        // 1. Fetch Students
        const { data: students, error: sErr } = await supabase
            .from('students')
            .select('profile_id, admission_no, roll_no, profiles(full_name)')
            .eq('class_id', class_id)
            .eq('section_id', section_id)
            .is('deleted_at', null)
            .order('roll_no', { ascending: true });

        if (sErr) throw sErr;

        // 2. Fetch Exam Subjects
        const { data: subjects, error: subErr } = await supabase
            .from('exam_subjects')
            .select('id, max_marks, pass_marks, subject_id, subjects(name, code)')
            .eq('exam_id', exam_id)
            .eq('class_id', class_id); // Ensure strictly for this class

        if (subErr) throw subErr;

        // 3. Fetch All Marks for these subjects
        // We need to filter marks by exam_subject_id IN (subjects.map(id)) AND student_id IN (students.map(id))
        const subjectIds = subjects.map(s => s.id);
        const studentIds = students.map(s => s.profile_id);

        let marksMap = {}; // { student_id: { subject_id: { obtained, grade } } }

        if (subjectIds.length > 0 && studentIds.length > 0) {
            const { data: marks, error: mErr } = await supabase
                .from('marks')
                .select('student_id, exam_subject_id, marks_obtained, grade')
                .in('exam_subject_id', subjectIds)
                .in('student_id', studentIds);

            if (mErr) throw mErr;

            // Build Map
            marks.forEach(m => {
                if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
                marksMap[m.student_id][m.exam_subject_id] = {
                    obtained: m.marks_obtained,
                    grade: m.grade
                };
            });
        }

        // 4. Fetch Existing Marksheets (Upload Status)
        const { data: marksheets, error: msErr } = await supabase
            .from('student_marksheets')
            .select('student_id, file_url')
            .eq('exam_id', exam_id)
            .in('student_id', studentIds);

        if (msErr) throw msErr;

        const marksheetMap = new Map(marksheets?.map(m => [m.student_id, m.file_url]));

        // 5. Construct Grid Response
        const gridData = {
            subjects: subjects.map(s => ({
                id: s.id, // exam_subject_id
                name: s.subjects.name,
                code: s.subjects.code,
                maxMarks: s.max_marks
            })),
            students: students.map(s => ({
                id: s.profile_id,
                name: s.profiles.full_name,
                rollNo: s.roll_no || s.admission_no,
                marks: marksMap[s.profile_id] || {},
                marksheetUrl: marksheetMap.get(s.profile_id) || null
            }))
        };

        res.json(gridData);

    } catch (error) {
        console.error('Grid Error:', error);
        res.status(500).json({ error: error.message });
    }
};
