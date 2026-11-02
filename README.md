# Student Intern & Vocational Training Management System

An end-to-end enterprise full-stack web application designed to streamline, automate, and track student internship and vocational training applications through a multi-tiered departmental approval workflow.

---

## 🌟 Key Roles & Access Control (RBAC)

| Role | Access Level & Description |
| :--- | :--- |
| **PROPOSER** | Corporate employee / sponsor proposing a trainee/intern. Can create, track, and delete their submitted applications. |
| **GUIDE** | Designated Mentor/Guide for the trainee. First-level reviewer assessing technical placement feasibility. |
| **GUIDE_GM** | Departmental General Manager. Reviews and verifies requests specific to their department (e.g., HR, Finance, IT, Engineering). |
| **TRAINING_OFFICER** | Central training coordinator overseeing organization-wide capacity and policy compliance. Third-level reviewer. |
| **HR_GM** | Final Approval Authority. Uploads digital signature, approves the request, generates the official Internship Approval Letter PDF, and triggers automated email delivery. |

---

## 🔄 Flow-by-Flow Application Workflow

```mermaid
flowchart TD
    A[Proposer Creates Request] -->|Submit| B(PENDING_GUIDE)
    B -->|Guide Approves| C(PENDING_GGM)
    B -->|Guide Rejects| R1[REJECTED / Proposer Correction]
    C -->|Dept GM Approves| D(PENDING_TO)
    C -->|Dept GM Rejects| B
    D -->|Training Officer Approves| E(PENDING_HR)
    D -->|Training Officer Rejects| C
    E -->|HR GM Approves & Embeds Signature| F[APPROVED]
    E -->|HR GM Rejects| D
    F --> G[Generate PDF Training Letter]
    G --> H[Automated Email to Proposer & Guide with PDF Attachment]
```

### 1️⃣ Flow 1: Authentication & User Registration
1. User registers via `/signup` specifying their name, official email, role, department, designation, and password.
2. A 6-digit OTP is generated and dispatched for email verification.
3. User logs in at `/login` receiving a signed JSON Web Token (JWT).
4. Based on role permissions:
   - **PROPOSER** is routed to `/proposer-dashboard`.
   - **Reviewers** (`GUIDE`, `GUIDE_GM`, `TRAINING_OFFICER`, `HR_GM`) are routed to `/dashboard`.

---

### 2️⃣ Flow 2: Proposer Application Submission
1. Click **+ Create New Request** on the Proposer Dashboard.
2. **Step 1: Trainee Details (`/TraineeDetails`)**:
   - Provide Trainee Name, Relationship, University/Institute Name, Campus Address, Pincode, Area of Training, and Training Dates.
   - *Date validation*: Selection of past dates is disabled (`min` attribute restricted to current date onwards).
3. **Step 2: Guide Details (`/GuideDetails`)**:
   - Specify Guide Name, Designation, and Department (e.g. HR, IT, Electrical, Mechanical).
4. **Step 3: Review & Submit (`/Review`)**:
   - Preview all entered details with a stepper progress UI.
   - Click **Submit**. The system transactionally commits the records to PostgreSQL and routes the application to `PENDING_GUIDE`.
   - Upon successful submission, the form clears and redirects back to the Proposer Dashboard.

---

### 3️⃣ Flow 3: Multi-Level Approval Pipeline
Reviewers log in to their dashboard (`/dashboard`) where only applications requiring their action appear:

* **Level 1 (Guide Review)**:
  - The assigned Guide inspects request specs and clicks **Approve & Forward** (moves status to `PENDING_GGM`) or **Send Back to Proposer**.
* **Level 2 (Department GM Review)**:
  - The Dept GM reviews requests matching their specific department and clicks **Approve & Forward** (moves status to `PENDING_TO`) or **Send Back to Guide**.
* **Level 3 (Training Officer Review)**:
  - The Training Officer validates institutional compliance and clicks **Approve & Forward** (moves status to `PENDING_HR`) or **Send Back to Dept GM**.
* **Level 4 (HR GM Final Approval & PDF Issuance)**:
  - The HR GM uploads an official digital signature image (optional) and clicks **Approve & Issue Training Letter**.
  - The backend generates a standardized, formatted Internship Approval Letter PDF with reference numbers, official header/footer, and embedded HR signature using `PDFKit`.
  - The system dispatches an automated notification email with the generated PDF attached via `Brevo HTTP API` / `Nodemailer`.

---

### 4️⃣ Flow 4: Application Deletion
* Both **Proposers** (on `ProposerDashboard`) and **Reviewers** (on `Dashboard`) have access to a 🗑️ **Delete Application** option.
* Clicking **Delete** opens a confirmation modal prompt.
* Upon confirmation, the backend executes an atomic Prisma `$transaction` that cleanly removes the `training_request`, `trainee`, and `guide` database records.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React.js (v19), Vite, Tailwind CSS (v4), React Router DOM, Axios |
| **Backend** | Node.js (ESM), Express.js |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Document Generation** | PDFKit |
| **Email Engine** | Brevo HTTP API & Nodemailer (Gmail SMTP fallback) |
| **Security & Auth** | JSON Web Tokens (JWT), bcryptjs password hashing, CORS, OTP Verification |

---

## 💻 Installation & Setup Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) database instance

### 2. Environment Setup
Create a `.env` file in the `server` directory:

```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/student_intern_portal_db?schema=public"
JWT_SECRET="student_intern_portal_secret_key_12345"

# Brevo HTTP API Configuration (Recommended)
BREVO_API_KEY="your_brevo_api_key"
BREVO_FROM_NAME="Student Intern Portal"
BREVO_FROM_EMAIL="internportal41@gmail.com"

# SMTP Fallback Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="internportal41@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="internportal41@gmail.com"
```

### 3. Database Migration & Prisma Setup
```bash
cd server
npx prisma generate
npx prisma db push
```

### 4. Running the Development Servers

**Run Server (Backend):**
```bash
cd server
npm run dev
```

**Run Client (Frontend):**
```bash
cd client
npm run dev
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register a new user & trigger OTP email | ❌ No |
| `POST` | `/auth/login` | Login user & return JWT token | ❌ No |
| `POST` | `/auth/verify-otp` | Verify 6-digit email OTP | ❌ No |
| `GET` | `/Review` | Fetch requests (filtered by user role & department) | ✅ Yes |
| `POST` | `/Review` | Submit a new student internship training request | ✅ Yes |
| `POST` | `/Review/:id/action` | Multi-level approval / rejection / send-back | ✅ Yes |
| `DELETE` | `/Review/:id` | Cascading deletion of request, trainee & guide | ✅ Yes |
| `GET` | `/health` | API server health check | ❌ No |
