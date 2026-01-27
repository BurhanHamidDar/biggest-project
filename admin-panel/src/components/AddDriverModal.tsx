"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { createDriver, updateDriver, fetchBuses } from '@/services/api'; // Added updateDriver
import { supabase } from '@/lib/supabase';

interface AddDriverModalProps {
    show: boolean;
    handleClose: () => void;
    onSuccess: () => void;
    driverToEdit?: any; // New Prop
}

const AddDriverModal: React.FC<AddDriverModalProps> = ({ show, handleClose, onSuccess, driverToEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        license_number: '',
        phone_number: '',
        parentage: '',
        address: '',
        dob: '',
        joining_date: '',
        avatar_url: '',
        assigned_bus_id: ''
    });

    const [buses, setBuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            fetchBuses().then(data => setBuses(data)).catch(console.error);
        }
    }, [show]);

    // Pre-fill Logic
    useEffect(() => {
        if (show && driverToEdit) {
            setFormData({
                name: driverToEdit.full_name || '',
                license_number: driverToEdit.license_number || '',
                phone_number: driverToEdit.phone_number || '',
                parentage: driverToEdit.parentage || '',
                address: driverToEdit.address || '',
                dob: driverToEdit.dob || '',
                joining_date: driverToEdit.joining_date || '',
                avatar_url: driverToEdit.avatar_url || '',
                assigned_bus_id: driverToEdit.assigned_bus_id || ''
            }); // Note: assigned_bus_id might need to reference 'buses' object if strictly joined?
            // The driver object normally has 'assigned_bus_id' direct column too? 
            // getDrivers returns select * ... so yes.
        } else if (show) {
            // Reset
            setFormData({
                name: '', license_number: '', phone_number: '', parentage: '',
                address: '', dob: '', joining_date: '', avatar_url: '', assigned_bus_id: ''
            });
        }
    }, [show, driverToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `driver-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));

        } catch (err: any) {
            alert('Error uploading image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (driverToEdit) {
                await updateDriver(driverToEdit.id, formData);
            } else {
                await createDriver(formData);
            }
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>{driverToEdit ? 'Edit Driver' : 'Add New Driver'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white">
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <div className="mb-4 text-center">
                        <div
                            className="bg-secondary mb-2 mx-auto rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                            style={{ width: 100, height: 100, border: '2px solid #aaa' }}
                        >
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span className="text-white-50">No Photo</span>
                            )}
                        </div>
                        <Form.Label className="btn btn-outline-light btn-sm">
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                            <Form.Control type="file" accept="image/*" hidden onChange={handleFileChange} disabled={uploading} />
                        </Form.Label>
                    </div>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Full Name *</Form.Label>
                                <Form.Control required name="name" value={formData.name} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        {/* ... Existing Fields ... */}
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Parentage / Guardian</Form.Label>
                                <Form.Control name="parentage" value={formData.parentage} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>License Number *</Form.Label>
                                <Form.Control required name="license_number" value={formData.license_number} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Phone Number *</Form.Label>
                                <Form.Control required name="phone_number" value={formData.phone_number} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date of Birth</Form.Label>
                                <Form.Control type="date" name="dob" value={formData.dob} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Joining Date</Form.Label>
                                <Form.Control type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Assign Bus</Form.Label>
                                <Form.Select name="assigned_bus_id" value={formData.assigned_bus_id} onChange={handleChange} className="bg-dark border-secondary text-white">
                                    <option value="">No Bus Assigned</option>
                                    {buses.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.bus_number} (Cap: {b.capacity})
                                            {/* Show if it's currently assigned to THIS driver to differ from others? */}
                                            {b.driver_id && b.driver_id !== driverToEdit?.id ? ' - Occupied' : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Address</Form.Label>
                                <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={loading || uploading}>
                            {loading ? (driverToEdit ? 'Updating...' : 'Creating...') : (driverToEdit ? 'Update Driver' : 'Create Driver')}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddDriverModal;
