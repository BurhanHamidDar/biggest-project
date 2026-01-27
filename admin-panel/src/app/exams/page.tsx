"use client";
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Row, Col, Alert, Table, Badge, Modal } from 'react-bootstrap';
import { FaPlus, FaEdit, FaClipboardList } from 'react-icons/fa';
import { fetchExams, createExam, fetchClasses, fetchSubjects, addExamSubject, fetchExamSubjects, fetchPendingMarksheets, deleteExam } from '@/services/api';
import MarksEntryModal from '@/components/MarksEntryModal';
import { FaTrash } from 'react-icons/fa';

export default function ExamsPage() {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Tabs: 'config' | 'results'
    const [activeTab, setActiveTab] = useState('config');

    // Create Exam Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newExam, setNewExam] = useState({ name: '', start_date: '', end_date: '' });

    // Exam Subjects (Curriculum)
    const [examSubjects, setExamSubjects] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    // Pending Marksheets
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [selectedClassForResults, setSelectedClassForResults] = useState('');
    const [selectedSectionForResults, setSelectedSectionForResults] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedStudentForUpload, setSelectedStudentForUpload] = useState<any>(null);

    // Add Subject Modal
    const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
    const [newSubject, setNewSubject] = useState({ class_id: '', subject_id: '', max_marks: 100, pass_marks: 35, exam_date: '' });

    // Marks Entry
    const [showMarksModal, setShowMarksModal] = useState(false);
    const [selectedExamSubject, setSelectedExamSubject] = useState<any>(null);

    useEffect(() => {
        loadExams();
        fetchClasses().then(setClasses);
        fetchSubjects().then(setSubjects);
    }, []);

    const loadExams = async () => {
        setLoading(true);
        try {
            const data = await fetchExams();
            setExams(data);
            if (data.length > 0 && !selectedExam) setSelectedExam(data[0]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedExam) {
            loadExamSubjects(selectedExam.id);
            // Reset Results items when exam changes
            setPendingStudents([]);
            setSelectedClassForResults('');
            setSelectedSectionForResults('');
        }
    }, [selectedExam]);

    const loadExamSubjects = async (examId: string) => {
        try {
            const data = await fetchExamSubjects(examId);
            setExamSubjects(data);
        } catch (err) { console.error(err); }
    };

    const loadPendingMarksheets = async () => {
        if (!selectedExam || !selectedClassForResults) return;
        try {
            const data = await fetchPendingMarksheets(selectedExam.id, selectedClassForResults);
            setPendingStudents(data);
        } catch (err: any) {
            alert(err.message);
        }
    };

    useEffect(() => {
        if (activeTab === 'results' && selectedClassForResults) {
            // Need to handle section if filtering by section is required for marksheets?
            // Currently fetchPendingMarksheets takes class_id.
            // If we want to support section, we check if backend supports it.
            // But we primarily need Section for the Grid View.
            loadPendingMarksheets();
        }
    }, [activeTab, selectedClassForResults]);

    // Computed Sections
    const availableSections = classes.find(c => c.id === selectedClassForResults)?.sections || [];

    const handleCreateExam = async () => {
        try {
            await createExam(newExam);
            setShowCreateModal(false);
            setNewExam({ name: '', start_date: '', end_date: '' });
            loadExams();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleAddSubject = async () => {
        try {
            await addExamSubject({ ...newSubject, exam_id: selectedExam.id });
            setShowAddSubjectModal(false);
            loadExamSubjects(selectedExam.id);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteExam = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent selecting the exam
        if (!confirm('Are you sure you want to delete this exam? This will delete all associated subjects and marks.')) return;
        try {
            await deleteExam(id);
            if (selectedExam?.id === id) setSelectedExam(null);
            loadExams();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEnterMarks = (es: any) => {
        setSelectedExamSubject(es);
        setShowMarksModal(true);
    };

    const handleApproveFromDashboard = async () => {
        if (!selectedStudentForUpload) return;
        try {
            const { uploadMarksheet } = require('@/services/api'); // Dynamic import if needed or just use imported
            await uploadMarksheet({
                student_id: selectedStudentForUpload.student_id,
                exam_id: selectedExam.id,
                file_url: 'APPROVED'
            });
            setShowUploadModal(false);
            loadPendingMarksheets();
        } catch (err: any) {
            alert('Approval Failed: ' + err.message);
        }
    };

    const openUploadModal = (student: any) => {
        setSelectedStudentForUpload(student);
        setShowUploadModal(true);
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white fw-bold">Exams & Results</h2>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <FaPlus className="me-2" /> Create New Exam
                </Button>
            </div>

            <Row>
                <Col md={3}>
                    <Card className="bg-dark-navy border-0 text-white mb-3">
                        <Card.Header className="fw-bold border-secondary">Exams List</Card.Header>
                        <Card.Body className="p-0">
                            <div className="list-group list-group-flush bg-dark">
                                {exams.map(ex => (
                                    <button
                                        key={ex.id}
                                        className={`list-group-item list-group-item-action bg-dark text-white border-secondary ${selectedExam?.id === ex.id ? 'active' : ''}`}
                                        onClick={() => setSelectedExam(ex)}
                                    >
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span>{ex.name}</span>
                                            <div className="d-flex align-items-center">
                                                {selectedExam?.id === ex.id && <Badge bg="light" text="dark" className="me-2">Selected</Badge>}
                                                <span
                                                    className="text-danger p-1 hover-scale"
                                                    onClick={(e) => handleDeleteExam(ex.id, e)}
                                                    role="button"
                                                >
                                                    <FaTrash size={12} />
                                                </span>
                                            </div>
                                        </div>
                                        <small className="text-muted">{ex.start_date}</small>
                                    </button>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={9}>
                    {selectedExam ? (
                        <Card className="bg-dark-navy border-0 text-white shadow-sm">
                            <Card.Header className="border-secondary pb-0">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0">Managing: {selectedExam.name}</h5>

                                    <Form.Check
                                        type="switch"
                                        id="publish-switch"
                                        label={selectedExam.is_published ? "Published (Visible)" : "Draft (Hidden)"}
                                        checked={selectedExam.is_published || false}
                                        className={selectedExam.is_published ? "text-success fw-bold" : "text-warning fw-bold"}
                                        onChange={async (e) => {
                                            const newVal = e.target.checked;
                                            try {
                                                const { updateExam } = require('@/services/api');
                                                await updateExam(selectedExam.id, { is_published: newVal });

                                                // Update Local State
                                                const updatedExam = { ...selectedExam, is_published: newVal };
                                                setSelectedExam(updatedExam);

                                                // Update List
                                                setExams(prev => prev.map(ex => ex.id === selectedExam.id ? updatedExam : ex));

                                                alert(`Exam ${newVal ? 'Published' : 'Unpublished'} Successfully`);
                                            } catch (err: any) {
                                                alert('Failed to update: ' + err.message);
                                                e.target.checked = !newVal; // Revert UI
                                            }
                                        }}
                                    />
                                </div>
                                <ul className="nav nav-tabs border-bottom-0">
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link text-white ${activeTab === 'config' ? 'active bg-dark border-secondary border-bottom-0' : ''}`}
                                            onClick={() => setActiveTab('config')}
                                        >
                                            Subjects & Marks
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link text-white ${activeTab === 'results' ? 'active bg-dark border-secondary border-bottom-0' : ''}`}
                                            onClick={() => setActiveTab('results')}
                                        >
                                            Student Marksheets
                                        </button>
                                    </li>
                                </ul>
                            </Card.Header>
                            <Card.Body className="bg-dark border-top border-secondary">
                                {activeTab === 'config' ? (
                                    <>
                                        <div className="d-flex justify-content-end mb-3">
                                            <Button variant="success" size="sm" onClick={() => setShowAddSubjectModal(true)}>
                                                <FaPlus className="me-2" /> Add Subject
                                            </Button>
                                        </div>
                                        <Table hover variant="dark" responsive>
                                            <thead>
                                                <tr>
                                                    <th>Class</th>
                                                    <th>Subject</th>
                                                    <th>Date</th>
                                                    <th>Max Marks</th>
                                                    <th>Pass Marks</th>
                                                    <th className="text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {examSubjects.map(es => (
                                                    <tr key={es.id}>
                                                        <td className="fw-bold">{es.classes?.name}</td>
                                                        <td>{es.subjects?.name} ({es.subjects?.code})</td>
                                                        <td>{es.exam_date}</td>
                                                        <td>{es.max_marks}</td>
                                                        <td>{es.pass_marks}</td>
                                                        <td className="text-end">
                                                            <Button variant="info" size="sm" onClick={() => handleEnterMarks(es)}>
                                                                <FaClipboardList className="me-1" /> Enter Marks
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {examSubjects.length === 0 && (
                                                    <tr><td colSpan={6} className="text-center text-muted py-4">No subjects added to this exam yet.</td></tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </>
                                ) : (
                                    <>
                                        {/* Marksheets Tab */}
                                        <div className="mb-4">
                                            <Row className="g-3 align-items-end">
                                                <Col md={3}>
                                                    <Form.Label>Class</Form.Label>
                                                    <Form.Select
                                                        className="bg-dark text-white border-secondary"
                                                        value={selectedClassForResults}
                                                        onChange={(e) => {
                                                            setSelectedClassForResults(e.target.value);
                                                            setSelectedSectionForResults('');
                                                        }}
                                                    >
                                                        <option value="">Select Class</option>
                                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </Form.Select>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Label>Section</Form.Label>
                                                    <Form.Select
                                                        className="bg-dark text-white border-secondary"
                                                        value={selectedSectionForResults}
                                                        onChange={(e) => setSelectedSectionForResults(e.target.value)}
                                                        disabled={!selectedClassForResults}
                                                    >
                                                        <option value="">Select Section</option>
                                                        {availableSections.map((s: any) => <option key={s.id} value={s.id}>{s.name || s.section_name || s.id}</option>)}
                                                    </Form.Select>
                                                </Col>
                                                <Col md={3}>
                                                    <Button
                                                        href={`/exams/${selectedExam?.id}/results?class=${selectedClassForResults}&section=${selectedSectionForResults}&examName=${selectedExam?.name}`}
                                                        variant="primary"
                                                        disabled={!selectedClassForResults || !selectedSectionForResults}
                                                        className="w-100"
                                                    >
                                                        <FaClipboardList className="me-2" /> View Results Matrix
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </div>

                                        {selectedClassForResults && (
                                            <Table hover variant="dark" responsive>
                                                <thead>
                                                    <tr>
                                                        <th>Admission No.</th>
                                                        <th>Student Name</th>
                                                        <th>Marksheet Status</th>
                                                        <th className="text-end">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pendingStudents.length === 0 ? (
                                                        <tr><td colSpan={4} className="text-center py-4 text-muted">No students found or loading...</td></tr>
                                                    ) : (
                                                        pendingStudents.map(student => (
                                                            <tr key={student.student_id}>
                                                                <td>{student.admission_no}</td>
                                                                <td className="fw-bold">{student.name}</td>
                                                                <td>
                                                                    {student.has_marksheet ? (
                                                                        <Badge bg="success">Uploaded</Badge>
                                                                    ) : (
                                                                        <Badge bg="warning" text="dark">Pending</Badge>
                                                                    )}
                                                                </td>
                                                                <td className="text-end">
                                                                    {student.has_marksheet ? (
                                                                        <Badge bg="success" className="p-2">Approved</Badge>
                                                                    ) : (
                                                                        <Button variant="success" size="sm" onClick={() => openUploadModal(student)}>
                                                                            Approve Result
                                                                        </Button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </Table>
                                        )}
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    ) : (
                        <Alert variant="info">Select an exam to manage subjects and marks.</Alert>
                    )}
                </Col>
            </Row>

            {/* Create Exam Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white border-secondary">
                    <Modal.Title>Create New Exam</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Form.Group className="mb-3">
                        <Form.Label>Exam Name</Form.Label>
                        <Form.Control type="text" placeholder="e.g. Mid-Term 2024" className="bg-dark text-white border-secondary"
                            value={newExam.name} onChange={e => setNewExam({ ...newExam, name: e.target.value })} />
                    </Form.Group>
                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control type="date" className="bg-dark text-white border-secondary"
                                    value={newExam.start_date} onChange={e => setNewExam({ ...newExam, start_date: e.target.value })} />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control type="date" className="bg-dark text-white border-secondary"
                                    value={newExam.end_date} onChange={e => setNewExam({ ...newExam, end_date: e.target.value })} />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreateExam}>Create Exam</Button>
                </Modal.Footer>
            </Modal>

            {/* Add Subject Modal */}
            <Modal show={showAddSubjectModal} onHide={() => setShowAddSubjectModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white border-secondary">
                    <Modal.Title>Add Subject to Exam</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Form.Group className="mb-3">
                        <Form.Label>Class</Form.Label>
                        <Form.Select className="bg-dark text-white border-secondary"
                            value={newSubject.class_id} onChange={e => setNewSubject({ ...newSubject, class_id: e.target.value })}>
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Subject</Form.Label>
                        <Form.Select className="bg-dark text-white border-secondary"
                            value={newSubject.subject_id} onChange={e => setNewSubject({ ...newSubject, subject_id: e.target.value })}>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                        </Form.Select>
                        <Form.Text className="text-muted">
                            Don't see your subject? <a href="/subjects" className="text-info text-decoration-none">Create New Subject</a>
                        </Form.Text>
                    </Form.Group>
                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Max Marks</Form.Label>
                                <Form.Control type="number" className="bg-dark text-white border-secondary"
                                    value={newSubject.max_marks || ''} onChange={e => setNewSubject({ ...newSubject, max_marks: e.target.value ? parseInt(e.target.value) : 0 })} />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Pass Marks</Form.Label>
                                <Form.Control type="number" className="bg-dark text-white border-secondary"
                                    value={newSubject.pass_marks || ''} onChange={e => setNewSubject({ ...newSubject, pass_marks: e.target.value ? parseInt(e.target.value) : 0 })} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Exam Date</Form.Label>
                        <Form.Control type="date" className="bg-dark text-white border-secondary"
                            value={newSubject.exam_date} onChange={e => setNewSubject({ ...newSubject, exam_date: e.target.value })} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="secondary" onClick={() => setShowAddSubjectModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={handleAddSubject} disabled={!newSubject.class_id || !newSubject.subject_id}>Add Subject</Button>
                </Modal.Footer>
            </Modal>

            {/* Marks Entry Modal */}
            {selectedExamSubject && (
                <MarksEntryModal
                    show={showMarksModal}
                    handleClose={() => setShowMarksModal(false)}
                    examSubjectId={selectedExamSubject.id}
                    classId={selectedExamSubject.class_id}
                    sectionId="" // Empty to fetch all sections or add selector
                    subjectName={selectedExamSubject.subjects?.name}
                    className={selectedExamSubject.classes?.name}
                    maxMarks={selectedExamSubject.max_marks}
                />
            )}

            {/* Confirmation Modal for Approval */}
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white border-secondary">
                    <Modal.Title>Confirm Approval</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <p>Are you sure you want to approve the result for <strong>{selectedStudentForUpload?.name}</strong>?</p>
                    <p className="text-muted small">This will make the result visible to the student immediately.</p>
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={handleApproveFromDashboard}>Confirm Approval</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
