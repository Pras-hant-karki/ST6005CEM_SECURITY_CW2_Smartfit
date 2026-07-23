<div align="center">
  <h1>SmartFit — Hospital Management System</h1>
  <p><strong>A fullstack MERN application with three role-based portals — Patient, Doctor, and Admin — each with a dedicated React frontend and a shared, security-hardened Express.js API</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=flat-square&logo=node.js" />
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb" />
    <img src="https://img.shields.io/badge/React_18-Vite-61DAFB?style=flat-square&logo=react" />
    <img src="https://img.shields.io/badge/Redux-Toolkit-764ABC?style=flat-square&logo=redux" />
    <img src="https://img.shields.io/badge/JWT-HttpOnly_Cookies-000000?style=flat-square&logo=jsonwebtokens" />
    <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker" />
  </p>
</div>

---

## Overview

SmartFit is a fullstack Hospital Management System built as a security-focused academic project (ST6005CEM Security, Coursework 2). It provides three completely isolated React frontends — one each for patients, doctors, and admins — all backed by a single hardened Express 5 REST API with role-based access control, JWT authentication via HttpOnly cookies, and a layered security model covering authentication, session management, input validation, and transport security.

The system supports the full appointment lifecycle: patients register, browse doctors by department, and book appointments against a live availability calendar; doctors verify patient arrival with a unique appointment code and issue prescriptions and lab tests; admins approve doctor registrations, manage departments, and oversee system-wide activity. Every login (all three roles) is two-factor — a correct password only issues a short-lived session after a CSPRNG-generated email OTP is also verified. Payments are handled through Stripe with the charge amount always computed server-side and webhook events verified by signature. Patients, doctors, and admins can each export a full copy of their own data as a PDF and permanently (soft-)delete their own account, satisfying GDPR-style data-access and erasure requirements.

The backend's full API surface is documented as an interactive OpenAPI 3.0 spec, served live at `/api-docs`.

---

## Architecture

```
SmartFit/
├── Backend/          # Express 5 REST API — shared by all three portals
│   ├── src/
│   │   ├── controllers/    # Business logic per resource
│   │   ├── models/         # Mongoose schemas (Patient, Doctor, Admin, Appointment,
│   │   │                   #   Prescription, Labtest, Payment, Department, AuditLog, Otp)
│   │   ├── routes/         # Route registration per portal
│   │   ├── middlewares/    # Auth, RBAC, CSRF, rate limiting, CAPTCHA, IP block,
│   │   │                   #   input sanitization, error handling
│   │   ├── services/       # Mail, OTP, audit logging, security alerting, PDF export
│   │   ├── utils/          # Password validator, OTP generator, sanitizers, CSRF token
│   │   └── docs/           # Swagger/OpenAPI definitions (served at /api-docs)
│   └── vercel.json         # Serverless deployment config
├── Frontend/         # Patient portal  — Vite + React (port 5173)
├── Doctor/           # Doctor portal   — Vite + React (port 5174)
├── Admin/            # Admin portal    — Vite + React (port 5175)
└── docker-compose.yml # Orchestrates MongoDB + Backend + all 3 frontends
```

```
Patient / Doctor / Admin  (React + Redux Toolkit, code-split per route)
              |  HTTPS/HTTP requests, credentials included
        Express 5 API  (port 8000)
        ├── ipBlockMiddleware        (rejects IPs with repeated lockouts)
        ├── Helmet                   (CSP, HSTS, frame/MIME protections)
        ├── CORS                     (env-driven origin whitelist)
        ├── NoSQL operator stripping (deletes any "$..." key from body/query)
        ├── context-aware sanitization (XSS/control-char defense, per field type)
        ├── CSRF double-submit cookie check
        ├── express-rate-limit       (tiered: global / login / OTP / MFA)
        ├── verifyAuth               (JWT from HttpOnly cookie, role-aware)
        └── requireRole              (secondary RBAC gate on sensitive routes)
              |
          MongoDB  (Mongoose ODM)
```

---

## Role Breakdown

### Patient
- Register and login (password hashed with bcrypt, 12-char minimum with mixed case/digit/special-character policy)
- Two-factor login: password, then an emailed OTP, before any session token is issued
- Forgot-password flow: CSPRNG OTP sent to email, verified, then reset
- Browse doctors by department, check live monthly availability, book/cancel/reschedule appointments
- Pay consultation fees via Stripe (amount always computed server-side)
- View prescriptions and lab test results issued by their doctor
- Export all of their own data as a PDF; permanently delete their own account (password + OTP required)
- Session: short-lived access token + long-lived refresh token, both HttpOnly cookies; refresh tokens rotate on every use and are bound to the issuing browser

