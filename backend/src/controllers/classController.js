const supabase = require('../config/supabaseClient');

exports.createClass = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Class name is required' });

        const { data, error } = await supabase
            .from('classes')
            .insert([{ name }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getClasses = async (req, res) => {
    try {
        // Fetch classes with their sections
        const { data, error } = await supabase
            .from('classes')
            .select(`
                id, name, order_index,
                sections (id, name)
            `)
            .order('name', { ascending: true }); // Simple alpha sort for now

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSection = async (req, res) => {
    try {
        const { class_id, name } = req.body;
        if (!class_id || !name) return res.status(400).json({ error: 'Class ID and Section Name are required' });

        const { data, error } = await supabase
            .from('sections')
            .insert([{ class_id, name }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
