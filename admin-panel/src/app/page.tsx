"use client";
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { FaUserGraduate, FaChalkboardTeacher, FaSchool, FaBus, FaRupeeSign } from 'react-icons/fa';
import { fetchDashboardStats } from '@/services/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="light" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  const StatCard = ({ title, count, icon, color }: any) => (
    <Col md={3} className="mb-4">
      <Card className={`border-0 shadow-sm h-100 bg-${color} text-white`}>
        <Card.Body className="d-flex align-items-center justify-content-between">
          <div>
            <h6 className="text-uppercase mb-1 opacity-75">{title}</h6>
            <h2 className="display-4 fw-bold mb-0">{count}</h2>
          </div>
          <div className="opacity-50 display-6">
            {icon}
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container fluid>
      <h2 className="text-white fw-bold mb-4">Admin Dashboard</h2>
      <Row>
        <StatCard
          title="Total Students"
          count={stats?.students || 0}
          icon={<FaUserGraduate />}
          color="primary"
        />
        <StatCard
          title="Total Teachers"
          count={stats?.teachers || 0}
          icon={<FaChalkboardTeacher />}
          color="warning" // Warning is yellow/orange
        />
        <StatCard
          title="Active Classes"
          count={stats?.classes || 0}
          icon={<FaSchool />}
          color="info"
        />
        <StatCard
          title="School Buses"
          count={stats?.buses || 0}
          icon={<FaBus />}
          color="danger"
        />
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <Card className="bg-dark-navy text-white border-0 shadow-sm h-100">
            <Card.Header className="border-secondary fw-bold">
              <FaRupeeSign className="me-2" /> Fee Collection
            </Card.Header>
            <Card.Body>
              <h3 className="text-success fw-bold">₹ {stats?.total_fees_collected?.toLocaleString() || 0}</h3>
              <p className="text-muted">Total fees collected across all fee types.</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          <Card className="bg-dark-navy text-white border-0 shadow-sm h-100">
            <Card.Header className="border-secondary fw-bold">
              Quick Actions
            </Card.Header>
            <Card.Body className="d-flex gap-2 flex-wrap">
              <a href="/students" className="btn btn-outline-light">Add Student</a>
              <a href="/fees" className="btn btn-outline-light">Collect Fees</a>
              <a href="/exams" className="btn btn-outline-light">Create Exam</a>
              <a href="/notices" className="btn btn-outline-light">Post Notice</a>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <p className="text-center text-muted mt-5 opacity-50">
        School Management System v1.0 &copy; 2026
      </p>
    </Container>
  );
}
