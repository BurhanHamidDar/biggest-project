-- MASTER SCHEMA SCRIPT
-- This script sets up the entire database schema for the School ERP System.
-- It includes all tables, extensions, enums, triggers, RLS policies, and Storage buckets.
-- Run this on a FRESH Supabase project.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE notice_importance AS ENUM ('low', 'medium', 'high', 'critical');

-- 3. BASE TABLES

-- Profiles (Base table for all users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT CHECK (email ~* '^.+@.+\..+$'),
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    phone_number TEXT,
    address TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Academic Years
CREATE TABLE academic_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., '2023-2024'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false
);

-- Classes
CREATE TABLE classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., 'Class 10'
    order_index INTEGER DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Sections
CREATE TABLE sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'A', 'B'
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(class_id, name)
);

-- Subjects
CREATE TABLE subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. EXTENDED USER TABLES

-- Teachers
CREATE TABLE teachers (
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    qualification TEXT,
    joining_date DATE,
    department TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Students
CREATE TABLE students (
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    admission_no TEXT UNIQUE NOT NULL,
    roll_no TEXT,
    dob DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    blood_group TEXT,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    parent_name TEXT,
    parent_phone TEXT,
    bus_id UUID, -- Legacy column, prefer student_transport table for strict link
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 5. STAFF & TRANSPORT

-- Buses
CREATE TABLE buses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bus_number TEXT NOT NULL UNIQUE,
    capacity INTEGER,
    route_name TEXT,
    driver_id UUID, -- Will link to drivers
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Drivers
CREATE TABLE drivers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name TEXT NOT NULL,
    license_number TEXT,
    phone_number TEXT,
    assigned_bus_id UUID REFERENCES buses(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Update Bus Driver link (Cyclic dependency)
ALTER TABLE buses ADD CONSTRAINT fk_buses_driver FOREIGN KEY (driver_id) REFERENCES drivers(id);

-- Student Transport (Strict Link)
CREATE TABLE student_transport (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(profile_id) ON DELETE CASCADE,
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id)
);

-- 6. CORE ACADEMIC MODULES

-- Class Teacher Assignment
CREATE TABLE class_teachers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES teachers(profile_id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    UNIQUE(class_id, section_id, academic_year_id)
);

-- Subject Teacher Assignment
CREATE TABLE subject_teachers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES teachers(profile_id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id)
);

-- 7. ATTENDANCE

CREATE TABLE attendance_registers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),
    marked_by UUID REFERENCES teachers(profile_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT CHECK (status IN ('draft', 'finalized')) DEFAULT 'draft',
    UNIQUE(date, class_id, section_id)
);

CREATE TABLE attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    register_id UUID REFERENCES attendance_registers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(profile_id),
    status attendance_status NOT NULL DEFAULT 'absent',
    remarks TEXT
);

-- 8. EXAMS & MARKS

CREATE TABLE exams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    academic_year_id UUID REFERENCES academic_years(id),
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_published BOOLEAN DEFAULT false
);

CREATE TABLE exam_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    class_id UUID REFERENCES classes(id),
    max_marks DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    pass_marks DECIMAL(5, 2) NOT NULL DEFAULT 35.00,
    exam_date DATE
);

CREATE TABLE marks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_subject_id UUID REFERENCES exam_subjects(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(profile_id),
    marks_obtained DECIMAL(5, 2),
    grade TEXT,
    remarks TEXT,
    UNIQUE(exam_subject_id, student_id)
);

-- Student Marksheets (Uploaded Files)
CREATE TABLE student_marksheets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(profile_id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_student_exam_marksheet UNIQUE(student_id, exam_id)
);

-- Class Tests (Small Tests)
CREATE TABLE class_tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(profile_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    max_marks DECIMAL(5, 2) NOT NULL,
    test_date DATE DEFAULT date(now()),
    status TEXT CHECK (status IN ('draft', 'finalized')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE class_test_marks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_id UUID REFERENCES class_tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(profile_id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(test_id, student_id)
);

-- 9. FEES

CREATE TABLE fee_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE class_fee_structures (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id),
    fee_type_id UUID REFERENCES fee_types(id),
    academic_year_id UUID REFERENCES academic_years(id),
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE
);

CREATE TABLE student_fee_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(profile_id),
    class_fee_structure_id UUID REFERENCES class_fee_structures(id),
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    payment_date DATE,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT CHECK (status IN ('paid', 'partial', 'pending')),
    remarks TEXT
);

-- 10. COMMUNICATION

-- Notices
CREATE TABLE notices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    attachment_url TEXT,
    importance notice_importance DEFAULT 'low',
    target_role user_role[], 
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Inbox
CREATE TABLE inbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('notice', 'attendance', 'marks', 'fee', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_inbox_user_id ON inbox(user_id);

-- Push Tokens
CREATE TABLE push_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, token)
);

-- Student Notes
CREATE TABLE student_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    note_text TEXT NOT NULL,
    note_type TEXT CHECK (note_type IN ('General', 'Academic', 'Behaviour')) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_student_notes_student_id ON student_notes(student_id);

-- 11. OPERATIONS

