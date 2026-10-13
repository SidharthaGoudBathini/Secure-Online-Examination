# Secure Online Examination System
> **"Secure. Fair. Reliable."**

A comprehensive, enterprise-grade web application for administering, monitoring, and evaluating academic assessments with automated objective scoring, AI-assisted proctoring telemetry, browser containment, and tamper-proof audit trails.

---

## 1. System Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts |
| **State & Forms** | React Hook Form, Zod schema validation, Context API |
| **Backend** | Node.js, Express.js, TypeScript, REST API |
| **Database & ORM**| Prisma ORM with SQLite (zero-config local out-of-the-box) & PostgreSQL compatible |
| **Real-Time Telemetry**| Socket.IO (bidirectional WebSocket rooms for proctor alerts & student messaging) |
| **Authentication & Security** | JWT (JSON Web Tokens), HTTP-only cookies, Bcrypt password hashing, Express Rate Limit |

---

## 2. Default Test Accounts (Development & Evaluation)

The application includes pre-configured database seeds with realistic data, courses, questions, and test accounts:

| Role | Email Address | Password | Permissions & Dashboard |
| :--- | :--- | :--- | :--- |
| **Student** | `student@secureexam.edu` | `Student@123` | Student Dashboard, Exam Taking, Readiness Check, Results |
| **Faculty** | `faculty@secureexam.edu` | `Faculty@123` | Faculty Dashboard, Exam Creator, Question Bank, Live Monitor, Grading |
| **Administrator** | `admin@secureexam.edu` | `Admin@123` | Institutional Overview, User Control, Courses, Security Policies, Audit Trail |

> **Note**: A quick-switch demo toolbar is also integrated into the top navigation bar so evaluators can seamlessly switch roles in one click.

---

## 3. Implemented Modules & 25 Required Pages

### Public & Authentication
1. **Landing Page (`/`)**: Hero section, system architecture, feature highlights, and interactive demo account access.
2. **Login (`/login`)**: Secure credential authentication with rate limiting and credential-neutral error responses.
3. **Registration (`/register`)**: Self-service student, faculty, and administrator onboarding.
4. **Profile & Settings (`/profile`)**: User information management and password updates.
5. **Unauthorized (`/unauthorized`)**: 403 Forbidden role guard.
6. **Not Found (`*`)**: 404 Route handler.

### Student Portal
7. **Student Dashboard (`/student/dashboard`)**: Welcome banner, available exams, performance history, and Recharts score analytics.
8. **Available Examinations (`/student/exams`)**: Course schedule listings with search, subject filter, and security badges.
9. **Examination Instructions (`/student/exam/:id/instructions`)**: Examination parameters, rules, and academic honor code pledge.
10. **System Readiness Check (`/student/exam/:id/readiness`)**: Hardware checks (Webcam, Microphone, Fullscreen API, Server Latency).
11. **Examination Interface (`/exam/:id/take`)**: Distraction-minimized testing window, live countdown timer, question palette, autosave, and proctoring feed.
12. **Submission Confirmation (`/exam/:id/submitted`)**: Cryptographic submission confirmation with celebratory confetti.
13. **Student Results (`/student/results/:sessionId`)**: Score breakdown, pass/fail status, and question-by-question review with explanations.

### Faculty Portal
14. **Faculty Dashboard (`/faculty/dashboard`)**: Managed examinations, drafts, active test takers, and quick publishing actions.
15. **Examination Creation (`/faculty/exams/create`)**: Multi-section wizard for scheduling, scoring, negative marking, and proctoring thresholds.
16. **Examination Edit (`/faculty/exams/edit/:id`)**: Edit draft parameters and update security options.
17. **Question Bank (`/faculty/question-bank`)**: Centralized repository of Single Choice, Multi-Select, and Short-Answer questions.
18. **Examination Preview (`/faculty/exam/:id/preview`)**: Full test preview with authoritative answer keys and direct publish button.
19. **Live Examination Monitoring (`/faculty/exam/:id/monitor`)**: Real-time Socket.IO room with active taker table, live incident logs, and direct student warning messaging.
20. **Faculty Reports (`/faculty/reports`)**: Candidate answer sheet review, manual subjective grading, and CSV grade export.

### Administrator Portal
21. **Administrator Dashboard (`/admin/dashboard`)**: Institutional metrics, pass rates, security alerts, and system health.
22. **User Management (`/admin/users`)**: Search, filter, add, edit, and deactivate user accounts.
23. **Course & Subject Management (`/admin/courses`)**: Academic programs, credit hours, and subject units.
24. **Examination Scheduling (`/admin/schedule`)**: Institution examination timetables and status transitions.
25. **Security Monitoring (`/admin/security`)**: Global governance policies (Tab switch limit, strict fullscreen, webcam enforcement).
26. **Audit Logs (`/admin/audit-logs`)**: Searchable, filterable audit trail of every access and administrative action.
27. **Reports & Analytics (`/admin/analytics`)**: Recharts graphs comparing subject pass rates, violation distributions, and CSV export.

---

## 4. Setup and Execution Instructions

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### 1. Installation
Clone the repository and install dependencies:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Database Synchronization & Seeding
```bash
cd server

# Synchronize database schema (creates dev.db with SQLite)
npx prisma db push

# Populate initial sample development data & test accounts
npx tsx prisma/seed.ts
```

### 3. Running Development Servers
You can start both servers independently or concurrently:

```bash
# Terminal 1 - Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2 - Frontend Client (Port 3000)
cd client
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 5. Security Architecture & Proctoring Telemetry

- **Containment & Focus Detection**: Detects browser tab switches (`visibilitychange`), window blurs, and fullscreen exits.
- **Fair Proctoring Standards**: Tab-switch events are classified as indicators for review with configurable thresholds, rather than automatic disqualifications.
- **Answer Key Security**: Correct answers and question explanations are strictly stripped from responses delivered to students during active exam sessions.
- **Idempotent Submission**: Server-side logic prevents duplicate final submissions and validates timers with grace periods for network latency.
- **Server-Side Scoring**: Objective answers are graded authoritatively on the backend, supporting positive scores and negative marking deductions.
- **Database Portability**: Runs with zero configuration out-of-the-box on SQLite, and seamlessly connects to PostgreSQL by setting `DATABASE_URL` in `server/.env`.
