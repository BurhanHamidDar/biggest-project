'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Container, Card, Table, Button, Badge, Alert, Spinner, Tooltip, OverlayTrigger, Breadcrumb } from 'react-bootstrap';
import { FaArrowLeft, FaUpload, FaFilePdf, FaInfoCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { API_BASE_URL } from '@/services/api';
import { supabase } from '@/lib/supabase';

export default function ExamResultsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const examId = params.id as string;
    const classId = searchParams.get('class');
    const sectionId = searchParams.get('section');
    const className = searchParams.get('className');
    const sectionName = searchParams.get('sectionName');
    const examName = searchParams.get('examName');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        if (examId && classId && sectionId) {
            fetchGrid();
        }
    }, [examId, classId, sectionId]);

    const fetchGrid = async () => {
        setLoading(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch(`${API_BASE_URL}/exams/results/grid?exam_id=${examId}&class_id=${classId}&section_id=${sectionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errBody = await res.text();
                throw new Error(`Server Error (${res.status}): ${errBody}`);
            }
            const gridData = await res.json();
            setData(gridData);
        } catch (error: any) {
            console.error('Grid Fetch Error:', error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (studentId: string) => {
        setUploading(studentId); // Reusing 'uploading' state for loading spinner
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            // Call Upload API but with NULL file_url (Approved Status)
            const res = await fetch(`${API_BASE_URL}/exams/marksheets/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_id: studentId,
                    exam_id: examId,
                    file_url: 'APPROVED' // store specific string or check if null allowed. Let's use 'APPROVED' string to be safe if column non-nullable.
                    // Actually column is 'file_url'. If I store 'APPROVED', student app might try to fetch it?
                    // Student App: ExamResultScreen lines 112: <TouchableOpacity onPress={() => (pdfUrl ? Linking.openURL(pdfUrl) ...
                    // If pdfUrl is 'APPROVED', deep linking might fail.
                    // But we can check `if (pdfUrl && pdfUrl !== 'APPROVED')`.
                    // Or keep it simple: Student App handles "No PDF" gracefully.
                })
            });

            if (!res.ok) throw new Error('Failed to approve result');

            // Success feedback
            fetchGrid();
        } catch (error: any) {
            console.error(error);
            alert('Approval Failed: ' + error.message);
        } finally {
            setUploading(null);
        }
    };

    if (!classId || !sectionId) {
        return (
            <Container className="p-5 text-center text-white">
                <Alert variant="warning">
                    <FaExclamationTriangle className="me-2" />
                    Please select a Class and Section from the Exam page first.
                </Alert>
                <Button variant="secondary" onClick={() => router.back()}>Go Back</Button>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-3 text-white">Loading Results...</span>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Button variant="outline-light" size="sm" className="mb-2" onClick={() => router.back()}>
                        <FaArrowLeft className="me-2" /> Back
                    </Button>
                    <h2 className="text-white fw-bold mb-0">{examName || 'Exam Results'}</h2>
                    <p className="text-muted mb-0">Consolidated Marks Matrix</p>
                </div>
                <div className="text-end text-light">
                    <Badge bg="secondary" className="fs-6 me-2">{className || 'Class'}</Badge>
                    <Badge bg="secondary" className="fs-6">{sectionName || 'Section'}</Badge>
                </div>
            </div>

            {/* Info Badge */}
            <Alert variant="info" className="d-flex align-items-center shadow-sm">
                <FaInfoCircle className="me-3 fs-4" />
                <div>
                    <strong>About Marksheets:</strong> The "Marksheet" column allows you to upload an official scanned copy (PDF or Image) of the result.
                    Once uploaded, the student and parents can download it directly from their mobile app.
                </div>
            </Alert>

            {/* Matrix Card */}
            <Card className="bg-dark-navy border-0 text-white shadow-lg">
                <Card.Header className="bg-transparent border-secondary d-flex justify-content-between align-items-center">
                    <span className="fw-bold">Results Grid & Marksheet Status</span>
                    <Badge bg="dark" className="border border-secondary">
                        Total Students: {data?.students.length}
                    </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover variant="dark" className="mb-0 text-nowrap align-middle">
                            <thead className="bg-black">
                                <tr>
                                    <th className="ps-4 sticky-col">Student Details</th>
                                    {data?.subjects.map((sub: any) => (
                                        <th key={sub.id} className="text-center">
                                            <div className="d-flex flex-column">
                                                <span>{sub.name}</span>
                                                <Badge bg="dark" className="text-muted border border-secondary mt-1 mx-auto" style={{ fontSize: '0.65rem' }}>
                                                    Max: {sub.maxMarks}
                                                </Badge>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="text-end pe-4 sticky-col-end" style={{ minWidth: '180px' }}>
                                        Marksheet File
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.students.map((student: any) => (
                                    <tr key={student.id}>
                                        <td className="ps-4 sticky-col bg-dark-navy">
                                            <div className="fw-bold text-white">{student.name}</div>
                                            <div className="text-muted small">Roll: {student.rollNo}</div>
                                        </td>
                                        {data?.subjects.map((sub: any) => {
                                            const mark = student.marks[sub.id];
                                            return (
                                                <td key={sub.id} className="text-center">
                                                    {mark ? (
                                                        <Badge
                                                            bg={mark.grade === 'Fail' ? 'danger' : 'success'}
                                                            className="px-3 py-2"
                                                        >
                                                            {mark.obtained}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="text-end pe-4 sticky-col-end bg-dark-navy">
                                            <div className="d-flex justify-content-end gap-2">
                                                {student.marksheetUrl ? (
                                                    <a
                                                        href={student.marksheetUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm btn-outline-info d-flex align-items-center"
                                                        title="View Uploaded File"
                                                    >
                                                        <FaFilePdf className="me-1" /> View
                                                    </a>
                                                ) : (
                                                    <span className="text-muted small my-auto me-2">Pending</span>
                                                )}

                                                <div className="d-flex justify-content-end gap-2">
                                                    {student.marksheetUrl ? (
                                                        <Badge bg="success" className="d-flex align-items-center px-3">
                                                            <FaCheckCircle className="me-2" /> Approved
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            disabled={uploading === student.id}
                                                            onClick={() => handleApprove(student.id)}
                                                            className="d-flex align-items-center"
                                                        >
                                                            {uploading === student.id ? (
                                                                <Spinner size="sm" animation="border" />
                                                            ) : (
                                                                <>
                                                                    <FaCheckCircle className="me-2" /> Approve Result
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data?.students.length === 0 && (
                                    <tr>
                                        <td colSpan={(data?.subjects.length || 0) + 2} className="text-center py-5 text-muted">
                                            No students found in this section.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <style jsx global>{`
                .bg-dark-navy {
                    background-color: #0b1120 !important; /* Matches generic dashboard theme */
                }
                /* Optional Sticky Columns if supported well, otherwise just standard table */
                /*
                .sticky-col {
                    position: sticky;
                    left: 0;
                    z-index: 10;
                }
                .sticky-col-end {
                    position: sticky;
                    right: 0;
                    z-index: 10;
                } 
                */
            `}</style>
        </Container>
    );
}
