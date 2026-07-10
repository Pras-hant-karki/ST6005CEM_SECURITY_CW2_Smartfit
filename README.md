<div align="center">
  <h1>🏥 SmartFit — Hospital Management System</h1>
  <p><strong>A fullstack MERN application with three role-based portals — Patient, Doctor, and Admin — each with a dedicated React frontend and a shared, security-hardened Express.js API</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=flat-square&logo=node.js" />
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb" />
    <img src="https://img.shields.io/badge/React_18-Vite-61DAFB?style=flat-square&logo=react" />
    <img src="https://img.shields.io/badge/Redux-Toolkit-764ABC?style=flat-square&logo=redux" />
    <img src="https://img.shields.io/badge/JWT-HttpOnly_Cookies-000000?style=flat-square&logo=jsonwebtokens" />
    <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe" />
  </p>
</div>

---

## Overview

SmartFit is a fullstack Hospital Management System built as a security-focused academic project. It provides three completely isolated React frontends — one each for patients, doctors, and admins — all backed by a single hardened Express 5 REST API with role-based access control, JWT authentication via HttpOnly cookies, and a layered security model.

The system supports the full appointment lifecycle: patients register and book appointments with available doctors, doctors verify and complete appointments using a unique code, and admins manage doctor registrations, oversee all activity, and run system maintenance. Sensitive operations such as password reset use CSPRNG-generated OTPs sent via email, and payments are handled through Stripe with server-side amount enforcement.

The codebase has been subjected to a white-box penetration test covering authentication, authorisation, business logic, input validation, session management, and information exposure — producing a 22-bug internal security report.

---

## Architecture

```
SmartFit/
├── Backend/          # Express 5 REST API — shared by all three portals
│   ├── src/
│   │   ├── controllers/    # Business logic per resource
│   │   ├── models/         # Mongoose schemas (Patient, Doctor, Admin, Appointment, AuditLog)
│   │   ├── routes/         # Route registration per portal
│   │   ├── middlewares/    # Auth, error handling, rate limiting, CAPTCHA, temp-JWT
│   │   ├── services/       # Mail, OTP, Stripe webhook, audit logger
│   │   └── utils/          # Helpers — password validator, OTP generator, email templates
├── Frontend/         # Patient portal  — Vite + React (port 5173)
├── Doctor/           # Doctor portal   — Vite + React (port 5174)
└── Admin/            # Admin portal    — Vite + React (port 5175)
```

```
Patient / Doctor / Admin  (React + Redux Toolkit)
              ↓  HTTP requests
        Express 5 API  (port 8000)
        ├── verifyAuth middleware  (JWT from HttpOnly cookie)
        ├── requireRole middleware (enforces portal separation)
        ├── Rate limiter + adaptive CAPTCHA
        └── asyncHandler + global error middleware
              ↓
          MongoDB  (Mongoose ODM)
```

---

## Role Breakdown

### 🧑‍⚕️ Patient
- Register and login with email + password (bcrypt-hashed, min 8 chars)
- Forgot-password flow: CSPRNG OTP sent to email → verified → reset
- Browse doctors by department, check monthly availability calendar
- Book appointments with available slots, view appointment history
- Cancel or reschedule upcoming appointments
- Pay consultation fees via Stripe
- Session managed with 15-minute access token + 20-day refresh token (both HttpOnly cookies)

### 👨‍⚕️ Doctor
- Register (pending admin approval), login, manage profile and shift schedule
- View today's and all assigned appointments
- Verify patient arrival using a unique appointment code
- Mark appointments as Completed after consultation
- Separate session cookies from patient portal (`accesstoken`/`refreshtoken`)

### 🔐 Admin
- Register (restricted to existing admins only), login, manage profile
- Approve or reject pending doctor registrations
- View all appointments across the entire system
- Trigger or schedule the auto-cancellation cron job (protected by `CRON_SECRET`)
- View audit logs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js with ES Modules (`"type": "module"`) |
| Backend Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT (access + refresh tokens in HttpOnly cookies) |
| Password Security | bcrypt (salt rounds 10), minimum 8 chars, max 128 chars |
| OTP | `crypto.randomInt` (CSPRNG), bcrypt-hashed in-memory store |
| Email | Nodemailer (appointment confirmations, cancellations, OTP) |
| Payments | Stripe (server-side amount, webhook signature verification) |
| Rate Limiting | `express-rate-limit` + adaptive in-memory CAPTCHA trigger |
| File Upload | Multer → local `public/uploads/` |
| Audit Logging | Custom `AuditLog` Mongoose model + `logAudit` service |
| Frontend | React 18, Vite, Redux Toolkit (`createAsyncThunk`), Tailwind CSS |
| State Management | Redux Toolkit with `createAsyncThunk` per resource slice |

