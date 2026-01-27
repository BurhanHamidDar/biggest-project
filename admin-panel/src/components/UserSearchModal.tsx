import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup, Tab, Tabs, InputGroup, Spinner } from 'react-bootstrap';
import { FaSearch, FaUserTie, FaUserGraduate } from 'react-icons/fa';
import { fetchStudents, fetchTeachers } from '@/services/api';

interface UserSearchModalProps {
    show: boolean;
    onHide: () => void;
    onSelectUser: (user: { id: string; name: string; role: string }) => void;
}

export default function UserSearchModal({ show, onHide, onSelectUser }: UserSearchModalProps) {
    const [key, setKey] = useState('student');
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!show) {
            setSearchTerm('');
            setResults([]);
        }
    }, [show]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length > 2) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, key]);

    const handleSearch = async () => {
        try {
            setLoading(true);
            let data = [];
            if (key === 'student') {
                data = await fetchStudents({ search: searchTerm });
            } else {
                data = await fetchTeachers(searchTerm);
            }
            setResults(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: any) => {
        // Map data to unified format
        // Students have profiles!profile_id populated
        const user = {
            id: item.profile_id,
            name: item.profiles?.full_name || 'Unknown',
            role: key
        };
        onSelectUser(user);
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>Search User to Disable</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white">
                <Tabs
                    id="user-search-tabs"
                    activeKey={key}
                    onSelect={(k) => { setKey(k || 'student'); setSearchTerm(''); setResults([]); }}
                    className="mb-3 custom-tabs"
                >
                    <Tab eventKey="student" title={<><FaUserGraduate /> Students</>}>
                        {/* Search Input handled below */}
                    </Tab>
                    <Tab eventKey="teacher" title={<><FaUserTie /> Teachers</>}>
                        {/* Search Input handled below */}
                    </Tab>
                </Tabs>

                <InputGroup className="mb-3">
                    <InputGroup.Text className="bg-secondary text-white border-0"><FaSearch /></InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder={`Search ${key} by name...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-secondary text-white border-0"
                        autoFocus
                    />
                </InputGroup>

                <div style={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
                    {loading && <div className="text-center py-3"><Spinner animation="border" size="sm" /> Searching...</div>}

                    {!loading && results.length === 0 && searchTerm.length > 2 && (
                        <p className="text-center text-muted">No results found.</p>
                    )}

                    {!loading && searchTerm.length <= 2 && (
                        <p className="text-center text-muted small">Type at least 3 characters to search.</p>
                    )}

                    <ListGroup variant="flush">
                        {results.map((item: any) => (
                            <ListGroup.Item
                                key={item.profile_id}
                                action
                                onClick={() => handleSelect(item)}
                                className="bg-dark text-white border-secondary d-flex justify-content-between align-items-center"
                            >
                                <div>
                                    <h6 className="mb-0">{item.profiles?.full_name}</h6>
                                    <small className="text-muted">
                                        {key === 'student' ? `Roll: ${item.roll_no} | Class: ${item.classes?.name}` : `Dept: ${item.department}`}
                                    </small>
                                </div>
                                <span className="btn btn-outline-danger btn-sm">Select</span>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </Modal.Body>
        </Modal>
    );
}
