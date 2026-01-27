import { supabase } from '@/lib/supabase';

export const API_BASE_URL = 'https://biggest-project-1.onrender.com/api';

/**
 * Helper to get headers with Auth Token
 */
const getAuthHeaders = async (isMultipart = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: any = {};
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[API] Token found, attaching header.');
    } else {
        console.warn('[API] No token found in session!');
    }
    return headers;
};

// --- STUDENTS ---
export const fetchStudents = async (filters?: any) => {
    let url = `${API_BASE_URL}/students`;
    if (filters) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => filters[key] && params.append(key, filters[key]));
        url += `?${params.toString()}`;
    }
    const response = await fetch(url, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
};

export const createStudent = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create student');
    }
    return response.json();
};

export const updateStudent = async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update student');
    }
    return response.json();
};

export const deleteStudent = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete student');
    }
    return response.json();
};

// --- TEACHERS ---
export const fetchTeachers = async (search?: string) => {
    let url = `${API_BASE_URL}/teachers`;
    if (search) url += `?search=${encodeURIComponent(search)}`;
    const response = await fetch(url, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch teachers');
    return response.json();
};

export const createTeacher = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/teachers`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create teacher');
    }
    return response.json();
};

export const updateTeacher = async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update teacher');
    }
    return response.json();
};

export const deleteTeacher = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete teacher');
    }
    return response.json();
};

// --- CLASSES ---
export const fetchClasses = async () => {
    const response = await fetch(`${API_BASE_URL}/classes`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch classes');
    return response.json();
};

export const createClass = async (name: string) => {
    const response = await fetch(`${API_BASE_URL}/classes`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error('Failed to create class');
    return response.json();
};

export const createSection = async (class_id: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/classes/section`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ class_id, name })
    });
    if (!response.ok) throw new Error('Failed to create section');
    return response.json();
};

export const deleteClass = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete class');
    return response.json();
};

// --- SUBJECTS ---
export const fetchSubjects = async () => {
    const response = await fetch(`${API_BASE_URL}/subjects`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch subjects');
    return response.json();
};

export const createSubject = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create subject');
    return response.json();
};

export const deleteSubject = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete subject');
    return response.json();
};

// --- NOTICES ---
export const fetchNotices = async () => {
    const response = await fetch(`${API_BASE_URL}/notices`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch notices');
    return response.json();
};

export const createNotice = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create notice');
    return response.json();
};

export const deleteNotice = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete notice');
    return response.json();
};

// --- TRANSPORT (BUSES & DRIVERS) ---
export const fetchBuses = async () => {
    const response = await fetch(`${API_BASE_URL}/transport/buses`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch buses');
    return response.json();
};

export const createBus = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/transport/buses`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create bus');
    return response.json();
};

export const deleteBus = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/transport/buses/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete bus');
    return response.json();
};

export const fetchDrivers = async () => {
    const response = await fetch(`${API_BASE_URL}/transport/drivers`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch drivers');
    return response.json();
};

export const fetchBusPassengers = async (busId: string) => {
    const response = await fetch(`${API_BASE_URL}/transport/buses/${busId}/passengers`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch bus passengers');
    return response.json();
};

export const createDriver = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/transport/drivers`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create driver');
    return response.json();
};

export const updateDriver = async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/transport/drivers/${id}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update driver');
    return response.json();
};

export const deleteDriver = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/transport/drivers/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete driver');
    return response.json();
};

export const assignStudentToBus = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/transport/assign`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to assign student');
    return result;
};

// --- SYLLABUS ---
export const fetchSyllabus = async (class_id?: string) => {
    let url = `${API_BASE_URL}/syllabus`;
    if (class_id) url += `?class_id=${class_id}`;

    const response = await fetch(url, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch syllabus');
    return response.json();
};

export const createSyllabus = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/syllabus`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create syllabus');
    return response.json();
};

export const deleteSyllabus = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/syllabus/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete syllabus');
    return response.json();
};

// --- ATTENDANCE ---
export const fetchAttendance = async (date: string, class_id: string, section_id: string) => {
    const response = await fetch(`${API_BASE_URL}/attendance?date=${date}&class_id=${class_id}&section_id=${section_id}`, { headers: await getAuthHeaders() });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to fetch attendance' }));
        throw new Error(err.error || response.statusText);
    }
    return response.json();
};

export const markAttendance = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to mark attendance');
    return response.json();
};

