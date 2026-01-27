"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, Alert } from 'react-bootstrap';
import { fetchStudents, fetchMarks, saveMarks } from '@/services/api';

interface MarksEntryModalProps {
    show: boolean;
    handleClose: () => void;
    examSubjectId: string;
    classId: string;
    sectionId: string; // Optional: filter by section or show all? Usually by section is easier.
    subjectName: string;
    className: string;
    maxMarks: number;
}

const MarksEntryModal: React.FC<MarksEntryModalProps> = ({
    show, handleClose, examSubjectId, classId, sectionId, subjectName, className, maxMarks
}) => {
    const [students, setStudents] = useState<any[]>([]);
    const [marksMap, setMarksMap] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show && examSubjectId && classId) {
            loadData();
        }
    }, [show, examSubjectId, classId, sectionId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            // Parallel fetch: Students in class(section) AND existing marks
            // If sectionId is not provided, maybe fetch all sections? simpler to enforce section selection or fetch all.
            const sData = await fetchStudents({ class_id: classId, section_id: sectionId });
            const mData = await fetchMarks(examSubjectId);

            setStudents(sData);

            // Map existing marks
            const mMap: any = {};
            mData.forEach((m: any) => {
                mMap[m.student_id] = m.marks_obtained;
            });
            setMarksMap(mMap);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId: string, val: string) => {
        setMarksMap((prev: any) => ({ ...prev, [studentId]: val }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const marksData = Object.keys(marksMap).map(sid => ({
                student_id: sid,
                marks_obtained: parseFloat(marksMap[sid]) || 0,
                remarks: ''
            }));

            await saveMarks({
                exam_subject_id: examSubjectId,
                marks_data: marksData
            });
            handleClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>Enter Marks: {subjectName} ({className})</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white">
                <p className="text-info">Max Marks: {maxMarks}</p>
                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? <p>Loading...</p> : (
                    <div className="table-responsive" style={{ maxHeight: '60vh' }}>
                        <Table variant="dark" hover size="sm">
                            <thead>
                                <tr>
                                    <th>Roll No</th>
                                    <th>Student Name</th>
                                    <th style={{ width: '150px' }}>Marks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.profile_id}>
                                        <td>{s.roll_no}</td>
                                        <td>{s.profiles?.full_name}</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                max={maxMarks}
                                                min={0}
                                                value={marksMap[s.profile_id] || ''}
                                                onChange={e => handleMarkChange(s.profile_id, e.target.value)}
                                                className="bg-secondary text-white border-0"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-dark border-secondary">
                <Button variant="secondary" onClick={handleClose}>Close</Button>
                <Button variant="success" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Marks'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MarksEntryModal;
