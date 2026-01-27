-- ⚠️ DANGER: This script deletes ALL data from the database.
-- Run this in the Supabase SQL Editor to reset your system.

BEGIN;

-- 1. Truncate all tables (CASCADE handles foreign keys)
TRUNCATE TABLE
    attendance_records,
    attendance_registers,
    audit_logs,
    buses,
    class_fee_structures,
    class_teachers,
    class_test_marks,
    class_tests,
    classes,
    disabled_accounts,
    drivers,
    exam_subjects,
    exams,
    fee_types,
    homework,
    -- inbox, (Commented out as it might not exist yet)
    marks,
    notices,
    push_tokens,
    sections,
    student_fee_payments,
    student_marksheets,
    student_notes,
    student_transport,
    students,
    subject_teachers,
    subjects,
    syllabus,
    teachers,
    timetable,
    academic_years,
    profiles,           -- CAUTION: This deletes user profiles. You must also delete users in Auth > Users!
    system_settings
RESTART IDENTITY CASCADE;

-- 2. Restore Default System Settings (Optional but recommended)
INSERT INTO system_settings (
    app_blocked, 
    maintenance_message,
    notifications_homework,
    notifications_attendance,
    notifications_marks,
    notifications_notices
) VALUES (
    false, 
    'System is under maintenance. Please try again later.',
    true,
    true,
    true,
    true
);

COMMIT;

-- 3. IMPORTANT POST-ACTION
-- Go to Authentication -> Users in Supabase Dashboard and delete all users there too.
-- Otherwise, you will have "Orphaned" users who can login but have no profile data (and will get errors).
