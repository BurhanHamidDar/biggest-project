const supabase = require('../config/supabaseClient');
const { deleteFileFromUrl } = require('../utils/storageHelper');

// --- BUSES ---
exports.createBus = async (req, res) => {
    try {
        const { bus_number, capacity, route_name, driver_id } = req.body;

        // 1. Check if Driver is already assigned (Strict Rule)
        if (driver_id) {
            const { data: busyDriver } = await supabase
                .from('drivers')
                .select('id, assigned_bus_id')
                .eq('id', driver_id)
                .single();

            if (busyDriver && busyDriver.assigned_bus_id) {
                return res.status(400).json({ error: 'Driver is already assigned to another bus.' });
            }
        }

        // 2. Create Bus
        const { data: bus, error } = await supabase
            .from('buses')
            .insert([{ bus_number, capacity, route_name, driver_id }])
            .select()
            .single();

        if (error) throw error;

        // 3. Sync Driver (Circular Link)
        if (driver_id) {
            await supabase
                .from('drivers')
                .update({ assigned_bus_id: bus.id })
                .eq('id', driver_id);
        }

        res.status(201).json(bus);
    } catch (error) {
        console.error('Create Bus Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getBuses = async (req, res) => {
    try {
        // Fetch buses with Driver details and Student Count
        // Explicitly using 'driver_id' to join drivers to avoid ambiguity
        const { data: buses, error } = await supabase
            .from('buses')
            .select(`
                *,
                drivers!driver_id (full_name, phone_number),
                student_transport (count)
            `);

        if (error) throw error;

        const formatted = buses.map(b => ({
            ...b,
            student_count: b.student_transport?.[0]?.count || 0,
            driver_name: b.drivers?.full_name || 'Unassigned',
            driver_phone: b.drivers?.phone_number || ''
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        // Find driver to unassign first
        await supabase.from('drivers').update({ assigned_bus_id: null }).eq('assigned_bus_id', id);

        const { error } = await supabase.from('buses').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Bus deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- DRIVERS ---
exports.createDriver = async (req, res) => {
    try {
        // Frontend sends 'name', DB expects 'full_name'
        const { name, full_name, license_number, phone_number, photo_url, address, assigned_bus_id } = req.body;

        if (!phone_number || (!full_name && !name)) {
            return res.status(400).json({ error: 'Missing required fields: Name, Phone Number.' });
        }

        // 1. Create Driver
        const { data: driver, error } = await supabase
            .from('drivers')
            .insert([{
                full_name: full_name || name, // Handle both cases 
                license_number,
                phone_number,
                avatar_url: photo_url,
                address,
                assigned_bus_id: assigned_bus_id || null
            }])
            .select()
            .single();

        if (error) throw error;

        // 2. Sync Bus (Circular Link) - Strict Rule
        // If a bus was selected, update THAT bus to say "I am driven by this new driver"
        if (assigned_bus_id) {
            await supabase
                .from('buses')
                .update({ driver_id: driver.id })
                .eq('id', assigned_bus_id);
        }

        res.status(201).json(driver);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDrivers = async (req, res) => {
    try {
        // Explicitly using 'assigned_bus_id' to join buses to avoid ambiguity
        const { data, error } = await supabase
            .from('drivers')
            .select('*, buses!assigned_bus_id(bus_number, route_name)');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, full_name, license_number, phone_number, photo_url, avatar_url, address, assigned_bus_id, dob, joining_date, parentage } = req.body;

        const updateData = {
            full_name: full_name || name,
            license_number,
            phone_number,
            avatar_url: avatar_url || photo_url,
            address,
            dob,
            joining_date,
            parentage,
            assigned_bus_id: assigned_bus_id || null
        };

        // Remove undefined/null keys if not intended to clear? No, we likely want to update what's sent.
        // But for assigned_bus_id, we need special handling if it changes.

        // 1. Get current state to check if bus changed AND to get old avatar
        const { data: currentDriver } = await supabase.from('drivers').select('assigned_bus_id, avatar_url').eq('id', id).single();
        const oldBusId = currentDriver?.assigned_bus_id;
        const oldAvatarUrl = currentDriver?.avatar_url;

        // Cleanup Old Avatar if replaced
        if (avatar_url && oldAvatarUrl && avatar_url !== oldAvatarUrl) {
            await deleteFileFromUrl(oldAvatarUrl);
        }

        // 2. Update Driver Record
        const { data: driver, error } = await supabase
            .from('drivers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 3. Manage Bus Links (if bus assignment changed)
        if (oldBusId !== updateData.assigned_bus_id) {
            // A. If there was an old bus, unlink it
            if (oldBusId) {
                await supabase.from('buses').update({ driver_id: null }).eq('id', oldBusId);
            }

            // B. If there is a new bus, link it (Strict: Overwrite any existing driver there? Or Check?)
            // UI filters available buses, so we assume it's free or user intends to overwrite.
            if (updateData.assigned_bus_id) {
                await supabase.from('buses').update({ driver_id: id }).eq('id', updateData.assigned_bus_id);
            }
        }

        res.json(driver);
    } catch (error) {
        console.error('Update Driver Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get Avatar URL to delete file
        const { data: driver } = await supabase.from('drivers').select('avatar_url').eq('id', id).single();
        if (driver?.avatar_url) {
            await deleteFileFromUrl(driver.avatar_url);
        }

        // Unlink bus if assigned
        await supabase.from('buses').update({ driver_id: null }).eq('driver_id', id);

        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Driver deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- STUDENT TRANSPORT LINK (Strict Capacity) ---
exports.assignStudentToBus = async (req, res) => {
    try {
        const { student_id, bus_id } = req.body;

        if (!student_id) return res.status(400).json({ error: 'Student ID required' });

        // If Unassigning (bus_id is null)
        if (!bus_id) {
            await supabase.from('student_transport').delete().eq('student_id', student_id);
            return res.json({ message: 'Student removed from transport' });
        }

        // 1. Check Bus Capacity
        const { data: bus } = await supabase
            .from('buses')
            .select('capacity, student_transport(count)')
            .eq('id', bus_id)
            .single();

        if (!bus) return res.status(404).json({ error: 'Bus not found' });

        const currentLoad = bus.student_transport?.[0]?.count || 0;
        if (bus.capacity && currentLoad >= bus.capacity) {
            return res.status(400).json({ error: `Bus is full! Capacity: ${bus.capacity}` });
        }

        // 2. Upsert Link
        const { error } = await supabase
            .from('student_transport')
            .upsert([{ student_id, bus_id }], { onConflict: 'student_id' });

        if (error) throw error;

        res.json({ message: 'Student assigned to bus' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBusPassengers = async (req, res) => {
    try {
        const { id } = req.params; // bus_id

        const { data, error } = await supabase
            .from('student_transport')
            .select(`
                student_id,
                students (
                    profile_id,
                    admission_no,
                    parent_name,
                    parent_phone,
                    class_id,
                    section_id,
                    profiles (full_name, email, phone_number, avatar_url),
                    classes (name),
                    sections (name)
                )
            `)
            .eq('bus_id', id);

        if (error) {
            console.error('Supabase Query Error:', error);
            throw error;
        }

        if (!data) return res.json([]);

        // UNPACKING: Transform transport records into Student records
        // StudentListModal expects: { profile_id, admission_no, profiles: {...}, classes: {...} }
        const passengers = data.map(record => {
            const s = record.students;
            if (!s) return null;

            // Supabase 1:1 joins can return array or object depending on config, but standard is object.
            // Ensure consistency.
            const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
            const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes;
            const sec = Array.isArray(s.sections) ? s.sections[0] : s.sections;

            return {
                ...s,
                profiles: profile,
                classes: cls,
                sections: sec
            };
        }).filter(p => p !== null);

        res.json(passengers);
    } catch (error) {
        console.error('Get Bus Passengers Logic Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getMyBus = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('student_transport')
            .select(`
                bus_id,
                buses (
                    id, bus_number, capacity, route_name,
                    drivers (full_name, phone_number, license_number, avatar_url)
                )
            `)
            .eq('student_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows (no bus assigned)

        if (!data) return res.json({ message: 'No bus assigned' });

        res.json(data.buses);
    } catch (error) {
        console.error('Get My Bus Error:', error);
        res.status(500).json({ error: error.message });
    }
};
