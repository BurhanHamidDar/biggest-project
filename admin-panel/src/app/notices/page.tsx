"use client";
import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, Row, Col, Alert, Modal, ListGroup, Badge } from 'react-bootstrap';
import { FaPlus, FaTrash, FaBullhorn } from 'react-icons/fa';
import { fetchNotices, createNotice, deleteNotice } from '@/services/api';

export default function NoticesPage() {
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [newNotice, setNewNotice] = useState({ title: '', content: '', audience: 'all', importance: 'normal' });

    const loadNotices = async () => {
        try {
            setLoading(true);
            const data = await fetchNotices();
            setNotices(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotices();
    }, []);

    const handleCreate = async () => {
        try {
            await createNotice(newNotice);
            setNewNotice({ title: '', content: '', audience: 'all', importance: 'normal' });
            setShowModal(false);
            loadNotices();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this notice?')) {
            try {
                await deleteNotice(id);
                loadNotices();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const getImportanceBadge = (imp: string) => {
        switch (imp) {
            case 'high': return <Badge bg="danger">High</Badge>;
            case 'medium': return <Badge bg="warning" text="dark">Medium</Badge>;
            default: return <Badge bg="info">Normal</Badge>;
        }
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white fw-bold">Notices Board</h2>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <FaPlus className="me-2" /> Post New Notice
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                {notices.map((notice) => (
                    <Col md={6} lg={4} key={notice.id} className="mb-4">
                        <Card className="h-100 bg-dark-navy border-0 shadow-sm text-white">
                            <Card.Header className="bg-transparent border-secondary d-flex justify-content-between align-items-center">
                                <div>
                                    {getImportanceBadge(notice.importance)}
                                    <span className="ms-2 badge bg-secondary">
                                        {notice.target_role && notice.target_role.length > 0
                                            ? notice.target_role.join(' & ').toUpperCase()
                                            : 'ALL'}
                                    </span>
                                </div>
                                <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDelete(notice.id)}>
                                    <FaTrash />
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                <Card.Title className="fw-bold">{notice.title}</Card.Title>
                                <Card.Text className="text-white-50">{notice.content}</Card.Text>
                            </Card.Body>
                            <Card.Footer className="bg-transparent border-secondary text-muted small">
                                Posted on {new Date(notice.created_at).toLocaleDateString()}
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
                {notices.length === 0 && !loading && (
                    <Col>
                        <Alert variant="secondary" className="text-center">No notices posted yet.</Alert>
                    </Col>
                )}
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton className="bg-dark text-white border-secondary">
                    <Modal.Title>Create Notice</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            value={newNotice.title}
                            onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                            className="bg-dark border-secondary text-white"
                        />
                    </Form.Group>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Audience</Form.Label>
                                <Form.Select
                                    value={newNotice.audience}
                                    onChange={(e) => setNewNotice({ ...newNotice, audience: e.target.value })}
                                    className="bg-dark border-secondary text-white"
                                >
                                    <option value="all">All</option>
                                    <option value="teachers">Teachers</option>
                                    <option value="students">Students</option>
                                    <option value="parents">Parents</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Importance</Form.Label>
                                <Form.Select
                                    value={newNotice.importance}
                                    onChange={(e) => setNewNotice({ ...newNotice, importance: e.target.value })}
                                    className="bg-dark border-secondary text-white"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Content</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={newNotice.content}
                            onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                            className="bg-dark border-secondary text-white"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreate} disabled={!newNotice.title}>Post Notice</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
