# Pediatric Triage and Management System

This project is an AI-assisted pediatric triage and care management system for HCM. It helps hospital staff register patients, perform triage, classify urgency, manage waiting queues, assign doctors, run consultations, request and process lab exams, manage returns, and track shifts, rooms, notifications, and user accounts.

AI suggestions are assistive only. Clinical decisions, diagnosis, treatment, prescriptions, and discharge decisions must always be reviewed and approved by qualified health professionals.

## Main Users

- **Admin**: manages users, rooms, shifts, and overall system configuration.
- **Nurse / Triage**: registers patients, performs triage, assigns priority, manages queues, destinations, doctors, rooms, and shift reports.
- **Doctor**: checks in for duty, receives assigned patients, starts consultations, reviews triage data, requests lab exams, records diagnosis and treatment plans, schedules follow-ups, and finishes visits.
- **Lab Technician**: sees pending lab requests, records sample/result workflow, inserts results, and tracks ready/history lists.

## Tech Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS, Framer Motion, Lucide React, React Icons, React Joyride.
- **Backend**: Node.js, Express 5, PostgreSQL, JWT authentication, bcrypt password hashing.
- **Database**: PostgreSQL 16.
- **AI / Integrations**: Google GenAI/Gemini, Twilio, Novu notifications, Cloudinary uploads, Firecrawl.
- **DevOps**: Docker Compose with separate `db`, `backend`, and `frontend` services.
- **PWA**: frontend includes a web manifest and service worker.

## Project Structure

```text
backend/
  server.js                 Express API entry point
  config/db.js              PostgreSQL connection
  controllers/              Request handlers
  models/                   Database queries and persistence logic
  routes/                   API routes and role protections
  services/                 AI, notifications, SMS, external services
  db/init.sql               Base PostgreSQL schema

frontend/
  src/App.jsx               Main route map
  src/lib/api.js            Frontend API client
  src/pages/admin/          Admin dashboard and management views
  src/pages/nurse/          Triage/nurse workflow
  src/pages/doctor/         Doctor workflow
  src/pages/lab-technician/ Lab technician workflow
  public/                   PWA files, logos, images
```

## Access and URLs

When running with Docker Compose:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Backend health check: `http://localhost:5000/health`
- PostgreSQL: `localhost:5432`

Main frontend routes:

- `/` public landing page
- `/login` login page
- `/admin` admin area
- `/triage/dashboard` nurse/triage dashboard
- `/doctor/dashboard` doctor dashboard
- `/lab/dashboard` lab technician dashboard
- `/queue` shared queue for doctor/nurse roles

## Environment Setup

Create real `.env` files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend variables:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@db:5432/pediatric_system_db
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=1d

GEMINI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_PHONE=
LAB_NOTIFICATIONS_CLINIC_NAME=HCM Pediatria
LAB_NOTIFICATIONS_CLINIC_ADDRESS=Avenida Eduardo Mondlane, no 1653, Maputo
NOVU_API_KEY=
CLOUDINARY_URL=
FIRECRAWL_API_KEY=
```

Frontend variables:

```env
VITE_API_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

For Docker, the backend should use the Compose database host `db`. For local non-Docker backend runs, use `localhost` in `DATABASE_URL`.

## Running the Project

### Docker Compose

```bash
docker compose up --build
```

Then open:

```text
http://localhost:5173
```

### Local Development

Install dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

Run backend:

```bash
npm --prefix backend run dev
```

Run frontend:

```bash
npm --prefix frontend run dev
```

## Login and First Admin

The app uses JWT authentication and role-based route protection. Users are stored in PostgreSQL with roles:

- `ADMIN`
- `DOCTOR`
- `NURSE`
- `LAB_TECHNICIAN`

If your database does not already contain an admin user, create the first admin account through your existing seed process or directly in the database with a valid bcrypt password hash. After the first admin exists, use the Admin area to create normal system users.

Recommended test accounts:

| Role | Example Username | Purpose |
| --- | --- | --- |
| Admin | `admin` | Create users, configure rooms and shifts |
| Nurse | `nurse1` | Register patients and perform triage |
| Doctor | `doctor1` | Run consultation and request labs |
| Lab Technician | `lab1` | Process lab requests and results |

