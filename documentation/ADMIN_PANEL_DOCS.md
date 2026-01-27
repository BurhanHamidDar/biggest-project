# Admin Panel Documentation

## 1. Overview
The **Admin Panel** is the central command center for the School ERP. It is a web-based application built with **Next.js** designed for school administrators to manage users, configure academic settings, and oversee daily operations.

**URL**: `https://<your-netlify-url>.netlify.app/` (Production)
**Local**: `http://localhost:3000`

## 2. Authentication & Permissions
- **Access**: Restricted to users with `role = 'admin'` in the `profiles` table.
- **Security**: 
    -   Login via Email/Password (Supabase Auth).
    -   Session persistence handled by local storage and context state.
    -   Unauthorized users are redirected to Login.

## 3. Workflows & Features

### A. Dashboard
- **Quick Stats**: Total Students, Teachers, Classes, and Revenue.
- **Recent Activity**: Audit logs of recent system actions.
- **Quick Links**: Shortcuts to add students, notices, etc.

### B. User Management
1.  **Students**:
    -   **Add Student**: Creates Auth User + Profile + Student Record. Auto-generates default password.
    -   **List View**: Filter by Class/Section.
    -   **Edit/Delete**: Update details or soft-delete (archive) records.
2.  **Teachers**:
    -   **Add Teacher**: Creates Auth User + Profile + Teacher Record.
    -   **Assign Class Teacher**: Link a teacher to a specific Class & Section (HR).
    -   **Assign Subject Teacher**: Link a teacher to specific Subjects in a Class.

### C. Academic Configuration
1.  **Classes & Sections**:
    -   Create standard classes (e.g., Class 1, Class 10).
    -   Add sections (A, B, C) to each class.
    -   **Critical**: Sort order determines display hierarchy.
2.  **Subjects**:
    -   Global subject repository (Math, Science, English).
    -   Subjects are mapped to classes via exams/timetable.

### D. Fee Management
1.  **Fee Structures**:
    -   Define fees for a specific Academic Year and Class (e.g., Class 10 Tuition Fee = $500).
    -   Set Due Dates.
2.  **Record Payment**:
    -   Search Student -> Select Fee Type -> Enter Amount.
    -   Status updates automatically (Pending -> Partial -> Paid).

### E. Exam Management
1.  **Create Exam**: Define name (Mid-Term), dates, and status (Draft/Published).
2.  **Exam Subjects**: Map subjects to the exam with Max Marks and Pass Marks.
3.  **Upload Marksheets**: Admin can bulk upload result files if needed (usually handled by system/teachers).

### F. Communication
-   **Notices**: Post announcements.
    -   **Target Audience**: All, Teachers Only, or Students Only.
    -   **Attachments**: Support for PDF/Image links.
    -   **Push Notification**: Creating a notice triggers an instant alert to mobile apps.

### G. System Settings
-   **Global Locking**: Toggle "Block App Access" to prevent logins during maintenance.
-   **Maintenance Message**: Custom message displayed when app is blocked.
-   **Notification Toggles**: Enable/Disable specific notification types globally.

## 4. Technical Notes (For Developers)
-   **Project Structure**: `/admin-panel`
-   **Routing**: Next.js App Router/Pages Router (check `next.config.ts`).
-   **API Integration**: `src/services/api.ts` handles all backend calls.
-   **Styling**: SCSS modules and React Bootstrap components.
-   **Deployment**: Static Export (`output: 'export'`) for Netlify compatibility. `_redirects` file handles client-side routing.
