"use client";
import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { fetchClasses, fetchStudents, fetchAttendance, markAttendance } from '@/services/api';

export default function AttendancePage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [students, setStudents] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<any>({}); // student_id -> status

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchClasses().then(setClasses).catch(console.error);
    }, []);

    // Load Data when selection changes
    useEffect(() => {
        if (selectedClass && selectedSection && selectedDate) {
            loadAttendanceData();
        } else {
            setStudents([]);
            setAttendanceMap({});
        }
    }, [selectedClass, selectedSection, selectedDate]);

    const loadAttendanceData = async () => {
        setLoading(true);
        setMessage('');
        try {
            // 1. Fetch all students in this class/section
            const studentsData = await fetchStudents({ class_id: selectedClass, section_id: selectedSection });
            setStudents(studentsData);

            // 2. Fetch existing attendance for this date
            const attendanceData = await fetchAttendance(selectedDate, selectedClass, selectedSection);

            // Initialize map with 'present' by default if no record, or existing status
            const initialMap: any = {};

            if (attendanceData && attendanceData.length > 0) {
                attendanceData.forEach((rec: any) => {
                    initialMap[rec.student_id] = rec.status;
                });
            } else {
                // Default to 'present' for all students
                studentsData.forEach((s: any) => {
                    initialMap[s.profile_id] = 'present';
                });
            }
            setAttendanceMap(initialMap);

        } catch (err: any) {
            console.error(err);
            setMessage('Error loading data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId: string, status: string) => {
        setAttendanceMap((prev: any) => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = Object.keys(attendanceMap).map(sid => ({
                student_id: sid,
                status: attendanceMap[sid],
                remarks: ''
            }));

            await markAttendance({
                date: selectedDate,
                class_id: selectedClass,
                section_id: selectedSection,
                marked_by: null, // Admin
                records
            });

            setMessage('Attendance saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setMessage('Error saving: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getSections = () => {
        const cls = classes.find(c => c.id === selectedClass);
        return cls ? cls.sections : [];
    };

    return (
        <Container fluid>
            <h2 className="text-white fw-bold mb-4">Attendance Management</h2>

            <Card className="bg-dark-navy border-0 shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="text-white">Class</Form.Label>
                            <Form.Select className="bg-dark text-white border-secondary" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="text-white">Section</Form.Label>
                            <Form.Select className="bg-dark text-white border-secondary" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} disabled={!selectedClass}>
                                <option value="">Select Section</option>
                                {getSections()?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="text-white">Date</Form.Label>
                            <Form.Control type="date" className="bg-dark text-white border-secondary" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                        </Col>
                        <Col md={3}>
                            <Button variant="primary w-100" onClick={loadAttendanceData} disabled={!selectedClass || !selectedSection}>
                                Refresh Data
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {message && <Alert variant={message.includes('Error') ? 'danger' : 'success'}>{message}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="light" /></div>
            ) : students.length === 0 ? (
                <div className="text-center text-muted py-5">Select Class, Section and Date to view student list.</div>
            ) : (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
                        <Table hover variant="dark" className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">Student Name</th>
                                    <th>Roll No</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.profile_id}>
                                        <td className="ps-4 fw-bold">{student.profiles?.full_name}</td>
                                        <td>{student.roll_no || '-'}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                {['present', 'absent', 'late', 'excused'].map(status => (
                                                    <Button
                                                        key={status}
                                                        size="sm"
                                                        variant={attendanceMap[student.profile_id] === status ?
                                                            (status === 'present' ? 'success' : status === 'absent' ? 'danger' : 'warning')
                                                            : 'outline-secondary'}
                                                        onClick={() => handleStatusChange(student.profile_id, status)}
                                                        className="text-capitalize"
                                                        style={{ minWidth: '80px' }}
                                                    >
                                                        {status}
                                                    </Button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                    <Card.Footer className="bg-dark border-0 p-3 text-end">
                        <Button variant="success" size="lg" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </Button>
                    </Card.Footer>
                </Card>
            )}
        </Container>
    );
}