## How to Use the System

### Admin

1. Log in as an admin.
2. Open `/admin`.
3. Review dashboard statistics.
4. Create user accounts for nurses, doctors, lab technicians, and other admins.
5. Edit user profile information, activate/deactivate users, reset passwords, and delete test users when needed.
6. Assign shifts to nurses and doctors.
7. Configure rooms and capacity from the rooms management area.

### Nurse / Triage

1. Log in as a nurse.
2. Start or verify the active shift.
3. Open **Nova Triagem**.
4. Search for an existing patient by clinical code or name, or register a new patient.
5. Create a visit for the patient.
6. Fill triage data: vital signs, weight, general state, chief complaint, clinical notes, warning signs, and priority.
7. Review AI triage suggestion if available.
8. Assign a doctor when appropriate or hold the patient in the waiting line.
9. Monitor **Fila de Espera**, **Pacientes em Triagem**, rooms, doctors, destinations, and shift reports.

### Doctor

1. Log in as a doctor.
2. Start/check in to the doctor shift and set availability.
3. Open **Fila de Espera** or **Meus Pacientes**.
4. Start a consultation for a triaged patient.
5. Review triage data and patient clinical history.
6. Fill consultation steps: overview, questionnaire, diagnosis, plan, and finish.
7. Use AI doctor suggestion if configured.
8. Request lab exams if needed.
9. Save medical plan, prescription text, disposition, follow-up information, and finish the visit.
10. Use agenda and follow-up views for return visits.

### Lab Technician

1. Log in as a lab technician.
2. Open `/lab/dashboard`.
3. Review pending lab requests.
4. Move lab work through collection/processing states where available.
5. Insert lab results.
6. Confirm results appear under **Resultados Prontos**.
7. Verify delivered/completed items appear in daily history.

## End-to-End Testing Checklist

Use these checkboxes during manual QA. Test with at least one user per role.

### 1. Environment and Startup

- [ ] `docker compose up --build` starts `db`, `backend`, and `frontend`.
- [ ] Frontend opens at `http://localhost:5173`.
- [ ] Backend health endpoint returns `{ "ok": true }` at `http://localhost:5000/health`.
- [ ] Frontend can reach the backend using `VITE_API_URL`.
- [ ] Database connection works through `DATABASE_URL`.
- [ ] Refreshing protected pages does not break routing.
- [ ] Browser console has no critical runtime errors.

### 2. Authentication and Authorization

- [ ] Login succeeds with valid credentials.
- [ ] Login fails clearly with an invalid password.
- [ ] Logged-out users cannot access `/admin`, `/triage/*`, `/doctor/*`, `/lab/*`, or `/queue`.
- [ ] Admin can access `/admin`.
- [ ] Nurse can access `/triage/*` and `/queue`, but not doctor/lab/admin areas.
- [ ] Doctor can access `/doctor/*` and `/queue`, but not nurse/lab/admin areas.
- [ ] Lab technician can access `/lab/*`, but not admin/nurse/doctor areas.
- [ ] Logout clears the session and redirects correctly.
- [ ] Expired/invalid token redirects to `/login`.

### 3. Admin Flow

- [ ] Admin dashboard loads.
- [ ] Admin can create a nurse user.
- [ ] Admin can create a doctor user with specialization.
- [ ] Admin can create a lab technician user.
- [ ] Admin can create another admin user.
- [ ] Duplicate username is rejected.
- [ ] Required user fields are validated.
- [ ] Admin can activate/deactivate a user.
- [ ] Deactivated user cannot log in.
- [ ] Admin can reset a user password.
- [ ] User can log in with the reset password.
- [ ] Admin can assign nurse shift type: morning, afternoon, or night.
- [ ] Admin can assign doctor shift type: morning, afternoon, or night.
- [ ] Admin can update room settings/capacity.
- [ ] Updated rooms are visible to nurse/doctor views.

### 4. Nurse Shift Flow

- [ ] Nurse dashboard loads after login.
- [ ] Nurse shift status loads.
- [ ] Nurse can start a shift.
- [ ] Nurse can extend a shift.
- [ ] Nurse can stop/end a shift.
- [ ] Shift status persists after page refresh.
- [ ] Shift report shows useful counts after triage activity.

