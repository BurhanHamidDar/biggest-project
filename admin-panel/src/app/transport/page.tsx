"use client";
import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Form, Row, Col, Alert, Modal, Tabs, Tab } from 'react-bootstrap';
import { FaPlus, FaTrash, FaBus, FaUserTie } from 'react-icons/fa';
import { fetchBuses, createBus, deleteBus, fetchDrivers, deleteDriver } from '@/services/api';
import AddDriverModal from '@/components/AddDriverModal';
import StudentListModal from '@/components/StudentListModal';

export default function TransportPage() {
    const [buses, setBuses] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showBusModal, setShowBusModal] = useState(false);
    const [showDriverModal, setShowDriverModal] = useState(false);

    // Student List Modal
    const [showStudentList, setShowStudentList] = useState(false);
    const [studentListTitle, setStudentListTitle] = useState('');
    const [studentFilters, setStudentFilters] = useState<any>(null);

    // Forms
    const [newBus, setNewBus] = useState({ bus_number: '', capacity: '', route_name: '', driver_id: '' });

    const loadData = async () => {
        try {
            setLoading(true);
            const [busesData, driversData] = await Promise.all([fetchBuses(), fetchDrivers()]);
            setBuses(busesData);
            setFilteredBuses(busesData);
            setDrivers(driversData);
            setFilteredDrivers(driversData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredBuses, setFilteredBuses] = useState<any[]>([]);
    const [filteredDrivers, setFilteredDrivers] = useState<any[]>([]);

    useEffect(() => {
        const lower = searchTerm.toLowerCase();

        // Filter Buses
        setFilteredBuses(buses.filter(b =>
            b.bus_number.toLowerCase().includes(lower) ||
            b.route_name?.toLowerCase().includes(lower) ||
            b.driver_name?.toLowerCase().includes(lower)
        ));

        // Filter Drivers
        setFilteredDrivers(drivers.filter(d =>
            d.full_name.toLowerCase().includes(lower) ||
            d.license_number?.toLowerCase().includes(lower) ||
            d.phone_number?.includes(lower)
        ));

    }, [searchTerm, buses, drivers]);

    useEffect(() => {
        loadData();
    }, []);

    // State for Editing
    const [editingDriver, setEditingDriver] = useState<any>(null);

    const handleCreateBus = async () => {
        try {
            await createBus(newBus);
            setShowBusModal(false);
            setNewBus({ bus_number: '', capacity: '', route_name: '', driver_id: '' });
            loadData();
        } catch (err: any) { alert(err.message); }
    };

    const handleDeleteBus = async (id: string) => {
        if (confirm('Delete this bus?')) {
            await deleteBus(id);
            loadData();
        }
    }

    const handleDeleteDriver = async (id: string) => {
        if (confirm('Delete this driver?')) {
            await deleteDriver(id);
            loadData();
        }
    }

    const handleEditDriver = (driver: any) => {
        setEditingDriver(driver);
        setShowDriverModal(true);
    };

    const handleCreateDriverClick = () => {
        setEditingDriver(null);
        setShowDriverModal(true);
    };

    const handleDriverModalClose = () => {
        setShowDriverModal(false);
        setEditingDriver(null);
    };

    const handleViewPassengers = (busId: string, busNumber: string) => {
        setStudentFilters({ bus_id: busId });
        setStudentListTitle(`Passengers for Bus ${busNumber}`);
        setShowStudentList(true);
    };

    // Filter available drivers (not assigned to any bus OR assigned to the current editing bus if we had edit mode)
    const availableDrivers = drivers.filter(d => !d.assigned_bus_id);

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white fw-bold">Transport Management</h2>
            </div>

            {/* Search Bar */}
            <Card className="bg-dark border-0 mb-4 shadow-sm">
                <Card.Body>
                    <Form.Control
                        type="text"
                        placeholder="Search bus number, route, driver name or license..."
                        className="bg-secondary text-white border-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Card.Body>
            </Card>

            <Tabs defaultActiveKey="buses" className="mb-4 custom-tabs">
                <Tab eventKey="buses" title={<span className="text-white"><FaBus className="me-2" />Buses & Routes</span>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-dark-navy border-0 d-flex justify-content-between align-items-center py-3">
                            <h5 className="text-white mb-0">Bus Fleet Status</h5>
                            <Button variant="success" size="sm" onClick={() => setShowBusModal(true)}>
                                <FaPlus className="me-2" /> Add Bus
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover variant="dark" className="mb-0">
                                <thead>
                                    <tr>
                                        <th className="ps-4">Bus No.</th>
                                        <th>Route</th>
                                        <th>Driver</th>
                                        <th>Occupancy</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBuses.map(bus => (
                                        <tr key={bus.id}>
                                            <td className="ps-4 fw-bold">{bus.bus_number}</td>
                                            <td>{bus.route_name || <span className="text-muted text-uppercase small">Not Set</span>}</td>
                                            <td>
                                                {bus.driver_name !== 'Unassigned' ? (
                                                    <div>
                                                        {bus.driver_name}
                                                        <div className="small text-muted">{bus.driver_phone}</div>
                                                    </div>
                                                ) : <span className="badge bg-warning text-dark">No Driver</span>}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <span className={`fw-bold me-2 ${bus.student_count >= bus.capacity ? 'text-danger' : 'text-success'}`}>
                                                        {bus.student_count} / {bus.capacity}
                                                    </span>
                                                    {bus.capacity > 0 && (
                                                        <div className="progress flex-grow-1" style={{ height: 4, maxWidth: 50 }}>
                                                            <div
                                                                className={`progress-bar ${bus.student_count >= bus.capacity ? 'bg-danger' : 'bg-success'}`}
                                                                style={{ width: `${Math.min((bus.student_count / bus.capacity) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button variant="outline-info" size="sm" className="me-2" onClick={() => handleViewPassengers(bus.id, bus.bus_number)}>
                                                    Passengers
                                                </Button>
                                                <Button variant="link" size="sm" className="text-danger" onClick={() => handleDeleteBus(bus.id)}><FaTrash /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredBuses.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-muted">No buses found.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="drivers" title={<span className="text-white"><FaUserTie className="me-2" />Drivers</span>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-dark-navy border-0 d-flex justify-content-between align-items-center py-3">
                            <h5 className="text-white mb-0">Driver Fleet</h5>
                            <Button variant="success" size="sm" onClick={handleCreateDriverClick}>
                                <FaPlus className="me-2" /> Add Driver
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover variant="dark" className="mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th className="ps-4">Profile</th>
                                        <th>Name</th>
                                        <th>License</th>
                                        <th>Phone</th>
                                        <th>Assigned Bus</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDrivers.map(driver => (
                                        <tr key={driver.id}>
                                            <td className="ps-4">
                                                <div className="rounded-circle overflow-hidden bg-secondary border border-secondary" style={{ width: 40, height: 40 }}>
                                                    {driver.avatar_url ? (
                                                        <img src={driver.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white-50 small">N/A</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="fw-bold">
                                                {driver.full_name}
                                                <div className="small text-white-50">{driver.parentage ? `S/O ${driver.parentage}` : ''}</div>
                                            </td>
                                            <td>{driver.license_number}</td>
                                            <td>{driver.phone_number}</td>
                                            <td>
                                                {driver.buses ? <span className="badge bg-info text-dark">{driver.buses.bus_number}</span> : <span className="text-muted">-</span>}
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button variant="outline-light" size="sm" className="me-2" onClick={() => handleEditDriver(driver)}>Edit</Button>
                                                <Button variant="link" size="sm" className="text-danger" onClick={() => handleDeleteDriver(driver.id)}><FaTrash /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredDrivers.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">No drivers found.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Bus Modal */}
            <Modal show={showBusModal} onHide={() => setShowBusModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white border-secondary"><Modal.Title>Add Bus</Modal.Title></Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Bus Number *</Form.Label>
                                <Form.Control placeholder="e.g. 01" className="bg-dark border-secondary text-white"
                                    value={newBus.bus_number} onChange={e => setNewBus({ ...newBus, bus_number: e.target.value })} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Capacity *</Form.Label>
                                <Form.Control placeholder="Seats" type="number" className="bg-dark border-secondary text-white"
                                    value={newBus.capacity} onChange={e => setNewBus({ ...newBus, capacity: e.target.value })} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Route Name</Form.Label>
                        <Form.Control placeholder="e.g. City Center - Campus" className="bg-dark border-secondary text-white"
                            value={newBus.route_name} onChange={e => setNewBus({ ...newBus, route_name: e.target.value })} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Assign Driver</Form.Label>
                        <Form.Select className="bg-dark border-secondary text-white"
                            value={newBus.driver_id} onChange={e => setNewBus({ ...newBus, driver_id: e.target.value })}>
                            <option value="">-- Select Driver --</option>
                            {availableDrivers.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name} ({d.license_number})</option>
                            ))}
                        </Form.Select>
                        <Form.Text className="text-muted">Only unassigned drivers are shown.</Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="secondary" onClick={() => setShowBusModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreateBus} disabled={!newBus.bus_number}>Add Bus</Button>
                </Modal.Footer>
            </Modal>

            {/* New Driver Modal */}
            <AddDriverModal
                show={showDriverModal}
                handleClose={handleDriverModalClose}
                onSuccess={loadData}
                driverToEdit={editingDriver}
            />

            {/* Student List Modal */}
            <StudentListModal
                show={showStudentList}
                handleClose={() => setShowStudentList(false)}
                title={studentListTitle}
                filters={studentFilters}
            />
        </Container>
    );
}
