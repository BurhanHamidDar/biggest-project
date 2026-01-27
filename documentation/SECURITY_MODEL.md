# Security Model Documentation

## 1. Authentication Layer
The system uses **Supabase Auth** (GoTrue) for identity management.

-   **Transport**: All credentials sent over HTTPS.
-   **Method**: Email/Password login.
-   **Tokens**: JWT (JSON Web Tokens) are issued upon login:
    -   `access_token`: Short-lived, used for API requests.
    -   `refresh_token`: Long-lived, used to renew sessions.

## 2. Authorization (RBAC)
We implement strict **Role-Based Access Control** at two levels:

### Level 1: Database (Row Level Security)
PostgreSQL policies enforce rules at the data storage layer. Even if the API is bypassed, the database will reject unauthorized queries.

| Role | Access Scope |
| :--- | :--- |
| **Student** | Can `SELECT` own profile, active class notices, and own marks. Cannot list other students. |
| **Teacher** | Can `SELECT` all students (search/list). Can `INSERT/UPDATE` marks and attendance. |
| **Admin** | Full access (usually bypasses RLS via Service Role in backend). |

### Level 2: Backend Middleware
API endpoints are protected by `authMiddleware` and `roleMiddleware`.

```javascript
// Example: Only Admins can create new users
router.post('/add-student', 
    authMiddleware,           // 1. Is user logged in?
    checkRole(['admin']),     // 2. Is user an admin?
    controller.addStudent
);
```

## 3. The "Fee Lock" Mechanism
A critical business rule is preventing students with overdue fees from viewing their exam results.

**Implementation**:
1.  **Trigger**: User requests `GET /api/student/result`.
2.  **Backend Check**: 
    -   Controller queries `student_fee_payments`.
    -   Calculates `Total Due vs Total Paid`.
    -   If `Due > 0`, the server responds with:
        `403 Forbidden: { error: "FEES_DUE", message: "Please clear pending fees." }`
3.  **Frontend Handling**: The app catches this 403 error and displays a "Locked" UI instead of the marksheet.

## 4. Attendance Integrity
To prevent tampering with historical attendance records:
-   **Draft Mode**: Teachers can edit attendance freely.
-   **Finalized Mode**: Once a teacher clicks "Submit Final", the `status` column creates a hard lock.
-   **Enforcement**: Backend rejects `UPDATE` requests on finalized registers unless performed by an Admin.

## 5. Secrets Management
-   **Environment Variables**: No API keys are hardcoded. keys like `SUPABASE_SERVICE_ROLE_KEY` are injected via `.env` files.
-   **Client Side**: React Native apps use `expo-constants` to read public keys. Private keys are NEVER exposed to the client bundle.

## 6. App Blocking (Kill Switch)
In case of emergency or maintenance:
-   Admin toggles `app_blocked = true` in System Settings.
-   App Middleware checks this flag on startup.
-   If true, the user is redirected to a "Maintenance Screen" and cannot proceed, effectively locking the entire user base out.