### 5. Patient Registration Flow

- [ ] Nurse can generate or enter a clinical code.
- [ ] Nurse can register a new patient with required fields.
- [ ] Missing required patient fields are rejected.
- [ ] Duplicate clinical code is rejected.
- [ ] Nurse can search an existing patient by clinical code.
- [ ] Nurse can search an existing patient by name.
- [ ] Nurse can edit patient details from queue/history views.
- [ ] Updated patient details appear in doctor and history screens.

### 6. New Triage Flow

- [ ] Nurse can create a visit for a selected patient.
- [ ] Nurse can fill temperature, heart rate, respiratory rate, oxygen saturation, and weight.
- [ ] Nurse can fill chief complaint and clinical notes.
- [ ] Nurse can select general state.
- [ ] Nurse can mark warning signs such as oxygen need, severe dehydration, lethargy, sitting difficulty, or syncope/collapse history.
- [ ] Nurse can request AI triage suggestion when AI is configured.
- [ ] AI failure is handled without blocking manual triage.
- [ ] Nurse can choose `URGENT`, `LESS_URGENT`, or `NON_URGENT`.
- [ ] Nurse can set or override max wait minutes.
- [ ] Saved triage creates/updates the visit status correctly.
- [ ] Patient appears in the waiting queue after triage.

### 7. Queue and Priority Flow

- [ ] Queue loads for nurse.
- [ ] Queue loads for doctor.
- [ ] Urgent patients are visually separated or prioritized.
- [ ] Less urgent and non-urgent patients appear in expected sections.
- [ ] Lab/return patients appear in their expected queue sections.
- [ ] Nurse can edit priority after triage.
- [ ] Nurse can remove/cancel a triage when allowed.
- [ ] Queue counts update after changes.
- [ ] Queue survives page refresh.
- [ ] Shared `/queue` route works for doctor and nurse roles.

### 8. Doctor Availability and Assignment Flow

- [ ] Doctor can start/check in to shift.
- [ ] Doctor availability appears to nurse.
- [ ] Nurse can view available, busy, and unavailable doctors.
- [ ] Nurse can assign a patient to an available doctor.
- [ ] Assigned patient appears under the doctor's patients.
- [ ] Doctor becomes busy/in consultation when consultation starts.
- [ ] Doctor availability updates after finishing consultation.

### 9. Doctor Consultation Flow

- [ ] Doctor can open assigned patient.
- [ ] Doctor can start consultation only for a valid triaged visit.
- [ ] Doctor sees patient identity, triage data, and clinical history.
- [ ] Doctor can navigate consultation steps.
- [ ] Doctor can save questionnaire/clinical notes.
- [ ] Doctor can record likely diagnosis and clinical reasoning.
- [ ] Doctor can request AI doctor suggestion when AI is configured.
- [ ] AI suggestion can be accepted, edited, or ignored.
- [ ] Doctor can save prescription/treatment plan.
- [ ] Doctor can record disposition plan.
- [ ] Doctor can mark no-charge chronic case when appropriate.
- [ ] Doctor can finish visit.
- [ ] Finished visit disappears from active queue and appears in history.

### 10. Lab Request Flow

- [ ] Doctor can request lab exams during consultation.
- [ ] Lab request appears in doctor's **Exames Solicitados**.
- [ ] Lab request appears in lab technician **Pedidos Pendentes**.
- [ ] Lab technician can open pending request details.
- [ ] Lab technician can update lab workflow status.
- [ ] Lab technician can insert required result fields.
- [ ] Result validation prevents incomplete required result submission.
- [ ] Saved result appears in **Resultados Prontos**.
- [ ] Doctor can view lab result.
- [ ] Doctor can notify patient that lab result is ready.
- [ ] Doctor can mark lab result delivered.
- [ ] Delivered/completed result appears in lab history.

### 11. Return and Follow-Up Flow

- [ ] Doctor can schedule a return/follow-up visit.
- [ ] Scheduled return appears in doctor's agenda/follow-up views.
- [ ] Doctor can open a return visit.
- [ ] Return visit keeps relation to the original visit.
- [ ] Return visit can be converted into a consultation if needed.
- [ ] Nurse can identify return patients in queue/destination views.

