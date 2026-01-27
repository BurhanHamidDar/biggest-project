"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Tab, Tabs, Alert, Spinner } from 'react-bootstrap';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { fetchClasses, fetchSubjects, fetchClassTeachers, assignClassTeacher, removeClassTeacher, fetchSubjectAssignments, assignSubjectTeacher, removeSubjectTeacher } from '@/services/api';

interface AllocationModalProps {
    show: boolean;
    handleClose: () => void;
    teacher: any; // The selected teacher object
}

const AllocationModal: React.FC<AllocationModalProps> = ({ show, handleClose, teacher }) => {
    const [activeTab, setActiveTab] = useState('subject');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [existingSubjectAllocations, setExistingSubjectAllocations] = useState<any[]>([]);

    // New Allocation Forms
    const [newSubjectAlloc, setNewSubjectAlloc] = useState({ class_id: '', section_id: '', subject_id: '' });

    // For HR Teacher View (we might just show if they are assigned)
    // Actually, HR assignment is usually 1 per class. It's better to show what they ARE assigned to.

    useEffect(() => {
        if (show && teacher) {
            loadData();
        }
    }, [show, teacher]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cl, sb, sa] = await Promise.all([
                fetchClasses(),
                fetchSubjects(),
                fetchSubjectAssignments(teacher.profile_id)
            ]);
            setClasses(cl);
            setSubjects(sb);
            setExistingSubjectAllocations(sa);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSubject = async () => {
        if (!newSubjectAlloc.class_id || !newSubjectAlloc.section_id || !newSubjectAlloc.subject_id) return;
        try {
            await assignSubjectTeacher({ ...newSubjectAlloc, teacher_id: teacher.profile_id });
            setNewSubjectAlloc({ class_id: '', section_id: '', subject_id: '' });
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleRemoveSubject = async (id: string) => {
        try {
            await removeSubjectTeacher(id);
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Helper to get sections for selected class
    const getSections = (classId: string) => {
        const cls = classes.find(c => c.id === classId);
        return cls?.sections || [];
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>Manage Allocations: {teacher?.profiles?.full_name}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white">
                {error && <Alert variant="danger">{error}</Alert>}

                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'subject')} className="mb-3 custom-tabs">
                    <Tab eventKey="subject" title="Subject Teacher">
                        <p className="text-muted small">Assign this teacher to specific subjects in classes. They will manage marks/homework for these.</p>

                        {/* Add New */}
                        <div className="d-flex gap-2 mb-3 align-items-end p-3 bg-dark-light rounded border border-secondary">
                            <div className="flex-grow-1">
                                <label className="small text-muted">Class</label>
                                <Form.Select
                                    className="bg-dark text-white border-secondary"
                                    value={newSubjectAlloc.class_id}
                                    onChange={e => setNewSubjectAlloc({ ...newSubjectAlloc, class_id: e.target.value, section_id: '' })}
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Form.Select>
                            </div>
                            <div className="flex-grow-1">
                                <label className="small text-muted">Section</label>
                                <Form.Select
                                    className="bg-dark text-white border-secondary"
                                    value={newSubjectAlloc.section_id}
                                    onChange={e => setNewSubjectAlloc({ ...newSubjectAlloc, section_id: e.target.value })}
                                    disabled={!newSubjectAlloc.class_id}
                                >
                                    <option value="">Select Section</option>
                                    {getSections(newSubjectAlloc.class_id).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Form.Select>
                            </div>
                            <div className="flex-grow-1">
                                <label className="small text-muted">Subject</label>
                                <Form.Select
                                    className="bg-dark text-white border-secondary"
                                    value={newSubjectAlloc.subject_id}
                                    onChange={e => setNewSubjectAlloc({ ...newSubjectAlloc, subject_id: e.target.value })}
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Form.Select>
                            </div>
                            <Button variant="success" onClick={handleAssignSubject}>Assign</Button>
                        </div>

                        {/* List */}
                        <Table hover variant="dark" size="sm">
                            <thead>
                                <tr><th>Class</th><th>Section</th><th>Subject</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {loading ? <tr><td colSpan={4} className="text-center">Loading...</td></tr> :
                                    existingSubjectAllocations.length === 0 ? <tr><td colSpan={4} className="text-center text-muted">No assignments yet.</td></tr> :
                                        existingSubjectAllocations.map(alloc => (
                                            <tr key={alloc.id}>
                                                <td>{alloc.classes?.name}</td>
                                                <td>{alloc.sections?.name}</td>
                                                <td>{alloc.subjects?.name}</td>
                                                <td><Button variant="link" className="text-danger p-0" onClick={() => handleRemoveSubject(alloc.id)}><FaTrash /></Button></td>
                                            </tr>
                                        ))}
                            </tbody>
                        </Table>
                    </Tab>

                    <Tab eventKey="hr" title="HR / Class Teacher">
                        <Alert variant="info">
                            <small>
                                To assign this teacher as an **HR Teacher**, please go to the **Classes** page.
                                HR assignment is done per Class/Section there to ensure one HR per section.
                            </small>
                        </Alert>
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    );
};

export default AllocationModal;
