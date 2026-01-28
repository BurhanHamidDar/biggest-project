const supabase = require('../config/supabaseClient');

// --- FEE TYPES ---
exports.createFeeType = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { data, error } = await supabase.from('fee_types').insert([{ name, description }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getFeeTypes = async (req, res) => {
    try {
        const { data, error } = await supabase.from('fee_types').select('*');
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- FEE STRUCTURE (Assign Fees to Class) ---
exports.createFeeStructure = async (req, res) => {
    try {
        const { class_id, fee_type_id, amount, due_date, academic_year_id } = req.body;
        const payload = { class_id, fee_type_id, amount, due_date };
        if (academic_year_id) payload.academic_year_id = academic_year_id;

        const { data, error } = await supabase.from('class_fee_structures')
            .insert([payload])
            .select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getFeeStructure = async (req, res) => {
    try {
        const { class_id } = req.query;
        let query = supabase.from('class_fee_structures')
            .select(`
                id, amount, due_date,
                fee_types (name),
                classes (name)
            `);
        if (class_id) query = query.eq('class_id', class_id);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- PAYMENTS ---
exports.recordPayment = async (req, res) => {
    try {
        const { student_id, class_fee_structure_id, amount_paid, payment_date, payment_method, remarks } = req.body;

        // 1. Get the Fee Structure Total Amount
        const { data: structure, error: structError } = await supabase
            .from('class_fee_structures')
            .select('amount')
            .eq('id', class_fee_structure_id)
            .single();

        if (structError) throw structError;

        // 2. Check existing payments for this fee structure & student
        const { data: existingPayments, error: payError } = await supabase
            .from('student_fee_payments')
            .select('amount_paid')
            .eq('student_id', student_id)
            .eq('class_fee_structure_id', class_fee_structure_id);

        if (payError) throw payError;

        const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
        const newTotalPaid = totalPaidSoFar + parseFloat(amount_paid);

        // 3. Determine Status
        let status = 'pending';
        if (newTotalPaid >= structure.amount) status = 'paid';
        else if (newTotalPaid > 0) status = 'partial';

        // 4. Insert Payment
        const { data: payment, error: insertError } = await supabase
            .from('student_fee_payments')
            .insert([{
                student_id,
                class_fee_structure_id,
                amount_paid,
                payment_date,
                payment_method,
                status,
                remarks
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        // NOTIFICATION TRIGGER
        try {
            const { data: tokens } = await supabase.from('push_tokens').select('token').eq('user_id', student_id);
            if (tokens && tokens.length > 0) {
                const tokenList = tokens.map(t => t.token);
                const { sendPushList } = require('../utils/expoPush');
                await sendPushList(
                    tokenList,
                    'Fee Payment Received ✅',
                    `Payment of ₹${amount_paid} for ${structure?.fee_types?.name || 'School Fee'} received.`,
                    { type: 'payment_success', payment_id: payment.id }
                );
            }
        } catch (notifError) {
            console.error('Notification Error (Payment):', notifError);
        }

        res.json(payment);

    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- DUES & LOCKING LOGIC ---
exports.getStudentFeeStatus = async (req, res) => {
    try {
        const { student_id } = req.query;

        // 1. Get Student's Class
        const { data: student, error: sErr } = await supabase
            .from('students')
            .select('class_id')
            .eq('profile_id', student_id)
            .single();

        if (sErr || !student) return res.status(404).json({ error: 'Student not found' });

        // 2. Get All Fees Applicable to that Class
        const { data: fees, error: fErr } = await supabase
            .from('class_fee_structures')
            .select('id, amount, due_date, fee_types(id, name)')
            .eq('class_id', student.class_id);

        if (fErr) throw fErr;

        // 3. Get All Payments made by Student
        const { data: payments, error: pErr } = await supabase
            .from('student_fee_payments')
            .select('class_fee_structure_id, amount_paid')
            .eq('student_id', student_id);

        if (pErr) throw pErr;

        // 4. Calculate Dues
        let totalDue = 0;
        let isLocked = false;

        const statusReport = fees.map(fee => {
            const paidForThisFee = payments
                .filter(p => p.class_fee_structure_id === fee.id)
                .reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);

            const due = fee.amount - paidForThisFee;
            if (due > 0) {
                totalDue += due;
                // If existing date is past due date, lock it? Or just lock if ANY fee is pending?
                // User Requirement: "If fees are unpaid, marksheet must stay locked."
                // Implies ANY unpaid fee locks the marksheet.
                isLocked = true;
            }

            return {
                fee_type: fee.fee_types.name,
                total_amount: fee.amount,
                paid_amount: paidForThisFee,
                due_amount: due > 0 ? due : 0,
                status: due <= 0 ? 'PAID' : 'PENDING'
            };
        });

        res.json({
            student_id,
            total_due: totalDue,
            is_defaulter: isLocked, // Can be used by frontend to show lock icon
            fees: statusReport
        });

    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateFeeStatus = async (req, res) => {
    try {
        const { student_id, class_fee_structure_id, status } = req.body;
        // status: 'paid' | 'unpaid'
        const teacherId = req.user.id; // From authMiddleware

        if (!student_id || !class_fee_structure_id || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 0. HR Check: Ensure the requester is the HR teacher for the student's class
        const { data: studentData, error: stError } = await supabase
            .from('students')
            .select('class_id, section_id, profiles!profile_id(full_name)')
            .eq('profile_id', student_id)
            .single();

        if (stError || !studentData) return res.status(404).json({ error: 'Student not found' });

        const { data: hrAssignment } = await supabase
            .from('class_teachers')
            .select('id')
            .eq('teacher_id', teacherId)
            .eq('class_id', studentData.class_id)
            .eq('section_id', studentData.section_id)
            .maybeSingle();

        if (!hrAssignment) {
            return res.status(403).json({ error: 'Permission Denied: Only the Class HR can mark fees.' });
        }

        if (status === 'unpaid') {
            // "Mark as Unpaid" -> Delete all payments for this structure
            const { error } = await supabase
                .from('student_fee_payments')
                .delete()
                .eq('student_id', student_id)
                .eq('class_fee_structure_id', class_fee_structure_id);

            if (error) throw error;
            res.json({ message: 'Marked as unpaid (payments cleared)' });

        } else if (status === 'paid') {
            // "Mark as Paid" -> Calculate remaining due and pay it off
            // 1. Get Structure Amount
            const { data: structure, error: sErr } = await supabase
                .from('class_fee_structures')
                .select('amount, fee_types(name)')
                .eq('id', class_fee_structure_id)
                .single();
            if (sErr) throw sErr;

            // 2. Get Existing Payload
            const { data: payments, error: pErr } = await supabase
                .from('student_fee_payments')
                .select('amount_paid')
                .eq('student_id', student_id)
                .eq('class_fee_structure_id', class_fee_structure_id);
            if (pErr) throw pErr;

            const paidSoFar = payments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
            const due = structure.amount - paidSoFar;

            if (due <= 0) {
                return res.json({ message: 'Already fully paid' });
            }

            // 3. Insert Balance Payment
            const { error: insertError } = await supabase
                .from('student_fee_payments')
                .insert([{
                    student_id,
                    class_fee_structure_id,
                    amount_paid: due,
                    payment_date: new Date().toISOString().split('T')[0],
                    payment_method: 'Manual Override', // HR marked
                    status: 'paid',
                    remarks: 'Marked as Paid by HR/Admin'
                }]);

            if (insertError) throw insertError;

            // 4. NOTIFICATION: Start
            try {
                const { data: tokens } = await supabase
                    .from('push_tokens')
                    .select('token')
                    .eq('user_id', student_id);

                if (tokens && tokens.length > 0) {
                    const tokenList = tokens.map(t => t.token);
                    const { sendPushList } = require('../utils/expoPush');
                    await sendPushList(
                        tokenList,
                        'Fee Paid ✅',
                        `Your ${structure.fee_types?.name || 'fee'} of ₹${due} has been marked as PAID.`,
                        { type: 'fee_update' }
                    );
                }
            } catch (notifError) {
                console.error('Notification Error (Fee):', notifError);
            }
            // NOTIFICATION: End

            res.json({ message: 'Marked as paid' });
        } else {
            res.status(400).json({ error: 'Invalid status' });
        }

    } catch (error) {
        console.error('Update Fee Status Error:', error);
        res.status(500).json({ error: error.message });
    }
};
