# College Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application designed to digitalize college administration. It features secure Role-Based Access Control (RBAC) across three distinct portals (Admin, Staff, Student) to manage daily attendance, exam marks, dynamic timetables, and help desk ticketing.

## Table of Contents

- [Features](#features)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
  - [Authentication & Users](#authentication--users)
  - [Attendance](#attendance)
  - [Examination Marks](#examination-marks)
  - [Timetable](#timetable)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Security Notes](#security-notes)

## Features

- **Multi-Tier Dashboards:** Custom responsive UI for Admins, Faculty, and Students.
- **Bulk Attendance Processing:** Execute high-performance class-wide attendance updates via MongoDB `bulkWrite`.
- **Conflict-Free Scheduling:** Automated backend validation to prevent double-booking staff or sections.
- **Live Directory Search:** Instantly retrieve student profiles, attendance metrics, and report cards.
- **Dockerized Environment:** One-click deployment utilizing multi-stage Docker builds and `docker-compose`.

## Configuration

Create a `.env` file in your `backend` directory (or root if running a combined setup) with the following variables:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/college_portal?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
PORT=3000
```
## Project Structure
```
MyCollegePortal/
├── docker-compose.yml          # Container orchestration
├── backend/                    # Node.js / Express API
│   ├── Dockerfile
│   ├── middleware/
│   │   └── authMiddleware.mjs  # JWT & RBAC validation
│   ├── models/
│   │   ├── userSchema.mjs      # Enforces role, department, semester
│   │   ├── attendanceSchema.mjs
│   │   ├── markSchema.mjs
│   │   └── timetableSchema.mjs
│   ├── routes/
│   │   ├── authRoutes.mjs
│   │   ├── attendanceRoutes.mjs
│   │   ├── marksRoutes.mjs
│   │   └── timetableRoutes.mjs
│   ├── index.mjs               # Main server entry point
│   ├── package.json
│   └── .env
└── FrontEnd/                   # React / Tailwind CSS Application
    ├── Dockerfile
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx # Global session management
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx
    │   │   ├── StaffDashboard.jsx
    │   │   └── StudentDashboard.jsx
    │   └── App.jsx
    └── package.json
```

## Running the Application
### Using Docker (Recommended)
Ensure Docker Desktop is running, navigate to the root folder (`MyCollegePortal`), and execute:

```Bash
docker-compose up --build
```
The React Frontend will be available at `http://localhost:80`

The Express Backend will be available at `http://localhost:3000`

MongoDB will run automatically on port `27017`

## Local Development (Manual)
### 1. Start the Backend:

```Bash
cd backend
npm install
npm run dev
```
### 2. Start the Frontend:

```Bash
cd FrontEnd
npm install
npm run dev
```
## API Endpoints
All protected endpoints require an `Authorization` header formatted as: `Bearer <jwt_token>`.

## Authentication & Users
## POST `/auth/login`
Authenticates a user and provisions a session token.
### Request Body:

```JSON
{
  "registrationId": "CSE-001",
  "password": "securepassword"
}
```
### Response (200 OK):

```JSON
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "Student",
  "isFirstLogin": false
}
```
## POST `/auth/register`
Registers a new user in the system.
Constraint: Students cannot hit this route. Staff can only create Students. Admins can create Staff or Students.
### Request Body:

```JSON
{
  "registrationId": "CSE-002",
  "name": "Jane Doe",
  "password": "initialpassword",
  "phone": "1234567890",
  "email": "jane@college.edu",
  "role": "Student",
  "department": "Computer Science",
  "semester": 3
}
```
## GET `/auth/students?department=Computer Science&semester=3`
Retrieves a filtered list of students for bulk operations.

## Attendance
## POST `/attendance/bulk-mark`
Submits an entire class roster's daily attendance in a single, optimized transaction.
Constraint: Requires Staff or Admin role.
### Request Body:

```JSON
{
  "date": "2026-09-27",
  "records": [
    { "studentId": "651a2b3c4d5e6f7a8b9c0d1e", "status": "Present" },
    { "studentId": "651a2b3c4d5e6f7a8b9c0d1f", "status": "Absent" }
  ]
}
```
## GET `/attendance/my-records`
Retrieves the logged-in student's historical attendance log.

## Examination Marks
## POST `/exam-marks/addMark`
Uploads a single subject grade for a student.
Constraint: Requires Staff or Admin role.
### Request Body:

```JSON
{
  "registrationId": "CSE-001",
  "subject": "Data Structures",
  "examType": "Internal 1",
  "marksObtained": 85,
  "totalMarks": 100
}
```
## PUT `/exam-marks/updateMark`
Overrides an existing grade.
Constraint: Strictly requires Admin role.

## Timetable
## POST `/timetable/create`
Allocates a class period to a staff member. Includes automated conflict screening to prevent double-booking.
Constraint: Requires Admin role.
### Request Body:

```JSON
{
  "department": "Computer Science",
  "semester": 3,
  "dayOfWeek": "Monday",
  "period": 1,
  "subject": "Data Structures",
  "staffId": "651a2b3c4d5e6f7a8b9c0d99"
}
```
## GET `/timetable/schedule/:department/:semester`
Retrieves the 5x8 grid schedule for a specific academic class.

## Role-Based Access Control (RBAC)
The system utilizes Express middleware (verifyToken) to enforce strict security boundaries:

Admin: Root access. Can register staff, manipulate global timetables, overwrite historical attendance/marks, and resolve infrastructure tickets.

Staff: Departmental access. Can register students, submit daily bulk attendance, and publish exam marks.

Student: Read-only access to personal profiles, attendance metrics, and report cards. Write access limited to submitting help desk complaints.

## Security Notes
Password Hashing: All passwords are mathematically scrambled using bcrypt via Mongoose pre('save') hooks prior to database insertion.

Stateless Sessions: The API utilizes JSON Web Tokens (JWT) with a 24-hour expiration lifecycle.

Frontend Interceptors: Global Axios response interceptors immediately wipe local storage and redirect to /login upon receiving a 401 Unauthorized or 403 Forbidden response.

Data Protection: Database .env credentials and the node_modules directory are explicitly excluded from version control via .gitignore and container environments via .dockerignore.