---

## Key Implementation Details

- **Three isolated frontends** — Patient (5173), Doctor (5174), Admin (5175) each run as separate Vite apps pointing to the same backend at port 8000. Role concerns are strictly separated at both frontend (separate apps) and backend (middleware) levels.
- **HttpOnly cookie auth** — access tokens (15 min) and refresh tokens (20 days) are stored in HttpOnly, SameSite=Strict cookies. Patient portal uses `accessToken`/`refreshToken`; Doctor and Admin portals use `accesstoken`/`refreshtoken`.
- **Role-based middleware** — `verifyAuth` infers the required role from the URL path and verifies the JWT's `role` claim accordingly. `requireRole()` provides an additional guard on sensitive admin operations.
- **Two-step MFA-like login** — credential verification issues a short-lived `tempToken` cookie; OTP verification exchanges it for full session tokens. The `verifyTempjwt` middleware gates the OTP verification step.
- **Appointment lifecycle** — appointments have a strict status machine: `Confirmed → Completed` (via unique code) or `Confirmed → Cancelled`. Cron endpoint auto-cancels past confirmed appointments and marks them for deletion after 24 hours.
- **Adaptive CAPTCHA** — in-memory `rateStore.js` tracks failed login attempts per IP. After a threshold is crossed, the `/login` response includes a `captchaRequired: true` flag and the frontend shows a CAPTCHA challenge.
- **Stripe integration** — payment amount is always computed server-side from `doctor.consultationfee`. Stripe webhook verifies the `stripe-signature` header and is idempotent via `PaymentIntent` metadata.
- **Audit logging** — every significant action (login, appointment created/cancelled, password change, OTP request) is logged to the `AuditLog` collection with userId, role, action, resource, IP, result, and timestamp.
- **MVC + service layer** — backend is split into `controllers/` (request/response), `services/` (mail, OTP, Stripe, audit), `models/` (Mongoose schemas), and `middlewares/` (cross-cutting concerns).

---

## Local Setup

```bash
git clone https://github.com/Pras-hant-karki/SmartFit.git
cd SmartFit
```

**Backend:**
```bash
cd Backend
npm install
```

Create `Backend/.env`:
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/smartfit

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=20d

CRON_SECRET=your_cron_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
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

---

## API Structure

All routes are prefixed with `/api/v1/`.

| Prefix | Portal | Auth |
|---|---|---|
| `/patient/` | Patient portal | Patient JWT cookie |
| `/doctor/` | Doctor portal | Doctor JWT cookie |
| `/admin/` | Admin portal | Admin JWT cookie |
| `/auto-cancel` | Cron trigger | `Authorization: Bearer <CRON_SECRET>` |

Key endpoint groups:
- `POST /patient/login` — login with adaptive CAPTCHA
- `POST /patient/forgot-password/send-otp` — request CSPRNG OTP
- `POST /patient/forgot-password/verify-otp` — verify OTP (requires `tempToken` cookie)
- `POST /patient/appointments/book-appointment/:doctorid` — book appointment
- `GET  /patient/appointments/availability` — monthly slot calendar (query: `doctorid`, `month`, `year`)
- `POST /admin/register` — create admin (requires existing admin session)
- `GET  /auto-cancel` — cron job to cancel past appointments

---

## Deployment

The application is not yet hosted. Planned deployment options:

- **Docker** — containerise each Vite frontend and the Express backend separately, orchestrate with `docker-compose`
- **Self-hosted VPS** — run backend with PM2, serve frontends as static builds via Nginx

---

## Security Testing

This project includes a comprehensive internal white-box penetration test. All findings are documented in:

- [`BUGS.md`](BUGS.md) — 22 bugs (3 Critical, 8 High, 7 Medium, 3 Low, 1 Informational) with severity, CVSS scores, category, description, buggy code, and fix
- [`STRUCTURE.md`](STRUCTURE.md) — Full structured report per bug: internal test finding, step-by-step evidence reproduction guide (Burp Suite + Postman), 40–50 word remediation, before/after code comparison

Testing methodology: white-box, tools used include Burp Suite Community (Intercept, Repeater, Intruder), Postman, MongoDB Compass, Redux DevTools, and Chrome DevTools.

---

## Author

**Prashant Karki**  
🔗 [GitHub](https://github.com/Pras-hant-karki)
