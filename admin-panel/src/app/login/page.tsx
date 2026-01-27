"use client";
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Verify Role (Optional but recommended)
                // const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
                // if (profile?.role !== 'admin') { ... }

                router.push('/'); // Redirect to Dashboard
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center min-vh-100 bg-dark-navy">
            <Row className="w-100 justify-content-center">
                <Col md={5} lg={4}>
                    <Card className="bg-dark text-white border-0 shadow-lg">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <h3 className="fw-bold">Admin Portal</h3>
                                <p className="text-muted">Sign in to manage your school</p>
                            </div>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleLogin}>
                                <Form.Group className="mb-3" controlId="formEmail">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-secondary text-white border-0"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="formPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-secondary text-white border-0"
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100 py-2 fw-bold" disabled={loading}>
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Sign In'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                    <div className="text-center mt-3 text-muted">
                        <small>School Management System v1.0</small>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}