-- Homework
CREATE TABLE homework (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(profile_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Syllabus
CREATE TABLE syllabus (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Timetable
CREATE TABLE timetable (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(profile_id) ON DELETE CASCADE,
    day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    period_number INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(class_id, section_id, day, period_number),
    UNIQUE(teacher_id, day, period_number)
);

-- 12. SYSTEM TABLES

-- System Settings (Global)
CREATE TABLE system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    app_blocked BOOLEAN DEFAULT false,
    maintenance_message TEXT,
    notifications_homework BOOLEAN DEFAULT true,
    notifications_attendance BOOLEAN DEFAULT true,
    notifications_marks BOOLEAN DEFAULT true,
    notifications_notices BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Student Notification Settings (Per User)
CREATE TABLE student_notification_settings (
    student_id UUID REFERENCES students(profile_id) ON DELETE CASCADE PRIMARY KEY,
    homework BOOLEAN DEFAULT true,
    attendance BOOLEAN DEFAULT true,
    marks BOOLEAN DEFAULT true,
    fees BOOLEAN DEFAULT true,
    notices BOOLEAN DEFAULT true,
    remarks BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Disabled Accounts
CREATE TABLE disabled_accounts (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    reason TEXT,
    disabled_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 13. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 14. ENABLE ROW LEVEL SECURITY (Comprehensive)
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_test_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE disabled_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_marksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

-- 15. RLS POLICIES
-- Generic Policies (Read All for Authenticated - Base for many tables)
CREATE POLICY "Public read academic years" ON academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read classes" ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read sections" ON sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read subjects" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read fee types" ON fee_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- System Settings
CREATE POLICY "Public read system settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage system settings" ON system_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Teachers & Staff
CREATE POLICY "Public read teachers" ON teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read drivers" ON drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read buses" ON buses FOR SELECT TO authenticated USING (true);

-- Students (Privacy)
CREATE POLICY "Teachers view all students" ON students FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher') OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Students view own record" ON students FOR SELECT TO authenticated USING (profile_id = auth.uid());

-- Academic (Timetable, Syllabus, Notices)
CREATE POLICY "Read timetable" ON timetable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read syllabus" ON syllabus FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read notices" ON notices FOR SELECT TO authenticated USING (true);

-- Attendance
CREATE POLICY "Teachers manage registers" ON attendance_registers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers manage records" ON attendance_records FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students view own attendance" ON attendance_records FOR SELECT TO authenticated USING (student_id = auth.uid());

-- Homework
CREATE POLICY "Teachers manage homework" ON homework FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students view homework" ON homework FOR SELECT TO authenticated USING (true);

-- Exams & Marks
CREATE POLICY "Read exams" ON exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read exam subjects" ON exam_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers enter marks" ON marks FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers view marks" ON marks FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students view own marks" ON marks FOR SELECT TO authenticated USING (student_id = auth.uid());

-- Class Tests
CREATE POLICY "Teachers manage tests" ON class_tests FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers manage test marks" ON class_test_marks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students view own test marks" ON class_test_marks FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students view published tests" ON class_tests FOR SELECT TO authenticated USING (status = 'finalized' OR status = 'published');

-- Student Marksheets
CREATE POLICY "Read own marksheets" ON student_marksheets FOR SELECT TO authenticated USING (student_id = auth.uid());

-- Fees
CREATE POLICY "Read fee structures" ON class_fee_structures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers manage payments" ON student_fee_payments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students view own payments" ON student_fee_payments FOR SELECT TO authenticated USING (student_id = auth.uid());

-- Transport (Student)
CREATE POLICY "View transport" ON student_transport FOR SELECT USING (true);

-- Notes
CREATE POLICY "Teachers create notes" ON student_notes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "View notes" ON student_notes FOR SELECT TO authenticated USING (
  (student_id = auth.uid()) OR (teacher_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Push Tokens
CREATE POLICY "Manage own token" ON push_tokens FOR ALL TO authenticated USING (user_id = auth.uid());

-- Inbox
CREATE POLICY "Manage own inbox" ON inbox FOR ALL TO authenticated USING (user_id = auth.uid());

-- Disabled Accounts
CREATE POLICY "Read disabled status" ON disabled_accounts FOR SELECT USING (true);

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Student Notification Settings
CREATE POLICY "Students can view own settings" ON student_notification_settings FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students can update own settings" ON student_notification_settings FOR UPDATE TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students can insert own settings" ON student_notification_settings FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins can manage settings" ON student_notification_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);


-- 16. STORAGE
-- 'avatars' Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Avatar Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'avatars' );
CREATE POLICY "Avatar Auth Update" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'avatars' );
CREATE POLICY "Avatar Auth Delete" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'avatars' );

-- 'marksheets' Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('marksheets', 'marksheets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Marksheets Public Read" ON storage.objects FOR SELECT USING ( bucket_id = 'marksheets' );
CREATE POLICY "Marksheets Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'marksheets' );
-- Ideally restrict upload to Admin/Teacher, allowing broad Auth for now per original design
CREATE POLICY "Marksheets Auth Update" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'marksheets' );
CREATE POLICY "Marksheets Auth Delete" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'marksheets' );


-- 17. DEFAULT DATA
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

-- End of Master Schema Script
