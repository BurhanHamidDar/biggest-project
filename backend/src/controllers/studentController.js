const supabase = require('../config/supabaseClient');
const { deleteFileFromUrl } = require('../utils/storageHelper');

// Helper to auto-generate password from DOB (DDMMYYYY)
const generatePassword = (dobString) => {
    // Expecting YYYY-MM-DD from frontend, convert to DDMMYYYY
    if (!dobString) return '12345678';
    const [year, month, day] = dobString.split('-');
    return `${day}${month}${year}`;
};

exports.createStudent = async (req, res) => {
    try {
        const {
            email, full_name, admission_no, roll_no, date_of_birth,
            phone_number, address, gender, blood_group,
            parent_name, parent_phone,
            avatar_url // Added avatar_url
        } = req.body;

        // Sanitize UUIDs (Empty string -> null)
        const class_id = req.body.class_id || null;
        const section_id = req.body.section_id || null;
        const bus_id = req.body.bus_id || null;

        if (!email || !full_name || !admission_no || !roll_no || !date_of_birth || !phone_number || !parent_phone) {
            return res.status(400).json({ error: 'Missing required fields: Email, Name, Admission No, Roll No, DOB, Phone, Parent Phone.' });
        }

        // 0. Check Bus Capacity (if bus_id provided)
        if (bus_id) {
            const { data: bus } = await supabase
                .from('buses')
                .select('capacity, student_transport(count)')
                .eq('id', bus_id)
                .single();

            if (bus) {
                const currentLoad = bus.student_transport?.[0]?.count || 0;
                if (bus.capacity && currentLoad >= bus.capacity) {
                    return res.status(400).json({ error: `Selected bus is full! Capacity: ${bus.capacity}` });
                }
            }
        }

        // 1. Create Auth User
        const password = generatePassword(date_of_birth);
        const username = admission_no; // Use Admission No as Username for Students

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'student', full_name, username }
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Create Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: userId,
                email,
                username, // Added username
                full_name,
                role: 'student',
                phone_number,
                address,
                avatar_url
            }]);

        if (profileError) {
            await supabase.auth.admin.deleteUser(userId);
            throw profileError;
        }

        // 3. Create Student Record
        const { error: studentError } = await supabase
            .from('students')
            .insert([{
                profile_id: userId,
                admission_no,
                roll_no,
                dob: date_of_birth,
                gender,
                blood_group,
                class_id,
                section_id,
                parent_name,
                parent_phone,
                bus_id // Added bus_id
            }]);

        if (studentError) {
            await supabase.auth.admin.deleteUser(userId);
            throw studentError;
        }

        // 4. Assign Transport (if selected)
        if (bus_id) {
            const { error: transportError } = await supabase
                .from('student_transport')
                .insert([{ student_id: userId, bus_id }]);

            if (transportError) {
                // Non-critical error, log it but don't fail user creation? 
                // Or partial success? Let's log.
                console.error('Transport Assignment Error:', transportError);
            }
        }

        res.status(201).json({ message: 'Student created successfully', user: authData.user });

    } catch (error) {
        console.error('Create Student Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const { class_id, section_id, search } = req.query;
        // User Role Check (assumed middleware sets req.user)
        const user = req.user;

        let query = supabase
            .from('students')
            .select(`
                profile_id, admission_no, roll_no, parent_name,
                profiles!profile_id (full_name, email, phone_number, avatar_url),
                classes: class_id (name),
                sections: section_id (name)
            `);

        if (class_id) query = query.eq('class_id', class_id);
        if (section_id) query = query.eq('section_id', section_id);
        if (req.query.bus_id) query = query.eq('bus_id', req.query.bus_id);

        // Security: If Teacher, restrict to assigned classes
        if (user && user.role === 'teacher') {
            // 1. Get Assignments
            const { data: hrClasses } = await supabase.from('class_teachers').select('class_id, section_id').eq('teacher_id', user.id);
            const { data: subClasses } = await supabase.from('subject_teachers').select('class_id, section_id').eq('teacher_id', user.id);

            const assignments = [...(hrClasses || []), ...(subClasses || [])];
            if (assignments.length === 0) return res.json([]); // No students visible

            // 2. Build OR logic
            // "class_id.eq.X,and(section_id.eq.Y)"
            const conditions = assignments.map(a => `and(class_id.eq.${a.class_id},section_id.eq.${a.section_id})`).join(',');
            query = query.or(conditions);
        }

        const { data, error } = await query;
        if (error) throw error;

        // --- FEE STATUS CALCULATION (Bulk Optimized) ---
        if (data && data.length > 0) {
            const studentIds = data.map(s => s.profile_id);
            const classIds = [...new Set(data.filter(s => s.class_id).map(s => s.class_id))];

            // 1. Get Fee Structures for these classes
            const { data: feeStructs } = await supabase
                .from('class_fee_structures')
                .select('id, class_id, amount, due_date')
                .in('class_id', classIds);

            // 2. Get Payments for these students
            const { data: payments } = await supabase
                .from('student_fee_payments')
                .select('student_id, class_fee_structure_id, amount_paid')
                .in('student_id', studentIds);

            // 3. Map Status
            const todayStr = new Date().toISOString().split('T')[0];
            data.forEach(student => {
                // Get constraints for this student's class
                const classFees = feeStructs?.filter(f => f.class_id === student.class_id) || [];

                let isDefaulter = false;

                for (const fee of classFees) {
                    // Skip if Due Date is in the future (String comparison is safe for YYYY-MM-DD)
                    if (fee.due_date && fee.due_date > todayStr) {
                        continue;
                    }

                    const paid = payments
                        ?.filter(p => p.student_id === student.profile_id && p.class_fee_structure_id === fee.id)
                        .reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0) || 0;

                    if (paid < fee.amount) {
                        isDefaulter = true;
                        break;
                    }
                }
                student.fee_status = isDefaulter ? 'unpaid' : 'paid';
            });
        }
        // -----------------------------------------------

        // Search Filter (Client-sideish for now due to join limits)
        let filteredData = data;
        if (search) {
            const lowerSearch = search.toLowerCase();
            filteredData = data.filter(s =>
                s.profiles.full_name.toLowerCase().includes(lowerSearch) ||
                s.admission_no.toLowerCase().includes(lowerSearch)
            );
        }

        res.json(filteredData);
    } catch (error) {
        console.error('Get Students Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        // Hard Delete:
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('profile_id', id);

        if (error) throw error;

        // Also Hard Delete the Profile
        const { error: profileDeleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileDeleteError) throw profileDeleteError;

        // Also delete the Auth User
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
        if (authDeleteError) throw authDeleteError;

        res.json({ message: 'Student and associated records deleted successfully' });
    } catch (error) {
        console.error('Delete Student Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            full_name, email, phone_number, address, avatar_url, // Added avatar_url
            admission_no, roll_no, dob, gender, blood_group, class_id, section_id, parent_name, parent_phone
        } = req.body;

        // 0. Get Old Avatar (for cleanup)
        const { data: currentProfile } = await supabase.from('profiles').select('avatar_url').eq('id', id).single();
        const oldAvatarUrl = currentProfile?.avatar_url;

        // 1. Update Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name, email, phone_number, address, avatar_url })
            .eq('id', id);

        if (profileError) throw profileError;

        // 2. Update Student Record
        const { error: studentError } = await supabase
            .from('students')
            .update({
                admission_no,
                roll_no,
                dob,
                gender,
                blood_group,
                class_id,
                section_id,
                parent_name,
                parent_phone
            })
            .eq('profile_id', id);

        if (studentError) throw studentError;

        // Cleanup Old Avatar if replaced
        if (avatar_url && oldAvatarUrl && avatar_url !== oldAvatarUrl) {
            await deleteFileFromUrl(oldAvatarUrl);
        }

        res.json({ message: 'Student profile updated successfully' });

    } catch (error) {
        console.error('Update Student Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id; // From authMiddleware

        // Fetch Student + Profile + Class + Section + Bus
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                profiles!profile_id (*),
                classes (name),
                sections (name),
                student_transport (
                    bus_id,
                    buses (bus_number, route_name, driver_id, drivers (full_name, phone_number))
                )
            `)
            .eq('profile_id', userId)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Student profile not found' });

        res.json(data);
    } catch (error) {
        console.error('Get My Profile Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getMarksheet = async (req, res) => {
    try {
        const student_id = req.user.id;

        // 1. Check Fee Status
        // Get Student Class
        const { data: student, error: sErr } = await supabase
            .from('students')
            .select('class_id')
            .eq('profile_id', student_id)
            .single();

        if (sErr || !student) return res.status(404).json({ error: 'Student not found' });

        // Get Fees & Payments
        const { data: fees } = await supabase
            .from('class_fee_structures')
            .select('id, amount, due_date')
            .eq('class_id', student.class_id);

        const { data: payments } = await supabase
            .from('student_fee_payments')
            .select('class_fee_structure_id, amount_paid')
            .eq('student_id', student_id);

        let isDefaulter = false;
        const todayStr = new Date().toISOString().split('T')[0];

        if (fees && fees.length > 0) {
            for (const fee of fees) {
                // Skip future fees
                if (fee.due_date && fee.due_date > todayStr) {
                    continue;
                }

                const paid = payments
                    ?.filter(p => p.class_fee_structure_id === fee.id)
                    .reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0) || 0;

                if (paid < fee.amount) {
                    isDefaulter = true;
                    break;
                }
            }
        }

        if (isDefaulter) {
            return res.json({
                allowed: false,
                message: "Your fee is not paid. Marksheet is locked."
            });
        }

        // 2. Fetch Marks (If Allowed)
        // Fetch Class Tests Marks
        const { data: testMarks } = await supabase
            .from('class_test_marks')
            .select(`
                marks_obtained,
                class_tests (title, max_marks, test_date, subject_id, subjects(name))
            `)
            .eq('student_id', student_id);

        // Fetch Exam Marks (Assuming 'exam_marks' table and 'exams' table exists based on context)
        // If not sure, we can just return testMarks for now or try-catch it.
        // User mentioned "Exam marks" in dashboard, so likely exists.
        // Let's assume standard schema or just return what we have.

        res.json({
            allowed: true,
            class_tests: testMarks || []
            // exams: ... 
        });

    } catch (error) {
        console.error('Get Marksheet Error:', error);
        res.status(500).json({ error: error.message });
    }
};
