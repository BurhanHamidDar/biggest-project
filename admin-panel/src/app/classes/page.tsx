"use client";
import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, Row, Col, Alert, Accordion, Modal, useAccordionButton } from 'react-bootstrap';
import { FaPlus, FaTrash, FaUserTie } from 'react-icons/fa';
import { fetchClasses, createClass, createSection, deleteClass, fetchClassTeachers } from '@/services/api';
import StudentListModal from '@/components/StudentListModal';
import AssignTeacherModal from '@/components/AssignTeacherModal';

export default function ClassesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [classTeachers, setClassTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals
    const [showClassModal, setShowClassModal] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');

    // View Students Modal
    const [showStudentList, setShowStudentList] = useState(false);
    const [studentListTitle, setStudentListTitle] = useState('');
    const [studentFilters, setStudentFilters] = useState<any>(null);

    // Assign Teacher Modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignTarget, setAssignTarget] = useState({ classId: '', sectionId: '', className: '', sectionName: '' });

    const loadData = async () => {
        try {
            setLoading(true);
            const [clsData, ctData] = await Promise.all([fetchClasses(), fetchClassTeachers()]);
            setClasses(clsData);
            setClassTeachers(ctData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleViewStudents = (classId: string, className: string, sectionId?: string, sectionName?: string) => {
        setStudentFilters({ class_id: classId, section_id: sectionId });
        setStudentListTitle(sectionName ? `Students in ${className} - ${sectionName}` : `All Students in ${className}`);
        setShowStudentList(true);
    };

    const handleAssignTeacher = (classId: string, sectionId: string, className: string, sectionName: string) => {
        setAssignTarget({ classId, sectionId, className, sectionName });
        setShowAssignModal(true);
    };

    const getHRTeacher = (classId: string, sectionId: string) => {
        const assignment = classTeachers.find(ct => ct.class_id === classId && ct.section_id === sectionId);
        return assignment ? assignment.teachers?.profiles?.full_name : null;
    };

    const handleCreateClass = async () => {
        try {
            await createClass(newClassName);
            setNewClassName('');
            setShowClassModal(false);
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleCreateSection = async () => {
        try {
            await createSection(selectedClassId, newSectionName);
            setNewSectionName('');
            setShowSectionModal(false);
            loadData(); // Refresh to show new section
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteClass = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name} and all its sections?`)) {
            try {
                await deleteClass(id);
                loadData();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white fw-bold">Classes & Sections</h2>
                <Button variant="primary" onClick={() => setShowClassModal(true)}>
                    <FaPlus className="me-2" /> Add New Class
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Accordion defaultActiveKey="0">
                {classes.map((cls, idx) => (
                    <Accordion.Item eventKey={idx.toString()} key={cls.id} className="bg-dark-navy mb-3 border-0 rounded overflow-hidden">
                        <div className="bg-dark-navy text-white p-3 d-flex justify-content-between align-items-center">
                            <span className="fw-bold fs-5" style={{ cursor: 'pointer' }} onClick={(e: any) => {
                                // Find the button trigger programmatically or use state to control
                                // Simpler: Just make the title clickable to toggle
                                const btn = document.getElementById(`acc-btn-${cls.id}`);
                                if (btn) btn.click();
                            }}>
                                {cls.name}
                            </span>
                            <div className="d-flex align-items-center">
                                <Button variant="outline-info" size="sm" className="me-3" onClick={() => handleViewStudents(cls.id, cls.name)}>
                                    View Students
                                </Button>
                                <CustomAccordionToggle eventKey={idx.toString()} id={cls.id}>
                                    {cls.sections?.length || 0} Sections
                                </CustomAccordionToggle>
                            </div>
                        </div>
                        <Accordion.Body className="bg-dark text-white">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0 text-muted">Sections</h6>
                                <Button variant="outline-success" size="sm" onClick={() => { setSelectedClassId(cls.id); setShowSectionModal(true); }}>
                                    <FaPlus className="me-1" /> Add Section
                                </Button>
                            </div>
                            <div className="d-flex flex-column gap-2">
                                {cls.sections?.length > 0 ? (
                                    cls.sections.map((sec: any) => {
                                        const hrTeacher = getHRTeacher(cls.id, sec.id);
                                        return (
                                            <div key={sec.id} className="px-3 py-2 bg-secondary bg-opacity-25 rounded border border-secondary d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center gap-3">
                                                    <span className="fw-bold fs-5">{sec.name}</span>
                                                    {hrTeacher ? (
                                                        <span className="badge bg-success text-white">
                                                            <FaUserTie className="me-1" /> HR: {hrTeacher}
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-warning text-dark">No HR Teacher</span>
                                                    )}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <Button variant="outline-light" size="sm" onClick={() => handleAssignTeacher(cls.id, sec.id, cls.name, sec.name)}>
                                                        {hrTeacher ? 'Change HR' : 'Assign HR'}
                                                    </Button>
                                                    <Button variant="link" size="sm" className="text-info text-decoration-none" onClick={() => handleViewStudents(cls.id, cls.name, sec.id, sec.name)}>
                                                        View Students
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <small className="text-muted fst-italic">No sections added yet.</small>
                                )}
                            </div>
                            <div className="mt-4 border-top border-secondary pt-3 text-end">
                                <Button variant="danger" size="sm" onClick={() => handleDeleteClass(cls.id, cls.name)}>
                                    <FaTrash className="me-1" /> Delete Class
                                </Button>
                            </div>
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>

            {/* Create Class Modal */}
            <Modal show={showClassModal} onHide={() => setShowClassModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white border-secondary">
                    <Modal.Title>Create New Class</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Form.Label>Class Name</Form.Label>
                    <Form.Control
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="e.g. Class 11"
                        className="bg-dark border-secondary text-white"
                    />
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="secondary" onClick={() => setShowClassModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreateClass} disabled={!newClassName}>Create</Button>
                </Modal.Footer>
            </Modal>

            {/* Create Section Modal */}
            <Modal show={showSectionModal} onHide={() => setShowSectionModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white border-secondary">
                    <Modal.Title>Add Section</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Form.Label>Section Name</Form.Label>
                    <Form.Control
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        placeholder="e.g. A"
                        className="bg-dark border-secondary text-white"
                    />
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="secondary" onClick={() => setShowSectionModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreateSection} disabled={!newSectionName}>Create</Button>
                </Modal.Footer>
            </Modal>

            {/* Student List Modal */}
            <StudentListModal
                show={showStudentList}
                handleClose={() => setShowStudentList(false)}
                title={studentListTitle}
                filters={studentFilters}
            />

            {/* Assign Teacher Modal */}
            <AssignTeacherModal
                show={showAssignModal}
                handleClose={() => setShowAssignModal(false)}
                classId={assignTarget.classId}
                sectionId={assignTarget.sectionId}
                className={assignTarget.className}
                sectionName={assignTarget.sectionName}
                onSuccess={loadData}
            />
        </Container>
    );
}

function CustomAccordionToggle({ children, eventKey, id }: any) {
    const decoratedOnClick = useAccordionButton(eventKey);
    return (
        <Button
            type="button"
            id={`acc-btn-${id}`}
            variant="outline-light"
            size="sm"
            onClick={decoratedOnClick}
        >
            {children}
        </Button>
    );
}
