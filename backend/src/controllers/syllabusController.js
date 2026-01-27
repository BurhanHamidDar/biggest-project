const supabase = require('../config/supabaseClient');

exports.createSyllabus = async (req, res) => {
    try {
        const { class_id, subject_id, title, description, file_url, uploaded_by } = req.body;
        let { academic_year_id } = req.body;

        // Validation: REMOVED section_id check. 
        if (!class_id || !subject_id || !title || !file_url) {
            console.error('Create Syllabus Missing Fields:', req.body);
            return res.status(400).json({ error: 'Missing required fields' }); // This was the 400 error cause
        }

        // 0. Auto-detect Active Academic Year if not provided
        if (!academic_year_id) {
            try {
                const { data: activeYear } = await supabase
                    .from('academic_years')
                    .select('id')
                    .eq('is_active', true)
                    .maybeSingle();

                if (activeYear) {
                    academic_year_id = activeYear.id;
                } else {
                    console.warn('No active academic year found or table missing.');
                }
            } catch (err) {
                console.warn('Academic Year auto-detection failed:', err.message);
            }
        }

        // 1. Check for existing active syllabus (Scoped to Class + Subject + Year)
        // Ignoring section_id (it is now null for all class-wide syllabi)
        let query = supabase
            .from('syllabus')
            .select('id')
            .eq('class_id', class_id)
            .eq('subject_id', subject_id)
            .select('id')
            .eq('class_id', class_id)
            .eq('subject_id', subject_id);

        if (academic_year_id) {
            query = query.eq('academic_year_id', academic_year_id);
        }

        const { data: existing } = await query;

        // 2. Archive/Soft Delete existing if found (Replacement logic)
        if (existing && existing.length > 0) {
            await supabase
                .from('syllabus')
                .delete()
                .in('id', existing.map(e => e.id));
        }

        // 3. Insert new syllabus (section_id omitted completely)
        const { data, error } = await supabase
            .from('syllabus')
            .insert([{
                class_id,
                // section_id key removed entirely to avoid PGRST204 if column is hidden/missing
                subject_id,
                academic_year_id,
                title,
                description,
                file_url,
                uploaded_by
            }])
            .select();

        if (error) {
            console.error('Supabase Insert Error:', error);
            throw error;
        }
        res.status(201).json({ message: 'Syllabus uploaded successfully', data: data[0] });

    } catch (error) {
        console.error('Create Syllabus Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getSyllabus = async (req, res) => {
    try {
        const { class_id, section_id, teacher_id } = req.query;

        // FALLBACK: Manual Joins
        // Fetch RAW syllabus data first (no foreign key joins)
        let query = supabase.from('syllabus').select('*');

        // Mobile App: Student View
        if (class_id) {
            // Students just send class_id now (or we ignore section_id if sent for filtered view)
            query = query.eq('class_id', class_id);
        }
        // Mobile App: Teacher View
        else if (teacher_id) {
            const { data: assignments } = await supabase
                .from('subject_teachers')
                .select('class_id, subject_id') // We only care about Class + Subject now
                .eq('teacher_id', teacher_id);

            if (!assignments || assignments.length === 0) return res.json([]);

            // Use Set to remove duplicates
            const uniqueAssignments = Array.from(new Set(assignments.map(a => `${a.class_id}|${a.subject_id}`)))
                .map(s => {
                    const [c, sub] = s.split('|');
                    return { class_id: c, subject_id: sub };
                });

            const conditions = uniqueAssignments.map(a =>
                `and(class_id.eq.${a.class_id},subject_id.eq.${a.subject_id})`
            ).join(',');

            query = query.or(conditions);
        }
        // Admin View
        else {
            if (class_id) query = query.eq('class_id', class_id);
        }

        const { data: syllabusData, error } = await query;
        if (error) {
            console.error('Supabase Raw Query Error:', error);
            throw error;
        }

        if (!syllabusData || syllabusData.length === 0) return res.json([]);

        // MANUAL ENRICHMENT: Fetch related names separately
        // 1. Extract IDs avoiding duplicates
        const classIds = [...new Set(syllabusData.map(s => s.class_id))];
        // Don't need sections anymore really, but keep for safety if old data exists
        const sectionIds = [...new Set(syllabusData.map(s => s.section_id).filter(Boolean))];
        const subjectIds = [...new Set(syllabusData.map(s => s.subject_id))];

        // 2. Parallel Fetch
        const [classes, sections, subjects] = await Promise.all([
            classIds.length > 0 ? supabase.from('classes').select('id, name').in('id', classIds) : { data: [] },
            sectionIds.length > 0 ? supabase.from('sections').select('id, name').in('id', sectionIds) : { data: [] },
            subjectIds.length > 0 ? supabase.from('subjects').select('id, name').in('id', subjectIds) : { data: [] }
        ]);

        // 3. Map names back to syllabus items
        const enrichedData = syllabusData.map(item => ({
            ...item,
            classes: classes.data?.find(c => c.id === item.class_id) || { name: 'Unknown' },
            sections: sections.data?.find(s => s.id === item.section_id) || { name: '-' },
            subjects: subjects.data?.find(sub => sub.id === item.subject_id) || { name: 'Unknown' }
        }));

        res.json(enrichedData);

    } catch (error) {
        console.error('Get Syllabus CRITICAL Error:', error);
        res.status(500).json({
            error: error.message,
            details: error.details
        });
    }
};

exports.deleteSyllabus = async (req, res) => {
    try {
        const { id } = req.params;
        // Soft Delete
        const { error } = await supabase
            .from('syllabus')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Syllabus deleted successfully' });
    } catch (error) {
        console.error('Delete Syllabus Error:', error);
        res.status(500).json({ error: error.message });
    }
};
