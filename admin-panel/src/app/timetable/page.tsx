'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { fetchClasses, fetchTeachers, fetchSubjects } from '../../services/api'; // Extended with fetchTimetable, createTimetableEntry etc (below)
import * as api from '../../services/api';

// Types
interface TimetableEntry {
    id: string;
    day: string;
    period_number: number;
    start_time: string;
    end_time: string;
    room_number?: string;
    subjects: { name: string, code: string };
    teachers: { profile_id: string, profiles: { full_name: string } };
    classes: { name: string };
    sections: { name: string };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TimetablePage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        day: '',
        period_number: 1,
        subject_id: '',
        teacher_id: '',
        start_time: '09:00',
        end_time: '10:00',
        room_number: ''
    });
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass && selectedSection) {
            loadTimetable();
        }
    }, [selectedClass, selectedSection]);

    const loadInitialData = async () => {
        try {
            const [clsData, tchData, subData] = await Promise.all([
                fetchClasses(),
                fetchTeachers(),
                fetchSubjects()
            ]);
            setClasses(clsData);
            setTeachers(tchData);
            setSubjects(subData);
        } catch (err) {
            console.error(err);
        }
    };

    const loadTimetable = async () => {
        setLoading(true);
        try {
            // @ts-ignore - Assuming API function exists
            const data = await api.fetchTimetable(selectedClass, selectedSection);
            setTimetable(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setModalError('');
        try {
            // @ts-ignore
            await api.createTimetableEntry({
                class_id: selectedClass,
                section_id: selectedSection,
                ...modalData
            });
            setShowModal(false);
            loadTimetable();
        } catch (err: any) {
            setModalError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this entry?')) return;
        try {
            // @ts-ignore
            await api.deleteTimetableEntry(id);
            loadTimetable();
        } catch (err) {
            console.error(err);
        }
    };

    const openAddModal = (day: string, period: number) => {
        if (!selectedClass || !selectedSection) {
            alert('Please select class and section first');
            return;
        }
        setModalData({
            ...modalData,
            day,
            period_number: period,
            subject_id: '',
            teacher_id: '',
            // Default times could be smarter based on period
        });
        setModalError('');
        setShowModal(true);
    };

    const getEntry = (day: string, period: number) => {
        return timetable.find(t => t.day === day && t.period_number === period);
    };

    const selectedClassData = classes.find(c => c.id === selectedClass);
    const sections = selectedClassData?.sections || [];

    return (
        <Layout>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Timetable Management</h1>
            </div>

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <label className="form-label">Class</label>
                    <select className="form-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        <option value="">Select Class</option>
                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-md-3">
                    <label className="form-label">Section</label>
                    <select className="form-select" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={!selectedClass}>
                        <option value="">Select Section</option>
                        {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="table-responsive">
                <table className="table table-bordered text-center">
                    <thead className="table-dark">
                        <tr>
                            <th>Day / Period</th>
                            {PERIODS.map(p => <th key={p}>Period {p}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map(day => (
                            <tr key={day}>
                                <th className="align-middle table-secondary">{day}</th>
                                {PERIODS.map(period => {
                                    const entry = getEntry(day, period);
                                    return (
                                        <td key={`${day}-${period}`} className="align-middle position-relative" style={{ height: '100px', minWidth: '150px' }}>
                                            {entry ? (
                                                <div className="card h-100 border-primary shadow-sm">
                                                    <div className="card-body p-1">
                                                        <h6 className="card-title text-primary mb-1">{entry.subjects?.name}</h6>
                                                        <p className="card-text small text-muted mb-1">{entry.teachers?.profiles?.full_name}</p>
                                                        <span className="badge bg-secondary">{entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)}</span>
                                                        <button
                                                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 px-1"
                                                            onClick={() => handleDelete(entry.id)}
                                                            style={{ fontSize: '0.6rem' }}
                                                        >
                                                            X
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn btn-outline-light text-secondary w-100 h-100"
                                                    onClick={() => openAddModal(day, period)}
                                                >
                                                    +
                                                </button>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Timetable Entry</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {modalError && <div className="alert alert-danger">{modalError}</div>}
                                <div className="mb-3">
                                    <strong>{modalData.day} - Period {modalData.period_number}</strong>
                                </div>

                                <div className="mb-3">
                                    <label>Subject</label>
                                    <select
                                        className="form-select"
                                        value={modalData.subject_id}
                                        onChange={(e) => setModalData({ ...modalData, subject_id: e.target.value })}
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label>Teacher</label>
                                    <select
                                        className="form-select"
                                        value={modalData.teacher_id}
                                        onChange={(e) => setModalData({ ...modalData, teacher_id: e.target.value })}
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map((t: any) => (
                                            <option key={t.profile_id} value={t.profile_id}>
                                                {t.profiles?.full_name} ({t.department})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <label>Start Time</label>
                                        <input type="time" className="form-control" value={modalData.start_time} onChange={e => setModalData({ ...modalData, start_time: e.target.value })} />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label>End Time</label>
                                        <input type="time" className="form-control" value={modalData.end_time} onChange={e => setModalData({ ...modalData, end_time: e.target.value })} />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label>Room Number (Optional)</label>
                                    <input type="text" className="form-control" value={modalData.room_number} onChange={e => setModalData({ ...modalData, room_number: e.target.value })} />
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleCreate}>Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </Layout>
    );
}
