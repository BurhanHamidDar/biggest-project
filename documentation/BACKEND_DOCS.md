# Backend Documentation

## 1. Architecture Overview
The backend is a robust RESTful API built with **Node.js** and **Express**, serving as the logic layer between the client applications and the Supabase database. It handles complex business logic that cannot be safely executed on the client side, such as fee locks, sensitive data processing, and push notification orchestration.

**Hosting**: Render (Web Service)
**Database**: Supabase (PostgreSQL)

## 2. Folder Structure
```
backend/
├── src/
│   ├── config/         # DB Connection & Env Config
│   ├── controllers/    # Business Logic (req/res handling)
│   ├── middlewares/    # Auth, Validation, Role Checks
│   ├── routes/         # API Endpoint Definitions
│   ├── services/       # External Services (Supabase Admin, Expo)
│   └── utils/          # Helper Functions
├── index.js            # Entry Point
└── package.json        # Dependencies
```

## 3. Key Components

### A. Authentication Middleware (`authMiddleware.js`)
-   Intercepts every request (except `/auth/*`).
-   Validates the **Bearer Token** (JWT) sent by the client using Supabase Auth.
-   Attaches the `user` object to `req.user` for downstream use.

### B. Role Middleware
-   Ensures RBAC (Role-Based Access Control).
-   Usage: `router.post('/create', authMiddleware, checkRole(['admin']), controller.create)`
-   Prevents students/teachers from accessing Admin APIs.

### C. Controllers
-   **Student Controller**: Fetches profiles, enforces data visibility rules.
-   **Exam Controller**: Handles mark entry and `getStudentResult` logic (including Fee Lock check).
-   **Attendance Controller**: logic for `draft` vs `finalized` attendance states.
-   **Notification Controller**: Orchestrates sending push notifications via Expo.

## 4. Keep-Alive System
To prevent the Render free-tier instance from sleeping (spinning down), a self-ping mechanism is implemented:
-   **Endpoint**: `/ping` (Returns 200 OK).
-   **Cron Job**: A script (or external service) pings this endpoint every 14 minutes.

## 5. API Flow Example (Marking Attendance)
1.  **Request**: `POST /api/attendance/mark` (Body: `{ date, classId, students: [...] }`)
2.  **Middleware**: 
    -   Check Auth Token.
    -   Check Role ('teacher' or 'admin').
3.  **Controller**:
    -   Validate input.
    -   Check if attendance for this Date+Class already exists.
    -   **Transaction**: Insert `AttendanceRegister` -> Insert`AttendanceRecords`.
4.  **Response**: 201 Created.

## 6. Security
-   **CORS**: Configured to allow requests only from specific origins (Netlify Admin, Mobile Apps).
-   **Environment Variables**: Sensitive keys (`SUPABASE_SERVICE_ROLE`, `SUPABASE_URL`) are stored in `.env` and never committed to Git.
-   **Input Validation**: Basic validation to prevent SQL injection (handled by parameterized queries/ORM).
