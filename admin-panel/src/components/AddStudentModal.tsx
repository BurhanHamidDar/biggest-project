"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { createStudent, updateStudent, fetchClasses, fetchBuses } from '@/services/api';
import { supabase } from '@/lib/supabase';

interface AddStudentModalProps {
    show: boolean;
    handleClose: () => void;
    onSuccess: () => void;
    studentToEdit?: any;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ show, handleClose, onSuccess, studentToEdit }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        admission_no: '',
        roll_no: '', // Added roll_no
        date_of_birth: '',
        phone_number: '',
        address: '',
        gender: 'male',
        blood_group: '',
        parent_name: '',
        parent_phone: '',
        class_id: '',
        section_id: '',
        avatar_url: '',
        bus_id: ''
    });

    // Data Loading
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [buses, setBuses] = useState<any[]>([]); // New State for Buses

    // UI State
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            Promise.all([
                fetchClasses(),
                fetchBuses() // Fetch buses on load
            ]).then(([classesData, busesData]) => {
                setClasses(classesData);
                setBuses(busesData);
            }).catch(console.error);
        }
    }, [show]);

    useEffect(() => {
        if (show && studentToEdit) {
            // Populate form for editing
            setFormData({
                full_name: studentToEdit.profiles?.full_name || '',
                email: studentToEdit.profiles?.email || '',
                admission_no: studentToEdit.admission_no || '',
                roll_no: studentToEdit.roll_no || '', // Map roll_no
                date_of_birth: studentToEdit.dob || '',
                phone_number: studentToEdit.profiles?.phone_number || '',
                address: studentToEdit.profiles?.address || '',
                gender: studentToEdit.gender || 'male',
                blood_group: studentToEdit.blood_group || '',
                parent_name: studentToEdit.parent_name || '',
                parent_phone: studentToEdit.parent_phone || '',
                class_id: studentToEdit.class_id || '',
                section_id: studentToEdit.section_id || '',
                avatar_url: studentToEdit.profiles?.avatar_url || '',
                bus_id: ''
            });
        } else if (show) {
            // Reset for new entry
            setFormData({
                full_name: '', email: '', admission_no: '', roll_no: '', date_of_birth: '',
                phone_number: '', address: '', gender: 'male', blood_group: '',
                parent_name: '', parent_phone: '', class_id: '', section_id: '', avatar_url: '',
                bus_id: ''
            });
            setSections([]);
        }
    }, [show, studentToEdit]);

    // Update sections when class_id changes
    useEffect(() => {
        if (formData.class_id && classes.length > 0) {
            const selectedClass = classes.find(c => c.id === formData.class_id);
            setSections(selectedClass?.sections || []);
        }
    }, [formData.class_id, classes]);


    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const classId = e.target.value;
        const selectedClass = classes.find(c => c.id === classId);
        setFormData({ ...formData, class_id: classId, section_id: '' });
        setSections(selectedClass?.sections || []);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
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
            // Sanitize Payload: Convert empty strings to null for UUID fields
            const payload = {
                ...formData,
                class_id: formData.class_id || null,
                section_id: formData.section_id || null,
                bus_id: formData.bus_id || null
            };

            if (studentToEdit) {
                await updateStudent(studentToEdit.profile_id, payload);
            } else {
                await createStudent(payload);
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
                <Modal.Title>{studentToEdit ? 'Edit Student' : 'Add New Student'}</Modal.Title>
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
                                <Form.Control required name="full_name" value={formData.full_name} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        {/* ... Existing Fields ... */}
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email (Username) *</Form.Label>
                                <Form.Control required type="email" name="email" value={formData.email} onChange={handleChange} className="bg-dark border-secondary text-white" disabled={!!studentToEdit} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Admission No *</Form.Label>
                                <Form.Control required name="admission_no" value={formData.admission_no} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Roll No *</Form.Label>
                                <Form.Control required name="roll_no" value={formData.roll_no} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date of Birth *</Form.Label>
                                <Form.Control required type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        {/* ... Class Section ... */}
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Class *</Form.Label>
                                <Form.Select required name="class_id" value={formData.class_id} onChange={handleClassChange} className="bg-dark border-secondary text-white">
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Student Phone *</Form.Label>
                                <Form.Control required name="phone_number" value={formData.phone_number} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Section</Form.Label>
                                <Form.Select name="section_id" value={formData.section_id} onChange={handleChange} className="bg-dark border-secondary text-white" disabled={!formData.class_id}>
                                    <option value="">Select Section</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        {/* ... */}

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Parent Name *</Form.Label>
                                <Form.Control required name="parent_name" value={formData.parent_name} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Parent Phone *</Form.Label>
                                <Form.Control required name="parent_phone" value={formData.parent_phone} onChange={handleChange} className="bg-dark border-secondary text-white" />
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
                            {loading ? (studentToEdit ? 'Updating...' : 'Creating...') : (studentToEdit ? 'Update Student' : 'Create Student')}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddStudentModal;
