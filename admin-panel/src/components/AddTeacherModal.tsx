"use client";
import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { createTeacher, updateTeacher } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

interface AddTeacherModalProps {
    show: boolean;
    handleClose: () => void;
    onSuccess: () => void;
    teacherToEdit?: any;
}

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ show, handleClose, onSuccess, teacherToEdit }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        address: '',
        joining_date: '',
        qualification: '',
        department: '',
        department: '',
        dob: '',
        avatar_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show && teacherToEdit) {
            setFormData({
                full_name: teacherToEdit.profiles?.full_name || '',
                email: teacherToEdit.profiles?.email || '',
                phone_number: teacherToEdit.profiles?.phone_number || '',
                address: teacherToEdit.profiles?.address || '',
                joining_date: teacherToEdit.joining_date || '',
                qualification: teacherToEdit.qualification || '',
                department: teacherToEdit.department || '',
                dob: teacherToEdit.dob || '', // Allow editing DOB
                avatar_url: teacherToEdit.profiles?.avatar_url || ''
            });
        } else if (show) {
            setFormData({
                full_name: '', email: '', phone_number: '', address: '',
                joining_date: '', qualification: '', department: '', dob: '', avatar_url: ''
            });
        }
    }, [show, teacherToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `teacher-${Math.random()}.${fileExt}`;
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
            if (teacherToEdit) {
                await updateTeacher(teacherToEdit.profile_id, formData);
            } else {
                await createTeacher(formData);
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
                <Modal.Title>{teacherToEdit ? 'Edit Teacher' : 'Add New Teacher'}</Modal.Title>
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
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email (Username) *</Form.Label>
                                <Form.Control required type="email" name="email" value={formData.email} onChange={handleChange} className="bg-dark border-secondary text-white" disabled={!!teacherToEdit} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date of Birth</Form.Label>
                                <Form.Control required={!teacherToEdit} type="date" name="dob" value={formData.dob} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Joining Date *</Form.Label>
                                <Form.Control required type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Qualification</Form.Label>
                                <Form.Control name="qualification" value={formData.qualification} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Department</Form.Label>
                                <Form.Control name="department" value={formData.department} onChange={handleChange} className="bg-dark border-secondary text-white" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Phone Number *</Form.Label>
                                <Form.Control required name="phone_number" value={formData.phone_number} onChange={handleChange} className="bg-dark border-secondary text-white" />
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
                            {loading ? (teacherToEdit ? 'Updating...' : 'Creating...') : (teacherToEdit ? 'Update Teacher' : 'Create Teacher')}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddTeacherModal;
