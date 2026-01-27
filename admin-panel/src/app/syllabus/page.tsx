"use client";
import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Form, Row, Col, Alert, Modal, Spinner } from 'react-bootstrap';
import { FaPlus, FaTrash, FaFileAlt } from 'react-icons/fa';
import { fetchSyllabus, createSyllabus, deleteSyllabus, fetchClasses, fetchSubjects } from '@/services/api';

export default function SyllabusPage() {
    const [syllabusList, setSyllabusList] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Filters
    const [selectedClass, setSelectedClass] = useState('');

    // New Syllabus Form State
    const [newSyllabus, setNewSyllabus] = useState({
        class_id: '',
        section_id: '',
        subject_id: '',
        title: '',
        description: '',
        file_url: ''
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [sylData, clsData, subData] = await Promise.all([
                fetchSyllabus(selectedClass), // Support filtering by class
                fetchClasses(),
                fetchSubjects()
            ]);
            setSyllabusList(sylData);
            // Ensure classes have sections (assuming API returns them, if not we might need to fetch)
            setClasses(clsData);
            setSubjects(subData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedClass]);

    const handleCreate = async () => {
        try {
            if (!newSyllabus.title) newSyllabus.title = `${getSubjectName(newSyllabus.subject_id)} Syllabus`; // Fallback title

            await createSyllabus(newSyllabus);
            setNewSyllabus({ class_id: '', section_id: '', subject_id: '', title: '', description: '', file_url: '' });
            setShowModal(false);
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this syllabus entry?')) {
            try {
                await deleteSyllabus(id);
                loadData();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'Unknown Class';
    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown Subject';

    // Helper to get sections for selected class in Modal
    const getModalSections = () => {
        const cls = classes.find(c => c.id === newSyllabus.class_id);
        return cls?.sections || [];
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white fw-bold">Syllabus Management</h2>
                <div className="d-flex gap-2">
                    <Form.Select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="bg-dark text-white border-secondary"
                        style={{ width: '200px' }}
                    >
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        <FaPlus className="me-2" /> Add Syllabus
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <Table hover variant="dark" className="mb-0 align-middle">
                        <thead>
                            <tr>
                                <th className="py-3 ps-4">Class</th>
                                <th className="py-3">Subject</th>
                                <th className="py-3">Title / Description</th>
                                <th className="py-3">Link</th>
                                <th className="py-3 text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-5"><Spinner animation="border" variant="light" /></td></tr>
                            ) : syllabusList.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-5 text-muted">No syllabus entries found.</td></tr>
                            ) : (
                                syllabusList.map((item) => (
                                    <tr key={item.id}>
                                        <td className="ps-4 fw-bold text-info">{item.classes?.name || getClassName(item.class_id)}</td>
                                        <td className="fw-bold">{item.subjects?.name || getSubjectName(item.subject_id)}</td>
                                        <td>
                                            <div className="fw-bold">{item.title}</div>
                                            <small className="text-muted">{item.description}</small>
                                        </td>
                                        <td>
                                            {item.file_url ? (
                                                <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none">
                                                    <FaFileAlt className="me-1" /> View File
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="text-end pe-4">
                                            <Button variant="link" size="sm" className="text-danger" onClick={() => handleDelete(item.id)}>
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white border-secondary">
                    <Modal.Title>Add Syllabus</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Form.Group className="mb-3">
                        <Form.Label>Class</Form.Label>
                        <Form.Select
                            value={newSyllabus.class_id}
                            onChange={(e) => setNewSyllabus({ ...newSyllabus, class_id: e.target.value })}
                            className="bg-dark border-secondary text-white"
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Subject</Form.Label>
                        <Form.Select
                            value={newSyllabus.subject_id}
                            onChange={(e) => setNewSyllabus({ ...newSyllabus, subject_id: e.target.value })}
                            className="bg-dark border-secondary text-white"
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Math Syllabus Term 1"
                            value={newSyllabus.title}
                            onChange={(e) => setNewSyllabus({ ...newSyllabus, title: e.target.value })}
                            className="bg-dark border-secondary text-white"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description (Optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={newSyllabus.description}
                            onChange={(e) => setNewSyllabus({ ...newSyllabus, description: e.target.value })}
                            className="bg-dark border-secondary text-white"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>File URL (Google Drive / PDF Link)</Form.Label>
                        <Form.Control
                            type="url"
                            value={newSyllabus.file_url}
                            onChange={(e) => setNewSyllabus({ ...newSyllabus, file_url: e.target.value })}
                            className="bg-dark border-secondary text-white"
                            placeholder="https://..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreate} disabled={!newSyllabus.class_id || !newSyllabus.subject_id || !newSyllabus.file_url}>
                        Upload Syllabus
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
