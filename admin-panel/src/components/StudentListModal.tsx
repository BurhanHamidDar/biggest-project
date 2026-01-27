"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Table, Spinner, Button, Alert } from 'react-bootstrap';
import { fetchStudents, fetchBusPassengers } from '@/services/api';

interface StudentListModalProps {
    show: boolean;
    handleClose: () => void;
    title: string;
    filters: any; // { class_id, bus_id, etc. }
}

const StudentListModal: React.FC<StudentListModalProps> = ({ show, handleClose, title, filters }) => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show && filters) {
            loadStudents();
        }
    }, [show, filters]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError('');
            let data;

            // Check if we are in "Bus Passenger" mode
            if (filters.bus_id) {
                data = await fetchBusPassengers(filters.bus_id);
            } else {
                data = await fetchStudents(filters);
            }

            setStudents(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white p-0">
                {error && <Alert variant="danger" className="m-3">{error}</Alert>}

                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="light" /></div>
                ) : (
                    <Table hover variant="dark" className="mb-0 align-middle">
                        <thead>
                            <tr>
                                <th className="ps-4">Name</th>
                                <th>Admission No</th>
                                <th>Class/Sec</th>
                                <th>Parent Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length > 0 ? (
                                students.map((s) => (
                                    <tr key={s.profile_id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle overflow-hidden bg-secondary border border-secondary me-3" style={{ width: 40, height: 40, minWidth: 40 }}>
                                                    {s.profiles?.avatar_url ? (
                                                        <img src={s.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white-50 small">
                                                            {s.profiles?.full_name?.charAt(0) || 'S'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="fw-bold">{s.profiles?.full_name}</div>
                                                    <div className="small text-white-50">{s.profiles?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{s.admission_no}</td>
                                        <td>
                                            {s.classes?.name} {s.sections?.name ? `- ${s.sections?.name}` : ''}
                                        </td>
                                        <td>
                                            <div>{s.parent_name}</div>
                                            <div className="small text-info">{s.parent_phone}</div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-4 text-muted">No students found.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-dark border-secondary">
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default StudentListModal;
