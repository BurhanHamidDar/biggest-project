"use client";
import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { uploadMarksheet } from '@/services/api';

interface MarksheetUploadModalProps {
    show: boolean;
    handleClose: () => void;
    studentId: string;
    studentName: string;
    examId: string;
    existingUrl?: string | null;
    onSuccess: () => void;
}

export default function MarksheetUploadModal({ show, handleClose, studentId, studentName, examId, existingUrl, onSuccess }: MarksheetUploadModalProps) {
    const [fileUrl, setFileUrl] = useState(existingUrl || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!fileUrl) {
            setError('Please enter a file URL');
            return;
        }
        setLoading(true);
        try {
            await uploadMarksheet({ student_id: studentId, exam_id: examId, file_url: fileUrl });
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>Upload Marksheet</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white">
                <div className="mb-4">
                    <strong>Student:</strong> {studentName}
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form.Group className="mb-3">
                    <Form.Label>Marksheet File URL (PDF/Image)</Form.Label>
                    <Form.Control
                        type="url"
                        placeholder="https://drive.google.com/..."
                        className="bg-dark text-white border-secondary"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                        Please upload the marksheet to Google Drive or S3 and paste the shareable link here.
                    </Form.Text>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer className="bg-dark border-secondary">
                <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : (existingUrl ? 'Update Marksheet' : 'Upload Marksheet')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
