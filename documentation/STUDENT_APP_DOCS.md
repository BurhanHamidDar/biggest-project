# Student App Documentation

## 1. Overview
The **Student App** is the digital companion for students and parents, providing real-time access to academic progress, school news, and financial records.

**Operating System**: Android (APK) & iOS (Development Build)
**Target Users**: Students (and Parents via student credentials).

## 2. Core Features & UI Flows

### A. Authentication & Splash
-   **Branding**: Custom "School ERP" Splash Screen with Navy Blue theme.
-   **Login**: Secure login. Support for OTP login (if enabled).
-   **Session**: Persists login to avoid repetitive sign-ins.

### B. Home Dashboard
-   **Identity Card**: Displays Name, Class, Roll No, and Photo.
-   **Stats**: Attendance percentage, pending assignments count.
-   **Recent Notices**: Scrolling ticker or list of latest updates.

### C. Academic Modules
1.  **Attendance**: 
    -   Calendar view showing Present/Absent status.
    -   Summary statistics (Total Days, Present Days).
2.  **Timetable**: 
    -   Daily class schedule with subjects, timing, and teacher names.
3.  **Syllabus**:
    -   Downloadable curriculum files per subject.
4.  **Homework**:
    -   List of active assignments.
    -   Details view with description and due dates.

### D. Exams & Results (Security Enforced)
-   **Marksheets**: View term-wise results and scanned marksheet files.
-   **Fee Lock Security Rule**:
    > **CRITICAL**: If the student has **Pending Fees** (as determined by the backend), the Result/Marksheet section is **LOCKED**. A "Fee Due" alert is shown instead of the marks. This is enforced Server-Side (API returns error) and Client-Side (UI block).

### E. Fee Center
-   **My Fees**: View fee structure for the year.
-   **Payment History**: List of all transactions with dates and receipts.
-   **Status**: Clear indicators for "Paid", "Pending", or "Partial".

### F. Communication
-   **Inbox**: Personal messages or system alerts.
-   **Push Notifications**: 
    -   Receive alerts for: *Fee Dues, New Homework, Absent Marks, Exam Schedules*.
    -   Deep linking (clicking notification opens relevant screen).

## 3. Security Rules
1.  **Data Isolation**: RLS (Row Level Security) ensures a student can **ONLY** see their own data. Trying to fetch another student's ID returns empty/error.
2.  **Fee Lock**: Backend middleware checks fee status before serving Result APIs.
3.  **Profile Protection**: Students cannot edit their own academic data (Name, Class, Roll No). They can only update non-critical settings (e.g., Notification preferences).
