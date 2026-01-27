"use client";
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Row, Col, Alert, Table, Badge, Modal, Tabs, Tab } from 'react-bootstrap';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import { fetchFeeTypes, createFeeType, fetchClasses, fetchFeeStructure, createFeeStructure } from '@/services/api';

export default function FeesPage() {
    const [feeTypes, setFeeTypes] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showStructModal, setShowStructModal] = useState(false);

    // Forms
    const [newType, setNewType] = useState({ name: '', description: '' });
    const [newStruct, setNewStruct] = useState({ class_id: '', fee_type_id: '', amount: 0, due_date: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ft, fs, cl] = await Promise.all([
                fetchFeeTypes(),
                fetchFeeStructure(),
                fetchClasses()
            ]);
            setFeeTypes(ft);
            setFeeStructures(fs);
            setClasses(cl);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateType = async () => {
        await createFeeType(newType.name, newType.description);
        setShowTypeModal(false);
        setNewType({ name: '', description: '' });
        loadData();
    };

    const handleCreateStruct = async () => {
        await createFeeStructure(newStruct);
        setShowStructModal(false);
        setNewStruct({ class_id: '', fee_type_id: '', amount: 0, due_date: '' });
        loadData();
    };

    return (
        <Container fluid>
            <h2 className="text-white fw-bold mb-4">Fee Management</h2>

            <Tabs defaultActiveKey="structure" className="mb-4 custom-tabs">
                <Tab eventKey="structure" title={<span className="text-white">Fee Structures</span>}>
                    <Card className="bg-dark-navy text-white shadow-sm border-0">
                        <Card.Header className="d-flex justify-content-between align-items-center border-secondary py-3">
                            <h5 className="mb-0">Class Fee Structures</h5>
                            <Button variant="success" size="sm" onClick={() => setShowStructModal(true)}>
                                <FaPlus className="me-2" /> Add Fee to Class
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <Table hover variant="dark" responsive>
                                <thead>
                                    <tr>
                                        <th>Class</th>
                                        <th>Fee Type</th>
                                        <th>Amount</th>
                                        <th>Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feeStructures.map(fs => (
                                        <tr key={fs.id}>
                                            <td className="fw-bold">{fs.classes?.name}</td>
                                            <td>{fs.fee_types?.name}</td>
                                            <td className="text-success fw-bold">₹{fs.amount}</td>
                                            <td>{fs.due_date}</td>
                                        </tr>
                                    ))}
                                    {feeStructures.length === 0 && <tr><td colSpan={4} className="text-center text-muted">No fee structures defined.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="types" title={<span className="text-white">Fee Types</span>}>
                    <Card className="bg-dark-navy text-white shadow-sm border-0">
                        <Card.Header className="d-flex justify-content-between align-items-center border-secondary py-3">
                            <h5 className="mb-0">Master Fee Types</h5>
                            <Button variant="info" size="sm" onClick={() => setShowTypeModal(true)}>
                                <FaPlus className="me-2" /> Create Fee Type
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <Table hover variant="dark">
                                <thead><tr><th>Name</th><th>Description</th></tr></thead>
                                <tbody>
                                    {feeTypes.map(ft => (
                                        <tr key={ft.id}>
                                            <td className="fw-bold">{ft.name}</td>
                                            <td>{ft.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Create Type Modal */}
            <Modal show={showTypeModal} onHide={() => setShowTypeModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white border-secondary"><Modal.Title>Create Fee Type</Modal.Title></Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Form.Control placeholder="Name (e.g. Tuition Fee)" value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value })} className="bg-dark text-white border-secondary mb-3" />
                    <Form.Control placeholder="Description" value={newType.description} onChange={e => setNewType({ ...newType, description: e.target.value })} className="bg-dark text-white border-secondary" />
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="primary" onClick={handleCreateType}>Create</Button>
                </Modal.Footer>
            </Modal>

            {/* Create Structure Modal */}
            <Modal show={showStructModal} onHide={() => setShowStructModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white border-secondary"><Modal.Title>Assign Fee to Class</Modal.Title></Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Form.Select className="bg-dark text-white border-secondary mb-3" value={newStruct.class_id} onChange={e => setNewStruct({ ...newStruct, class_id: e.target.value })}>
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                    <Form.Select className="bg-dark text-white border-secondary mb-3" value={newStruct.fee_type_id} onChange={e => setNewStruct({ ...newStruct, fee_type_id: e.target.value })}>
                        <option value="">Select Fee Type</option>
                        {feeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Form.Select>
                    <Form.Control type="number" placeholder="Amount" value={newStruct.amount || ''} onChange={e => setNewStruct({ ...newStruct, amount: e.target.value ? parseInt(e.target.value) : 0 })} className="bg-dark text-white border-secondary mb-3" />
                    <Form.Control type="date" placeholder="Due Date" value={newStruct.due_date} onChange={e => setNewStruct({ ...newStruct, due_date: e.target.value })} className="bg-dark text-white border-secondary" />
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="primary" onClick={handleCreateStruct}>Assign</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
