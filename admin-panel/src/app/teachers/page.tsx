"use client";
import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaFilter } from 'react-icons/fa';
import { fetchTeachers, deleteTeacher } from '@/services/api';
import AddTeacherModal from '@/components/AddTeacherModal';
import AllocationModal from '@/components/AllocationModal';

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]); // For search result
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<any>(null);

    // Allocations
    const [showAllocModal, setShowAllocModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

    const loadTeachers = async () => {
        try {
            setLoading(true);
            const data = await fetchTeachers();
            setTeachers(data);
            setFilteredTeachers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTeachers();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (!searchTerm) {
            setFilteredTeachers(teachers);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = teachers.filter(t =>
                t.profiles?.full_name?.toLowerCase().includes(lower) ||
                t.department?.toLowerCase().includes(lower) ||
                t.profiles?.email?.toLowerCase().includes(lower)
            );
            setFilteredTeachers(filtered);
        }
    }, [searchTerm, teachers]);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this teacher?')) {
            try {
                await deleteTeacher(id);
                loadTeachers();
            } catch (err: any) {
                alert(err.message);
            }
        }
    }

    const handleEdit = (teacher: any) => {
        setSelectedTeacherForEdit(teacher);
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setSelectedTeacherForEdit(null);
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white fw-bold">Teachers</h2>
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    <FaPlus className="me-2" /> Add New Teacher
                </Button>
            </div>

            <AddTeacherModal
                show={showAddModal}
                handleClose={handleCloseModal}
                onSuccess={() => { loadTeachers(); }}
                teacherToEdit={selectedTeacherForEdit}
            />

            {selectedTeacher && (
                <AllocationModal
                    show={showAllocModal}
                    handleClose={() => setShowAllocModal(false)}
                    teacher={selectedTeacher}
                />
            )}

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="bg-dark border-0 mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Control
                                type="text"
                                placeholder="Search by name, email or department..."
                                className="bg-secondary text-white border-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover variant="dark" className="mb-0 align-middle">
                            <thead>
                                <tr>
                                    <th className="py-3 ps-4">Name</th>
                                    <th className="py-3">Department</th>
                                    <th className="py-3">Qualification</th>
                                    <th className="py-3">Phone</th>
                                    <th className="py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-5"><Spinner animation="border" variant="light" /></td></tr>
                                ) : filteredTeachers.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-5 text-muted">No teachers found.</td></tr>
                                ) : (
                                    filteredTeachers.map((teacher, index) => (
                                        <tr key={teacher.profile_id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="rounded-circle overflow-hidden bg-secondary border border-secondary me-3" style={{ width: 40, height: 40, minWidth: 40 }}>
                                                        {teacher.profiles?.avatar_url ? (
                                                            <img src={teacher.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white-50 small">
                                                                {teacher.profiles?.full_name?.charAt(0) || 'T'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{teacher.profiles?.full_name}</div>
                                                        <small className="text-white-50">{teacher.profiles?.email}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{teacher.department}</td>
                                            <td>{teacher.qualification}</td>
                                            <td>{teacher.profiles?.phone_number}</td>
                                            <td className="text-end pe-4">
                                                <Button variant="outline-warning" size="sm" className="me-2" onClick={() => { setSelectedTeacher(teacher); setShowAllocModal(true); }}>Allocations</Button>
                                                <Button variant="link" size="sm" className="text-info me-2" onClick={() => handleEdit(teacher)}>Edit</Button>
                                                <Button variant="link" size="sm" className="text-danger" onClick={() => handleDelete(teacher.profile_id)}>Delete</Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}
