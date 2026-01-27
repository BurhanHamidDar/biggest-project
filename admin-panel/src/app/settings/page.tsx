"use client";
import React, { useEffect, useState } from 'react';
import { Container, Card, Tabs, Tab, Form, Button, Alert, Table, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { fetchSettings, updateSettings, fetchDisabledAccounts, disableAccount, enableAccount } from '@/services/api';
import { FaSave, FaBan, FaCheck, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import UserSearchModal from '@/components/UserSearchModal';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>({});
    const [disabledAccounts, setDisabledAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Disable Account Form State
    const [targetUserId, setTargetUserId] = useState('');
    const [targetUserName, setTargetUserName] = useState('');
    const [disableReason, setDisableReason] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    // ... (existing handlers) ...

    // Handlers
    const handleSelectUser = (user: { id: string; name: string }) => {
        setTargetUserId(user.id);
        setTargetUserName(user.name);
    };


    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [settingsData, accountsData] = await Promise.all([
                fetchSettings(),
                fetchDisabledAccounts()
            ]);
            setSettings(settingsData || {});
            setDisabledAccounts(accountsData || []);
        } catch (error: any) {
            setMsg({ type: 'danger', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (field: string, value: any) => {
        setSettings({ ...settings, [field]: value });
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            setMsg({ type: '', text: '' });
            await updateSettings(settings);
            setMsg({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error: any) {
            setMsg({ type: 'danger', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDisableAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await disableAccount(targetUserId, disableReason);
            setTargetUserId('');
            setTargetUserName('');
            setDisableReason('');
            loadData(); // Reload list
            alert('Account disabled successfully');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEnableAccount = async (userId: string) => {
        if (!confirm('Are you sure you want to re-enable this user?')) return;
        try {
            await enableAccount(userId);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

    return (
        <Container fluid>
            <h2 className="mb-4 text-white">System Settings</h2>

            {msg.text && <Alert variant={msg.type} onClose={() => setMsg({ type: '', text: '' })} dismissible>{msg.text}</Alert>}

            <Card className="bg-dark text-white border-0 shadow-lg">
                <Card.Body>
                    <Tabs defaultActiveKey="app_control" id="settings-tabs" className="mb-4 custom-tabs">

                        {/* TAB 1: APP CONTROL */}
                        <Tab eventKey="app_control" title="App Control">
                            <h5 className="mb-3 text-warning"><FaExclamationTriangle /> Critical Controls</h5>

                            <Form.Group className="mb-4 p-3 border border-secondary rounded">
                                <Form.Check
                                    type="switch"
                                    id="app_blocked"
                                    label={<span className={settings.app_blocked ? "text-danger fw-bold" : ""}>Enable Maintenance Mode (Block All Apps)</span>}
                                    checked={settings.app_blocked || false}
                                    onChange={(e) => handleSettingChange('app_blocked', e.target.checked)}
                                />
                                <Form.Text className="text-muted">
                                    When enabled, only Admins can access the system. Students and Teachers will see the maintenance message.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Maintenance Message</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={settings.maintenance_message || ''}
                                    onChange={(e) => handleSettingChange('maintenance_message', e.target.value)}
                                    className="bg-secondary text-white border-0"
                                />
                            </Form.Group>
                        </Tab>

                        {/* TAB 2: SECURITY & SESSION */}
                        <Tab eventKey="security" title="Security">
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Session Timeout (Minutes)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={settings.session_timeout_minutes || 60}
                                            onChange={(e) => handleSettingChange('session_timeout_minutes', parseInt(e.target.value))}
                                            className="bg-secondary text-white border-0"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Max Login Attempts</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={settings.max_login_attempts || 5}
                                            onChange={(e) => handleSettingChange('max_login_attempts', parseInt(e.target.value))}
                                            className="bg-secondary text-white border-0"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="switch"
                                    id="force_pw"
                                    label="Force Password Change on First Login"
                                    checked={settings.force_password_change || false}
                                    onChange={(e) => handleSettingChange('force_password_change', e.target.checked)}
                                />
                            </Form.Group>
                        </Tab>

                        {/* TAB 3: NOTIFICATIONS */}
                        <Tab eventKey="notifications" title="Notifications">
                            <p className="text-muted">Toggle which notifications should be sent to mobile apps.</p>

                            <Row>
                                <Col md={6}>
                                    <div className="d-flex flex-column gap-3">
                                        <Form.Check
                                            type="switch"
                                            id="notify_homework"
                                            label="Homework Notifications"
                                            checked={settings.notifications_homework || false}
                                            onChange={(e) => handleSettingChange('notifications_homework', e.target.checked)}
                                        />
                                        <Form.Check
                                            type="switch"
                                            id="notify_attendance"
                                            label="Attendance Notifications"
                                            checked={settings.notifications_attendance || false}
                                            onChange={(e) => handleSettingChange('notifications_attendance', e.target.checked)}
                                        />
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="d-flex flex-column gap-3">
                                        <Form.Check
                                            type="switch"
                                            id="notify_marks"
                                            label="Exam Marks Notifications"
                                            checked={settings.notifications_marks || false}
                                            onChange={(e) => handleSettingChange('notifications_marks', e.target.checked)}
                                        />
                                        <Form.Check
                                            type="switch"
                                            id="notify_notices"
                                            label="General Notice Board Notifications"
                                            checked={settings.notifications_notices || false}
                                            onChange={(e) => handleSettingChange('notifications_notices', e.target.checked)}
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </Tab>

                        {/* TAB 4: DISABLED ACCOUNTS */}
                        <Tab eventKey="accounts" title="Disabled Accounts">
                            <Card className="bg-secondary border-0 mb-4">
                                <Card.Body>
                                    <h6 className="text-white">Disable a User Account</h6>

                                    <div className="mb-3">
                                        <Button variant="outline-info" size="sm" onClick={() => setShowSearch(true)}>
                                            <FaSearch /> Search User to Disable
                                        </Button>
                                    </div>

                                    <Form onSubmit={handleDisableAccount} className="d-flex gap-2 align-items-end">
                                        <Form.Group className="flex-grow-1">
                                            <Form.Label className="text-muted small">Selected User ID</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="User ID"
                                                value={targetUserId}
                                                readOnly
                                                className="bg-secondary text-white border-0"
                                            />
                                            {targetUserName && <Form.Text className="text-info small">Selected: {targetUserName}</Form.Text>}
                                        </Form.Group>

                                        <Form.Group style={{ flex: 2 }}>
                                            <Form.Label className="text-muted small">Reason</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Reason for disabling (will be shown to user)"
                                                value={disableReason}
                                                onChange={(e) => setDisableReason(e.target.value)}
                                                required
                                                className="bg-secondary text-white border-0"
                                            />
                                        </Form.Group>

                                        <Button variant="danger" type="submit" disabled={!targetUserId} style={{ marginBottom: '1px' }}>
                                            <FaBan /> Disable
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <UserSearchModal
                                show={showSearch}
                                onHide={() => setShowSearch(false)}
                                onSelectUser={handleSelectUser}
                            />

                            <Table responsive hover variant="dark">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Reason</th>
                                        <th>Disabled By</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {disabledAccounts.map((acc: any) => (
                                        <tr key={acc.id}>
                                            <td>
                                                <div>{acc.profiles?.full_name}</div>
                                                <small className="text-white-50">{acc.profiles?.email}</small> <Badge bg="secondary">{acc.profiles?.role}</Badge>
                                            </td>
                                            <td>{acc.reason}</td>
                                            <td>{acc.admin?.full_name}</td>
                                            <td>{new Date(acc.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <Button size="sm" variant="success" onClick={() => handleEnableAccount(acc.user_id)}>
                                                    <FaCheck /> Enable
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {disabledAccounts.length === 0 && (
                                        <tr><td colSpan={5} className="text-center">No disabled accounts found</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </Tab>

                        {/* TAB 5: SYSTEM INFO */}
                        <Tab eventKey="info" title="System Info">
                            <Table bordered variant="dark" className="w-50">
                                <tbody>
                                    <tr><td>App Name</td><td>School Management System (ERP)</td></tr>
                                    <tr><td>Version</td><td>v1.0.0 (Beta)</td></tr>
                                    <tr><td>Developed By</td><td>Burhan Hamid</td></tr>
                                    <tr><td>Last Update</td><td>{new Date().toLocaleDateString()}</td></tr>
                                    <tr><td>Server Status</td><td><Badge bg="success">Online</Badge></td></tr>
                                </tbody>
                            </Table>
                        </Tab>

                    </Tabs>

                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="primary" size="lg" onClick={saveSettings} disabled={saving}>
                            {saving ? <Spinner size="sm" animation="border" /> : <><FaSave /> Save Changes</>}
                        </Button>
                    </div>

                </Card.Body>
            </Card>
        </Container>
    );
}