// --- ASSIGNMENTS ---
export const fetchClassTeachers = async () => {
    const response = await fetch(`${API_BASE_URL}/assignments/class-teachers`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch class teachers');
    return response.json();
};

export const assignClassTeacher = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/assignments/class-teacher`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to assign class teacher');
    return response.json();
};

export const removeClassTeacher = async (class_id: string, section_id: string) => {
    const response = await fetch(`${API_BASE_URL}/assignments/class-teacher?class_id=${class_id}&section_id=${section_id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to remove class teacher');
    return response.json();
};

// --- EXAMS ---
export const fetchExams = async () => {
    const response = await fetch(`${API_BASE_URL}/exams`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch exams');
    return response.json();
};

export const createExam = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/exams`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create exam');
    return response.json();
};

export const updateExam = async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update exam');
    return response.json();
};

export const deleteExam = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete exam');
    return response.json();
};

export const fetchExamSubjects = async (exam_id: string, class_id?: string) => {
    let url = `${API_BASE_URL}/exams/subjects?exam_id=${exam_id}`;
    if (class_id) url += `&class_id=${class_id}`;
    const response = await fetch(url, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch exam subjects');
    return response.json();
};

export const addExamSubject = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/exams/subjects`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to add exam subject');
    return response.json();
};

export const fetchMarks = async (exam_subject_id: string) => {
    const response = await fetch(`${API_BASE_URL}/exams/marks?exam_subject_id=${exam_subject_id}`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch marks');
    return response.json();
};

export const saveMarks = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/exams/marks`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to save marks');
    return response.json();
};

export const fetchPendingMarksheets = async (exam_id: string, class_id: string) => {
    const response = await fetch(`${API_BASE_URL}/exams/marksheets/pending?exam_id=${exam_id}&class_id=${class_id}`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch pending marksheets');
    return response.json();
};

export const uploadMarksheet = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/exams/marksheets/upload`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to upload marksheet');
    return response.json();
};

// --- FEES ---
export const fetchFeeTypes = async () => {
    const response = await fetch(`${API_BASE_URL}/fees/types`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch fee types');
    return response.json();
};

export const createFeeType = async (name: string, description: string) => {
    const response = await fetch(`${API_BASE_URL}/fees/types`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ name, description })
    });
    if (!response.ok) throw new Error('Failed to create fee type');
    return response.json();
};

export const fetchFeeStructure = async (class_id?: string) => {
    let url = `${API_BASE_URL}/fees/structure`;
    if (class_id) url += `?class_id=${class_id}`;
    const response = await fetch(url, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch fee structure');
    return response.json();
};

export const createFeeStructure = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/fees/structure`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to create fee structure' }));
        throw new Error(err.error || response.statusText);
    }
    return response.json();
};

export const fetchStudentFeeStatus = async (student_id: string) => {
    const response = await fetch(`${API_BASE_URL}/fees/status?student_id=${student_id}`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch fee status');
    return response.json();
};

export const recordFeePayment = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/fees/payment`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to record payment');
    return response.json();
};

// --- DASHBOARD ---
export const fetchDashboardStats = async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
};

export const fetchSubjectAssignments = async (teacher_id?: string) => {
    let url = `${API_BASE_URL}/assignments/subject-teachers`;
    if (teacher_id) url += `?teacher_id=${teacher_id}`;
    const response = await fetch(url, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return response.json();
};

export const assignSubjectTeacher = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/assignments/subject-teacher`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to assign subject');
    return response.json();
};

export const removeSubjectTeacher = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/assignments/subject-teacher/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to remove assignment');
    return response.json();
};

// --- TIMETABLE ---
export const fetchTimetable = async (class_id?: string, section_id?: string, teacher_id?: string) => {
    let url = `${API_BASE_URL}/timetable?1=1`;
    if (class_id) url += `&class_id=${class_id}`;
    if (section_id) url += `&section_id=${section_id}`;
    if (teacher_id) url += `&teacher_id=${teacher_id}`;

    const response = await fetch(url, { headers: await getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch timetable');
    return response.json();
};

export const createTimetableEntry = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/timetable`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create timetable entry');
    }
    return response.json();
};

export const deleteTimetableEntry = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/timetable/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete timetable entry');
    return response.json();
};

// --- SETTINGS MODULE ---

export const fetchSettings = async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/settings`, { headers });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
};

export const updateSettings = async (data: any) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
};

export const fetchDisabledAccounts = async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/settings/accounts/disabled`, { headers });
    if (!response.ok) throw new Error('Failed to fetch disabled accounts');
    return response.json();
};

export const disableAccount = async (userId: string, reason: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/settings/accounts/disable`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId, reason }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to disable account');
    }
    return response.json();
};

export const enableAccount = async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/settings/accounts/enable`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId }),
    });
    if (!response.ok) throw new Error('Failed to enable account');
    return response.json();
};
