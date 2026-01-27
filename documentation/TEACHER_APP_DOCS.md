# Teacher App Documentation

## 1. Overview
The **Teacher App** is a specialized mobile application built with **React Native (Expo)** that empowers educators to manage their daily classroom responsibilities directly from their smartphones.

**Operating System**: Android (APK) & iOS (Development Build)
**Auth**: Login via Credentials provided by Admin.

## 2. Core Features & Workflows

### A. Authentication
-   **Login**: Teachers log in using email/password.
-   **Validation**: The system checks if the user has `role = 'teacher'`. 
-   **Security**: Accounts can be disabled by Admin, preventing login.

### B. Dashboard
-   **Quick Overview**: View assigned Class and Section.
-   **Shortcuts**: Fast access to Attendance, Marks, and Homework.
-   **Notices**: View latest announcements from the Admin.

### C. Attendance Management
**Workflow**:
1.  **Select Class**: Choose from assigned classes.
2.  **Mark Status**: List of students appears. Toggle status (Present/Absent/Late).
    -   *Default is Absent or Present based on config.*
3.  **Submit**: Saves to server.
4.  **Finalize**: A critical step. Once finalized, attendance **CANNOT** be edited by the teacher (requires Admin intervention). This ensures data integrity.

### D. Marks Entry
**Workflow**:
1.  **Select Exam**: Choose active/published exams.
2.  **Select Subject**: Choose the subject you teach.
3.  **Enter Marks**: Input marks for each student.
    -   *Validation*: Cannot exceed Max Marks.
4.  **Save**: Updates the central database.

### E. Homework & Assignments
-   **Create Assignment**: Title, Description, Due Date, and optional attachment.
-   **View History**: See past assignments given to classes.
-   **Push Notification**: Creating homework triggers an alert to all students in that class.

### F. Student Notes (Remarks)
-   **Logic**: Teachers can add behavioral or academic notes for specific students.
-   **Privacy**: Notes are visible to the specific student/parent and Admins, but not other students.

### G. Profile & Settings
-   **My Profile**: View personal details (Qualifications, Joining Date).
-   **Settings**: 
    -   Change Password.
    -   Toggle Notifications.
    -   Theme Selection (if enabled).

## 3. Technical Implementation
-   **State Management**: React Context (`AuthContext`, `DataProvider`).
-   **Navigation**: `TabNavigator` (Home, Profile) nested inside `StackNavigator`.
-   **Offline Support**: Basic caching using `AsyncStorage` (primarily online-first architecture).
-   **API Calls**: Centralized in `src/services/api.ts` with Bearer Token authentication.
