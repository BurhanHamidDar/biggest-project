const supabase = require('../config/supabaseClient');

exports.getStats = async (req, res) => {
    try {
        // Parallel requests for counts
        const [
            { count: studentCount, error: sErr },
            { count: teacherCount, error: tErr },
            { count: classCount, error: cErr },
            { count: busCount, error: bErr }
        ] = await Promise.all([
            supabase.from('students').select('*', { count: 'exact', head: true }),
            supabase.from('teachers').select('*', { count: 'exact', head: true }),
            supabase.from('classes').select('*', { count: 'exact', head: true }),
            supabase.from('buses').select('*', { count: 'exact', head: true })
        ]);

        if (sErr || tErr || cErr || bErr) {
            throw new Error('Failed to fetch counts');
        }

        // Fee Summary (Calculated - might be heavy for large DBs, optimization needed later)
        // Ideally we use a stored procedure or views for this.
        // For now, JS calculation on limited dataset or just total tables?

        // Let's just fetch ALL payments to sum them up (Not scalable but okay for MVP)
        const { data: payments, error: pErr } = await supabase
            .from('student_fee_payments')
            .select('amount_paid');

        const totalCollection = payments ? payments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0) : 0;

        res.json({
            students: studentCount,
            teachers: teacherCount,
            classes: classCount,
            buses: busCount,
            total_fees_collected: totalCollection
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
};