### 12. Destination, Rooms, and Admission Flow

- [ ] Nurse can view available rooms.
- [ ] Room capacity/status reflects admin configuration.
- [ ] Nurse can open destination view for patients needing final placement.
- [ ] Nurse can register admission placement where allowed.
- [ ] Nurse can update destination status.
- [ ] Invalid admission/destination action is rejected with a clear message.
- [ ] Discharge summary/PDF download works where available.

### 13. Patient History and Documents

- [ ] Nurse can view old patients.
- [ ] Doctor can search clinical history.
- [ ] Past visit timeline loads for a selected patient.
- [ ] Past visit details include triage, consultation plan, diagnosis, prescription, labs, and disposition where available.
- [ ] Editing past visit summary works for allowed roles.
- [ ] PDF generation/download works for supported templates.

### 14. Notifications Flow

- [ ] New urgent triage can trigger relevant notifications.
- [ ] Lab result ready can trigger relevant notifications.
- [ ] Notification preview opens from the header.
- [ ] Notifications page loads for nurse, doctor, and lab roles.
- [ ] Single notification can be marked as read.
- [ ] All notifications can be marked as read.
- [ ] Unread badges update immediately.
- [ ] Notification preferences can be saved.

### 15. Preferences and UI Settings

- [ ] Nurse preferences load and save.
- [ ] Doctor preferences load and save.
- [ ] Lab settings/preferences load and save.
- [ ] Font scale preference applies where supported.
- [ ] Emergency phone or notification preferences persist after refresh.
- [ ] Sidebar open/closed behavior is usable.
- [ ] Guided tour opens and does not block normal workflow.

### 16. AI and External Services

- [ ] App works when AI keys are missing, with graceful errors.
- [ ] Triage AI works when `GEMINI_API_KEY` is configured.
- [ ] Doctor AI works when `GEMINI_API_KEY` is configured.
- [ ] Twilio-related actions do not crash when Twilio keys are missing.
- [ ] Novu notification actions do not crash when Novu key is missing.
- [ ] Cloudinary upload/photo features work when Cloudinary variables are configured.
- [ ] Firecrawl-dependent features work when `FIRECRAWL_API_KEY` is configured.

### 17. Error Handling and Data Integrity

- [ ] API errors show useful messages in the UI.
- [ ] Required fields are validated in frontend and backend.
- [ ] Unauthorized API calls return 401/403 as expected.
- [ ] Deleted/deactivated users do not break historical records.
- [ ] A visit cannot start consultation without required triage state.
- [ ] Finished visits cannot be edited through active workflow paths unless explicitly supported.
- [ ] Page refresh does not duplicate visits, triages, or lab results.
- [ ] Multiple users working at once see queue/status updates after reload.

### 18. Build and Quality Checks

- [ ] Frontend build passes: `npm --prefix frontend run build`.
- [ ] Frontend lint passes: `npm --prefix frontend run lint`.
- [ ] Backend starts without syntax/runtime boot errors.
- [ ] Root format check passes if required: `npm run format:check`.
- [ ] Docker containers restart cleanly.
- [ ] No secrets are committed to git.

## Suggested Full Test Scenario

Use this scenario as a complete "happy path" test:

1. Admin logs in and creates one nurse, one doctor, and one lab technician.
2. Admin assigns shifts and confirms room settings.
3. Doctor logs in, starts shift, and marks availability.
4. Nurse logs in, starts shift, registers a new patient, creates visit, completes triage, and assigns the doctor.
5. Doctor opens assigned patient, starts consultation, records diagnosis, requests a lab exam, and saves the plan.
6. Lab technician logs in, opens pending request, inserts result, and marks it ready.
7. Doctor reviews result, notifies patient, records final plan, schedules follow-up if needed, and finishes visit.
8. Nurse verifies the patient leaves the active queue and appears in history/destination reporting.
9. Admin verifies dashboard/user/room data still loads correctly.

## Notes for Testers

- Use test patient names and phone numbers only.
- Do not use real clinical decisions as test data unless supervised by qualified staff.
- Keep one browser/session per role, or use separate browsers/incognito windows to avoid token confusion.
- Record the exact user role, route, action, and error message when reporting bugs.
- After every major action, refresh the page once and confirm the state persisted.
