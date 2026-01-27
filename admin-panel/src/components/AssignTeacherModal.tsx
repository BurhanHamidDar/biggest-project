"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { fetchTeachers, assignClassTeacher } from '@/services/api';

interface AssignTeacherModalProps {
    show: boolean;
    handleClose: () => void;
    classId: string;
    sectionId: string;
    sectionName: string;
    className: string;
    onSuccess: () => void;
}

const AssignTeacherModal: React.FC<AssignTeacherModalProps> = ({
    show, handleClose, classId, sectionId, sectionName, className, onSuccess
}) => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            fetchTeachers().then(setTeachers).catch(err => console.error(err));
        }
    }, [show]);

    const handleAssign = async () => {
        try {
            setLoading(true);
            await assignClassTeacher({
                teacher_id: selectedTeacher,
                class_id: classId,
                section_id: sectionId
            });
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>Assign HR Teacher</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white">
                <p className="text-secondary mb-3">
                    Assign a Class Teacher for <strong>{className} - Section {sectionName}</strong>.<br />
                    <small>This teacher will be responsible for marking attendance.</small>
                </p>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form.Group>
                    <Form.Label>Select Teacher</Form.Label>
                    <Form.Select
                        className="bg-dark text-white border-secondary"
                        value={selectedTeacher}
                        onChange={e => setSelectedTeacher(e.target.value)}
                    >
                        <option value="">-- Select --</option>
                        {teachers.map(t => (
                            <option key={t.profile_id} value={t.profile_id}>
                                {t.profiles?.full_name} ({t.department || 'N/A'})
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer className="bg-dark border-secondary">
                <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button variant="success" onClick={handleAssign} disabled={!selectedTeacher || loading}>
                    {loading ? 'Assigning...' : 'Assign Teacher'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AssignTeacherModal;
