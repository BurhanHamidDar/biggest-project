"use client";
import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Form, Row, Col, Alert, Modal, Spinner } from 'react-bootstrap';
import { FaPlus, FaFilter, FaTrash } from 'react-icons/fa';
import { fetchSubjects, createSubject, deleteSubject } from '@/services/api';

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: '', code: '', description: '' });

    const loadSubjects = async () => {
        try {
            setLoading(true);
            const data = await fetchSubjects();
            setSubjects(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    const handleCreate = async () => {
        try {
            await createSubject(newSubject);
            setNewSubject({ name: '', code: '', description: '' });
            setShowModal(false);
            loadSubjects();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this subject?')) {
            try {
                await deleteSubject(id);
                loadSubjects();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white fw-bold">Subjects</h2>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <FaPlus className="me-2" /> Add New Subject
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <Table hover variant="dark" className="mb-0 align-middle">
                        <thead>
                            <tr>
                                <th className="py-3 ps-4">Code</th>
                                <th className="py-3">Name</th>
                                <th className="py-3">Description</th>
                                <th className="py-3 text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-5"><Spinner animation="border" variant="light" /></td></tr>
                            ) : subjects.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-5 text-muted">No subjects found.</td></tr>
                            ) : (
                                subjects.map((sub) => (
                                    <tr key={sub.id}>
                                        <td className="ps-4 text-info fw-bold">{sub.code}</td>
                                        <td className="fw-bold">{sub.name}</td>
                                        <td>{sub.description || '-'}</td>
                                        <td className="text-end pe-4">
                                            <Button variant="link" size="sm" className="text-danger" onClick={() => handleDelete(sub.id)}>
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
                    <Modal.Title>Add New Subject</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Form.Group className="mb-3">
                        <Form.Label>Subject Name</Form.Label>
                        <Form.Control
                            value={newSubject.name}
                            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                            className="bg-dark border-secondary text-white"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Subject Code (e.g. MATH101)</Form.Label>
                        <Form.Control
                            value={newSubject.code}
                            onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                            className="bg-dark border-secondary text-white"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description (Optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={newSubject.description}
                            onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                            className="bg-dark border-secondary text-white"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreate} disabled={!newSubject.name || !newSubject.code}>Create</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
