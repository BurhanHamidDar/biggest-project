const supabase = require('../config/supabaseClient');
const { deleteFileFromUrl } = require('../utils/storageHelper');

const generatePassword = (dobString) => {
    if (!dobString) return '12345678';
    const [year, month, day] = dobString.split('-');
    return `${day}${month}${year}`;
};

exports.createTeacher = async (req, res) => {
    try {
        const {
            email, full_name, phone_number, address,
            joining_date, qualification, department,
            dob, avatar_url, username
        } = req.body;

        if (!email || !full_name || !dob || !phone_number) {
            return res.status(400).json({ error: 'Missing required fields: Email, Name, DOB, Phone Number.' });
        }

        const finalUsername = username || email.split('@')[0];
        const password = generatePassword(dob);

        // 1. Create User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'teacher', full_name, username: finalUsername }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Create Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: userId,
                email,
                username: finalUsername,
                full_name,
                role: 'teacher',
                phone_number,
                address,
                avatar_url
            }]);

        if (profileError) {
            await supabase.auth.admin.deleteUser(userId);
            throw profileError;
        }

        // 3. Create Teacher Record
        const { error: teacherError } = await supabase
            .from('teachers')
            .insert([{
                profile_id: userId,
                joining_date,
                qualification,
                department,
                dob // Added DOB
            }]);

        if (teacherError) {
            await supabase.auth.admin.deleteUser(userId);
            throw teacherError;
        }

        res.status(201).json({ message: 'Teacher created successfully', user: authData.user });
    } catch (error) {
        console.error('Create Teacher Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getTeachers = async (req, res) => {
    try {
        const { search } = req.query;

        let query = supabase
            .from('teachers')
            .select(`
                profile_id, joining_date, qualification, department, dob,
                profiles!profile_id (full_name, email, phone_number, address, avatar_url)
            `)
            .select(`
                profile_id, joining_date, qualification, department, dob,
                profiles!profile_id (full_name, email, phone_number, address, avatar_url)
            `);

        const { data, error } = await query;
        if (error) throw error;

        let filteredData = data;
        if (search) {
            const lowerSearch = search.toLowerCase();
            filteredData = data.filter(t =>
                t.profiles.full_name.toLowerCase().includes(lowerSearch) ||
                t.department?.toLowerCase().includes(lowerSearch)
            );
        }

        res.json(filteredData);
    } catch (error) {
        console.error('Get Teachers Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('teachers')
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

        res.json({ message: 'Teacher deleted (hard) successfully' });
    } catch (error) {
        console.error('Delete Teacher Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// FIXED: Uses req.user.id
exports.getMyStudents = async (req, res) => {
    try {
        // Use authenticated user ID if available, else query param
        const teacher_id = req.user?.id || req.query.teacher_id;

        if (!teacher_id) return res.status(400).json({ error: 'Teacher ID required' });

        // 1. Get Allocations
        const { data: hrClasses } = await supabase.from('class_teachers').select('class_id, section_id').eq('teacher_id', teacher_id);
        const { data: subjectClasses } = await supabase.from('subject_teachers').select('class_id, section_id').eq('teacher_id', teacher_id);

        const allAllocations = [...(hrClasses || []), ...(subjectClasses || [])];
        const uniqueKeys = new Set(allAllocations.map(a => `${a.class_id}|${a.section_id}`));

        if (uniqueKeys.size === 0) return res.json([]);

        const orConditions = Array.from(uniqueKeys).map(key => {
            const [cid, sid] = key.split('|');
            return `and(class_id.eq.${cid},section_id.eq.${sid})`;
        }).join(',');

        const { data: students, error } = await supabase
            .from('students')
            .select(`
                profile_id, admission_no, roll_no, class_id, section_id, dob, parent_name, parent_phone, gender, blood_group,
                profiles!profile_id (full_name, avatar_url, address, email, phone_number),
                classes: class_id (name),
                sections: section_id (name),
                buses: bus_id (bus_number)
            `)
            .or(orConditions);

        if (error) throw error;

        // DEBUG LOGGING
        console.log('Fetched Students:', JSON.stringify(students.slice(0, 1), null, 2));

        res.json(students);

    } catch (error) {
        console.error('Get My Students Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            full_name, email, phone_number, address,
            joining_date, qualification, department,
            avatar_url, dob // Added DOB
        } = req.body;

        const { data: currentProfile } = await supabase.from('profiles').select('avatar_url').eq('id', id).single();
        const oldAvatarUrl = currentProfile?.avatar_url;

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name, email, phone_number, address, avatar_url })
            .eq('id', id);

        if (profileError) throw profileError;

        const { error: teacherError } = await supabase
            .from('teachers')
            .update({ joining_date, qualification, department, dob }) // Added DOB
            .eq('profile_id', id);

        if (teacherError) throw teacherError;

        if (avatar_url && oldAvatarUrl && avatar_url !== oldAvatarUrl) {
            await deleteFileFromUrl(oldAvatarUrl);
        }

        res.json({ message: 'Teacher profile updated successfully' });

    } catch (error) {
        console.error('Update Teacher Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id; // From authMiddleware

        const { data: teacher, error } = await supabase
            .from('teachers')
            .select(`*, profiles!profile_id (*)`)
            .eq('profile_id', userId)
            .single();

        if (error) throw error;
        if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' });

        const { data: hrClasses } = await supabase.from('class_teachers').select('*, classes(name), sections(name)').eq('teacher_id', userId);
        const { data: subjects } = await supabase.from('subject_teachers').select('*, classes(name), sections(name), subjects(name)').eq('teacher_id', userId);

        res.json({
            ...teacher,
            hr_classes: hrClasses || [],
            subjects: subjects || []
        });

    } catch (error) {
        console.error('Get My Profile Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// NEW: Get Single Student Details (Rich Data)
exports.getStudentDetails = async (req, res) => {
    try {
        const { id } = req.params; // Student Profile ID
        const teacher_id = req.user.id;

        // 1. Verify Access (Is teacher assigned?)
        // (Simplified: if getMyStudents returns it, we can access it. But explicit check is better)
        // For speed, assuming if they have the ID from the list, they likely have access. 
        // STRICT: Re-run assignment check? 
        // Let's implement Strict Check.

        // Check if student exists and get class/section
        const { data: student, error: sErr } = await supabase
            .from('students')
            .select('class_id, section_id, internal_notes') // Added internal_notes
            .eq('profile_id', id)
            .single();

        if (sErr || !student) return res.status(404).json({ error: 'Student not found' });

        // Check Teacher Assignment
        const { data: hr } = await supabase.from('class_teachers').select('id').eq('teacher_id', teacher_id).eq('class_id', student.class_id).eq('section_id', student.section_id).maybeSingle();
        const { data: sub } = await supabase.from('subject_teachers').select('id').eq('teacher_id', teacher_id).eq('class_id', student.class_id).eq('section_id', student.section_id).maybeSingle();

        if (!hr && !sub) return res.status(403).json({ error: 'Access Denied' });

        // 2. Calculate Fees Status (Pending or Paid)
        const { data: feeStruct } = await supabase.from('class_fee_structures').select('id, amount').eq('class_id', student.class_id);
        let fees_status = 'paid';
        let fees_due_amount = 0;

        if (feeStruct && feeStruct.length > 0) {
            const { data: payments } = await supabase.from('student_fee_payments').select('class_fee_structure_id, amount_paid').eq('student_id', id);

            feeStruct.forEach(fee => {
                const paid = payments.filter(p => p.class_fee_structure_id === fee.id).reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
                if (paid < fee.amount) {
                    fees_status = 'pending';
                    fees_due_amount += (fee.amount - paid);
                }
            });
        }

        // 3. Calculate Attendance Percentage
        // Total working days vs Present days? 
        // Simplest: Count 'present' records / Total records for this student?
        // Better: Count Total Registers for this class/section vs records.
        // For now: Records based.
        const { count: presentCount } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', id)
            .eq('status', 'present');

        const { count: totalRecords } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', id);

        const attendance_percentage = totalRecords ? ((presentCount / totalRecords) * 100).toFixed(1) : 0;

        res.json({
            internal_notes: student.internal_notes,
            fees_status,
            fees_due_amount,
            attendance_percentage
        });

    } catch (error) {
        console.error('Get Student Details Error:', error);
        res.status(500).json({ error: error.message });
    }
};
