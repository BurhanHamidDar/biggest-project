const supabase = require('../config/supabaseClient');

exports.createSubject = async (req, res) => {
    try {
        const { name, code, description } = req.body;
        if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

        const { data, error } = await supabase
            .from('subjects')
            .insert([{ name, code, description }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSubjects = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