### Doctor
- Register (held as pending until an admin approves), login (same MFA flow as patients), manage profile and weekly shift schedule
- View today's and all assigned appointments; verify patient arrival using the appointment's unique code
- Issue prescriptions and order lab tests against completed appointments; record and verify lab results
- Export their own data as a PDF; delete their own account (blocked if they have upcoming appointments still to work through)
- Separate session cookies from the patient portal — the three portals never share a session

### Admin
- Registration is restricted to an existing authenticated admin (no public admin signup)
- Approve or reject pending doctor registrations; manage doctor records and department listings
- View all appointments across the system; view a security dashboard summarizing recent failed logins and audit events
- Export their own data as a PDF; delete their own account (blocked if they are the last remaining admin)
- Trigger/schedule the appointment auto-cancellation job (protected by a shared `CRON_SECRET`, not a user session)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js with ES Modules (`"type": "module"`) |
| Backend Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT access + refresh tokens in HttpOnly cookies, with rotation and reuse detection |
| Multi-Factor Auth | Email OTP (`crypto.randomInt` CSPRNG, bcrypt-hashed, MongoDB TTL expiry) |
| Security Headers | Helmet (strict CSP, HSTS, frame protection), manual Permissions-Policy |
| CSRF Protection | Double-submit cookie pattern, timing-safe comparison |
| Input Sanitization | Custom NoSQL-operator stripper + context-aware XSS sanitizer (`sanitize-html` for rich text, lightweight sanitizers for names/emails/phones/search) |
| Rate Limiting | `express-rate-limit`, tiered per endpoint sensitivity, plus adaptive CAPTCHA and account lockout |
| Payments | Stripe — server-side amount enforcement, webhook signature verification, abandoned-session reconciliation |
| File Upload | Multer (memory storage, MIME + extension allow-list, 5MB limit) |
| PDF Generation | `pdfkit` — used for the "export my data" feature |
| API Documentation | `swagger-jsdoc` + `swagger-ui-express`, served at `/api-docs` |
| Audit Logging | Custom `AuditLog` Mongoose model + `logAudit` / `reportSecurityEvent` services |
| Frontend | React 18, Vite, Redux Toolkit (`createAsyncThunk`), Tailwind CSS, route-level code splitting via `React.lazy` |
| Containerization | Docker (multi-stage builds), Docker Compose, Nginx (serves each frontend's static build) |

---

## Key Implementation Details

- **Three isolated frontends** — Patient (5173), Doctor (5174), Admin (5175) run as separate Vite apps against the same backend on port 8000. Role separation is enforced at both the frontend (separate apps/bundles) and backend (`verifyAuth`/`requireRole` middleware) levels.
- **HttpOnly cookie auth with rotation** — every refresh issues a brand-new access/refresh pair and overwrites the stored token; presenting an already-rotated refresh token is treated as a theft signal and revokes the session. Refresh tokens are also bound to the issuing browser's User-Agent.
- **Two-step login (email OTP MFA)** — a correct password never issues session cookies directly. It returns `mfaRequired: true` and emails a one-time code; only a valid code against the short-lived MFA session issues real access/refresh tokens. All three roles go through this.
- **Layered brute-force defense** — 5 failed attempts locks an account for 30 minutes; hCaptcha is required after 3 failed attempts; an IP that triggers 5 separate account lockouts in a day is blocked outright. Login/OTP/MFA endpoints also sit behind their own tighter `express-rate-limit` tiers on top of this.
- **Context-aware input sanitization** — a field-registry-based middleware sanitizes request bodies/queries/params differently by field type (identity fields, email, phone, rich medical text, search) rather than one blanket rule; passwords, tokens, IDs, dates, and numbers are never touched. Runs alongside (and separately from) NoSQL-operator stripping.
- **CSRF (double-submit cookie)** — every state-changing request must echo a readable `csrfToken` cookie back in an `X-CSRF-Token` header, compared with a timing-safe check. Exempt only for the Stripe webhook, which is authenticated by signature instead.
- **IDOR / ownership checks** — every record lookup by ID is followed by an explicit comparison against the authenticated user's own ID before the record is returned or modified.
- **Stripe payment integrity** — the charge amount is always computed server-side from the doctor's stored consultation fee, never trusted from the client. Webhook events are verified by `stripe-signature`, cross-checked against Stripe directly, and idempotent; abandoned checkout sessions are reconciled to an `expired` state instead of being left stuck as `pending`.
- **GDPR-style data rights** — every role can export a full PDF of their own data and permanently delete their own account (soft-delete: PII is scrubbed and the account disabled, but the underlying document is kept so appointment/payment/lab-test references never dangle). Deletion requires the current password plus a freshly verified OTP.
- **Optional HTTPS for local dev** — the backend can run over a self-signed HTTPS certificate (`HTTPS_ENABLED=true`) using the same Express app, useful for testing Secure-cookie behavior locally.
- **Audit logging & security alerting** — every security-relevant action (login, lockout, token reuse, MFA failure, payment events, account deletion, etc.) is written to an `AuditLog` collection and, for high-risk events, can trigger an email alert.
- **API documentation is isolated from business logic** — the entire OpenAPI spec lives in dedicated `Backend/src/docs/*.docs.js` files (pure JSDoc comments, no executable code), so documenting the API can never affect how it behaves.

---

## Local Setup

```bash
git clone https://github.com/Pras-hant-karki/ST6005CEM_SECURITY_CW2_Smartfit.git
cd ST6005CEM_SECURITY_CW2_Smartfit
```

**Backend:**
```bash
cd Backend
npm install
```

Create `Backend/.env`:
```env
PORT=8000
HTTPS_ENABLED=false
# Only needed if HTTPS_ENABLED=true — see Backend/certs/README.md
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem

MONGODB_URL=mongodb://localhost:27017
DB_NAME=SmartFit

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=20d

CRON_SECRET=your_cron_secret

# Frontend origins allowed by CORS
CORS_ORIGIN_PATIENT=http://localhost:5173
CORS_ORIGIN_ADMIN=http://localhost:5174
CORS_ORIGIN_DOCTOR=http://localhost:5175
PATIENT_FRONTEND_URL=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:8000

# Gmail account used to send OTPs and notification emails (use an App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Optional — enables hCaptcha on registration/login; omitted, CAPTCHA is skipped
HCAPTCHA_SECRET_KEY=
```

```bash
npm run dev        # starts on port 8000
```

**Patient frontend (port 5173):**
```bash
cd Frontend
npm install
npm run dev
```

**Doctor frontend (port 5174):**
```bash
cd Doctor
npm install
npm run dev
```

**Admin frontend (port 5175):**
```bash
cd Admin
npm install
npm run dev
```

Each frontend's `.env` needs `VITE_API_BASE_URL` (or, for the patient app, `VITE_PROXY_API_TARGET`) pointing at the backend — see the commented examples already in each app's `.env` file. If your machine's network IP changes, that's the only thing that needs updating; no source files reference it.

---

## API Structure

All routes are prefixed with `/api/v1/`. The full interactive spec is served at **`/api-docs`** (raw JSON at `/api-docs.json`) once the backend is running.

| Prefix | Portal | Auth |
|---|---|---|
| `/patient/` | Patient portal | Patient JWT cookie |
| `/doctor/` | Doctor portal | Doctor JWT cookie |
| `/admin/` | Admin portal | Admin JWT cookie |
| `/payment/` | Stripe checkout + webhook | Patient JWT cookie (webhook: Stripe signature) |
| `/auto-cancel` | Cron trigger | `Authorization: Bearer <CRON_SECRET>` |

Representative endpoints:
- `POST /patient/login` → `POST /patient/login/verify-mfa` — two-step login with email OTP
- `POST /patient/forgot-password/send-otp` / `verify-otp` / `update-password` — password reset flow
- `GET  /patient/appointments/availability` — live monthly slot calendar (query: `doctorid`, `month`, `year`)
- `POST /patient/appointments/book-appointment/:doctorid` — book an appointment
- `GET  /patient/export-data` / `DELETE /patient/delete-account` — GDPR data export/erasure (mirrored under `/doctor/` and `/admin/`)
- `POST /doctor/appointments/verify-appointment` — verify a patient's arrival by unique code
- `POST /admin/doctors` — create a doctor account (admin-only)
- `GET  /auto-cancel` — cron job that cancels past-due confirmed appointments

---

## Deployment

The application is containerized and runs via **Docker Compose** — `docker-compose.yml` at the repo root orchestrates 5 services:

- `mongodb` — MongoDB 7
- `backend` — the Express API (built from `Backend/Dockerfile`)
- `frontend`, `doctor`, `admin` — each a multi-stage build (Vite build → static files served by **Nginx**) exposed on ports 5173/5174/5175 respectively

```bash
docker compose up --build
```

Required secrets (`ACCESS_TOKEN_SECRET`, `STRIPE_SECRET_KEY`, `EMAIL_USER`, etc.) are read from the host environment — see the `environment:` block in `docker-compose.yml` for the full list. `docker-compose.hub.yml` is the equivalent for pulling pre-built images from a registry instead of building locally.

A serverless deployment path also exists (`vercel.json` in the backend and all three frontends, `@vercel/node` for the API) as an alternative to the Docker path, but Docker is the currently-used deployment method.

---

## Security

SmartFit's backend has gone through systematic, iterative security hardening across authentication, session management, input validation, transport security, and data privacy — see [Key Implementation Details](#key-implementation-details) above for the specifics, and the live `/api-docs` page for the full endpoint-level contract (including which endpoints require which auth).

---

## Author

**Prashant Karki**
[GitHub](https://github.com/Pras-hant-karki)
