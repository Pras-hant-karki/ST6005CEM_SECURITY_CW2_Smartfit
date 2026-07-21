# SmartFit — Viva Preparation Guide

Everything implemented across this engagement, with **file:line references** so you can open the real source during the viva and explain it confidently. Written to be read standalone — no need to re-read old chat history.

**Stack recap:** MERN. Three Vite/React frontends — Patient (`Frontend/`, port 5173), Doctor (`Doctor/`, port 5174), Admin (`Admin/`, port 5175) — sharing one Express 5 backend (`Backend/`, port 8000) and one MongoDB database via Mongoose.

---

## Table of Contents

1. [Security Headers & CSP (Helmet)](#1-security-headers--csp-helmet)
2. [Authentication & Session Management (JWT)](#2-authentication--session-management-jwt)
3. [Multi-Factor Authentication (Email OTP)](#3-multi-factor-authentication-email-otp)
4. [CSRF Protection](#4-csrf-protection)
5. [Brute-Force Defense (Lockout, Adaptive CAPTCHA, IP Block)](#5-brute-force-defense-lockout-adaptive-captcha-ip-block)
6. [Rate Limiting](#6-rate-limiting)
7. [Input Sanitization (NoSQL Injection)](#7-input-sanitization-nosql-injection)
8. [Authorization / IDOR Protection](#8-authorization--idor-protection)
9. [Payment Security (Stripe)](#9-payment-security-stripe)
10. [HTTPS / TLS](#10-https--tls)
11. [GDPR — Data Export & Right of Access](#11-gdpr--data-export--right-of-access)
12. [Account Deletion (Soft Delete)](#12-account-deletion-soft-delete)
13. [Swagger / OpenAPI Documentation](#13-swagger--openapi-documentation)
14. [CI/CD Pipeline (GitHub Actions)](#14-cicd-pipeline-github-actions)
15. [Frontend Performance](#15-frontend-performance)
16. [Likely Viva Questions & Model Answers](#16-likely-viva-questions--model-answers)

---

## 1. Security Headers & CSP (Helmet)

**In IT terms:** CSP (Content Security Policy) and other HTTP security headers are instructions the server sends to the browser telling it exactly what the page is allowed to do — which scripts can run, which sites can embed it, whether it can load in an iframe, etc. Helmet is an Express library that sets a whole bundle of these headers automatically instead of you writing each one by hand.

**Toddler version:** Imagine your website is a playground and the browser is a kid. CSP is the rulebook nailed to the gate: "only toys the playground owner brought in are allowed — no toys from strangers." If a bad guy sneaks a toy (a malicious script) in through a crack in the fence (like a comment box), the rulebook says "that's not on the approved list" and the kid isn't allowed to play with it.

**What if this wasn't implemented:** If an attacker manages to sneak a `<script>` tag into the site anywhere (stored XSS), the browser would just run it happily — stealing login cookies, redirecting users to fake pages, reading whatever's on screen. Without frame-blocking headers, the site could also be secretly embedded inside an invisible iframe on an attacker's page to trick users into clicking things they can't see (clickjacking).

**How it was implemented:** Added the `helmet` npm package, set a strict CSP that denies everything by default (`default-src: 'none'`) and only allows exactly what's needed, added HSTS to force HTTPS, frame-blocking to stop iframe embedding, and a manual Permissions-Policy header to switch off camera/mic/geolocation/etc. Gave the Swagger docs page its own slightly relaxed policy since it needs to run its own bundled JavaScript — everything else keeps the strict policy.

**We have:**

**File:** `Backend/src/app.js:69-119`

Two separate Helmet configurations exist in the same file, applied to different route scopes, in a specific order:

**a) Global strict policy** (`app.js:69-100`) — applies to every route *except* `/api-docs`:
```js
contentSecurityPolicy: {
    useDefaults: false,
    directives: {
        defaultSrc: ["'none'"], scriptSrc: ["'none'"], styleSrc: ["'none'"],
        imgSrc: ["'self'"], fontSrc: ["'none'"], connectSrc: ["'none'"],
        objectSrc: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"],
        frameAncestors: ["'none'"],
        ...(isSecureContext ? { upgradeInsecureRequests: [] } : {}),
    },
},
strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: false },
frameguard: { action: "deny" },
referrerPolicy: { policy: "no-referrer" },
```
This is a pure JSON API — it never serves HTML itself — so `default-src: 'none'` is deliberately maximal-lockdown, not the usual `'self'`-based template.

**b) Scoped permissive policy for `/api-docs`** (`app.js:42-64`) — mounted **before** the strict global one, so Swagger UI's own bundled JS/inline styles aren't blanked out, while every other route keeps the strict policy untouched:
```js
app.use("/api-docs", helmet({ contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", "data:"], connectSrc: ["'self'"],
}}}), swaggerUi.serve, swaggerUi.setup(swaggerSpec, ...));
```

**c) Permissions-Policy** (`app.js:103-119`) — set manually (Helmet 8.x dropped this from its core), disables camera/mic/geolocation/payment/USB/sensors, allows fullscreen only for same-origin.

**Notable deliberate exception:** `crossOriginEmbedderPolicy: false` (`app.js:71`) — kept off because it would break loading Stripe's checkout iframe and cross-origin profile-picture/document images; documented inline as a conscious trade-off, not an oversight.

**Why this design, if asked:** "Why not one Helmet config for everything?" → Swagger UI needs to execute its own inline JS to render; the API never does. Rather than weaken the whole API's CSP to accommodate one documentation page, the permissive policy is scoped to exactly that one route.

---

## 2. Authentication & Session Management (JWT)

**In IT terms:** A JWT (JSON Web Token) is a signed, tamper-proof piece of text the server hands you after login, proving who you are without the server having to look you up in a database on every single request. As long as the cryptographic signature checks out, the server trusts what's written inside it.

**Toddler version:** Think of a theme park hand-stamp. When you buy a ticket, they stamp your hand with special ink only the park owns. Every ride you go on, the operator just glances at your stamp instead of phoning the ticket office. If someone tries to draw a fake stamp with a marker pen, it won't match the special ink pattern, and they get turned away at the gate.

**What if this wasn't implemented:** Without a proper signed token system, the server would have to either blindly trust unverified claims ("I promise I'm patient #5!" — trivial to fake) or check a database on every single click, which is slower and still needs its own protection. Without expiry and rotation, a stolen token could be reused forever.

**How it was implemented:** Login issues a short-lived access token plus a longer-lived refresh token, both stored in HttpOnly cookies (JavaScript on the page can never read them, so a script-injection attack can't steal them). Refresh tokens rotate every time they're used and are compared against what's stored on the user's record — reusing an old, already-rotated token is flagged as likely theft. Sessions are also tied to the browser's device fingerprint (User-Agent), so a token stolen and replayed from a different device/browser gets rejected.

**We have:**

**File:** `Backend/src/middlewares/auth.middleware.js`

- Access + refresh token pair, **HttpOnly cookies** (not localStorage — immune to XSS token theft) with a `Bearer` header fallback for API testing (`auth.middleware.js:9-13`).
- `verifyAuth(desiredRole)` tries each candidate token, checks the JWT signature, then re-fetches the user from the DB (not just trusting the token payload) so a since-deleted account is caught immediately: `if (user.isDeleted) throw new apiError(401, ...)` (`auth.middleware.js:54`).
- **Refresh token rotation with reuse detection** (`patient.controller.js:352-404`, mirrored for doctor/admin):
  - The stored `refreshtoken` on the user document is compared against the one presented. A mismatch means the token was already rotated/revoked — logged as `refresh_token_reuse` (`patient.controller.js:373-380`), a strong signal of token theft.
  - **Device binding**: the refresh endpoint also compares `req.headers["user-agent"]` against `patient.lastUserAgent`; a mismatch revokes the session (`patient.controller.js:388-390`).
- **Password history**: `checkPasswordHistory()` blocks reusing a recent password on change/reset (`patient.controller.js:433-434`).
- Changing password revokes all sessions: `patient.refreshtoken = null` (`patient.controller.js:441`).
- `requireRole(...roles)` (`auth.middleware.js:60-66`) — simple RBAC gate used after `verifyAuth` on role-restricted routes.

---

## 3. Multi-Factor Authentication (Email OTP)

**In IT terms:** MFA means proving your identity with more than one type of proof — something you know (your password) plus something you have access to (your email inbox). Even if your password leaks, an attacker still can't get in without also being able to read a code sent to your actual email.

**Toddler version:** It's a treasure chest with two different keyholes. Your password is the first key. The one-time code emailed to you is the second key, and it "melts" after a few minutes so it can't be reused. A thief who steals your first key still can't open the chest without also stealing your mailbox key — and that one keeps changing every time.

**What if this wasn't implemented:** A single leaked or guessed password would be enough to fully log in as any user. Password leaks from *other* websites are extremely common (people reuse passwords), so one unrelated breach elsewhere could silently compromise SmartFit accounts too — MFA is what stops that stolen password alone from being enough.

**How it was implemented:** After a correct password, the server does **not** log the user in yet — it emails a one-time code and responds with `{ mfaRequired: true }`. The user must submit that code to a `/verify-mfa` endpoint within a few minutes, backed by a short-lived signed session cookie, before real access/refresh tokens are ever issued.

**We have:**

**Files:** `Backend/src/controllers/otp.controller.js`, `Backend/src/middlewares/mfa.middleware.js`

- Login is **two-step for all three roles**. Step 1 (correct password) never issues session cookies — it returns `{ mfaRequired: true }` and emails an OTP. Step 2 (`/login/verify-mfa`) validates the OTP against a short-lived `mfaToken` cookie (`mfa.middleware.js:9-40`) before issuing real access/refresh tokens.
- `mfaToken` is itself a signed JWT (5-min expiry pattern reused from the forgot-password flow), so the MFA step can't be replayed indefinitely or skipped by forging a plain flag.
- OTP verification (`otp.controller.js:45-61`) returns typed failure reasons (`expired`, `too_many_attempts`, generic invalid) so the UI can react appropriately without leaking which case narrows down the OTP value itself.
- Forgot-password reuses the same OTP infrastructure (`otp.controller.js:63-149`) — rate-limited via `trackAttempt()` + adaptive CAPTCHA after 3 attempts (`otp.controller.js:69-73`).

---

## 4. CSRF Protection

**In IT terms:** CSRF is when a malicious website tricks your browser into sending a request to a site you're already logged into — like SmartFit — without you meaning to, because browsers automatically attach cookies to any request they send to a matching domain. Protection means requiring extra proof the request truly came from your own site's JavaScript, not a forged form sitting somewhere else on the internet.

**Toddler version:** Imagine your house key floats out of your pocket and unlocks your front door automatically whenever you walk near it — even if a stranger shoved you toward the door on purpose. CSRF protection is like also requiring a secret family handshake before the door will actually open. The floating key (cookie) alone isn't enough anymore — you need the handshake too, and only your own house knows it.

**What if this wasn't implemented:** A malicious webpage could hide an auto-submitting form pointing at SmartFit's "change password" or "delete account" endpoint. Since your browser is already logged in, it would silently attach your session cookie and the action would go through — without you ever clicking anything on the real SmartFit site.

**How it was implemented:** Double-submit cookie pattern. A random `csrfToken` cookie is handed to every visitor. Every request that changes something must also include that exact same value in an `X-CSRF-Token` header. A cross-site attacker's forged form can make the cookie tag along automatically, but same-origin browser rules stop the attacker's own JavaScript from *reading* the cookie's value to also set the matching header — so a forged request's two values never line up.

**We have:**

**File:** `Backend/src/middlewares/csrf.middleware.js`

Double-submit cookie pattern:
1. `ensureCsrfCookie` (`csrf.middleware.js:24-29`) issues a random `csrfToken` cookie (readable, not HttpOnly) to any client that doesn't have one yet — runs on every request, including pre-login, so a token exists before the very first state-changing request.
2. `verifyCsrf` (`csrf.middleware.js:37-55`) runs on every non-safe method (`POST/PUT/PATCH/DELETE`) except an explicit exemption set. It compares the `csrfToken` cookie against the `X-CSRF-Token` header using **`crypto.timingSafeEqual`** (constant-time comparison — prevents timing side-channel attacks on the token check itself) (`csrf.middleware.js:44-48`).
3. **Why this works**: a cross-site attacker's forged form submission can make the browser attach the cookie automatically, but same-origin policy stops attacker JS from *reading* the cookie value to also set the matching header — so the two only match for genuine same-origin requests.
4. **Sole exemption**: `/api/v1/payment/webhook` (`csrf.middleware.js:16-18`) — called server-to-server by Stripe (verified instead by HMAC signature, see §9), never by a browser with our cookies.

---

## 5. Brute-Force Defense (Lockout, Adaptive CAPTCHA, IP Block)

**In IT terms:** Attackers can script thousands of password guesses per second against a login form. Brute-force defense slows this down or shuts it off entirely, at both the level of a single account and the level of the network address (IP) making the requests.

**Toddler version:** Imagine a padlock that jams itself shut for 30 minutes the moment someone tries 5 wrong combinations in a row. And if the same person keeps doing that trick on lots of different padlocks up and down the street, eventually the whole street bans that person from the block for an hour.

**What if this wasn't implemented:** An attacker could script unlimited password guesses against one account, or spray one common password across every account, until something works — turning even a "not great but not terrible" password into a guaranteed eventual breach given enough attempts.

**How it was implemented:** 5 wrong password attempts locks that specific account for 30 minutes. After 3 wrong attempts, a CAPTCHA is also required — proving a human, not a script, is doing the trying. If one IP address triggers 5 separate account lockouts within a day, that IP is banned from the entire API for an hour, before it even reaches routing or login logic.

**We have:**

**Files:** `Backend/src/controllers/patient.controller.js` (mirrored for doctor/admin), `Backend/src/middlewares/captcha.middleware.js`, `Backend/src/utils/rateStore.js`, `Backend/src/middlewares/ipBlock.middleware.js`

- **Per-account lockout**: 5 failed attempts (`MAX_LOGIN_ATTEMPTS = 5`, `patient.controller.js:61`) locks the account for 30 minutes (`LOCKOUT_DURATION_MS`, `patient.controller.js:62`), stored on the user document (`loginAttempts`, `lockedUntil`), checked before password comparison (`patient.controller.js:178-181`).
- **Adaptive CAPTCHA**: hCaptcha is only demanded after 3 failed attempts on an account (`patient.controller.js:183-185`), not on every login — reduces friction for legitimate users while still blocking scripted brute-force. Verified server-side against `https://hcaptcha.com/siteverify` (`captcha.middleware.js:5,21-36`).
- **IP-level escalation**: `trackLockout(ip)` (`rateStore.js:53-63`) counts how many *different account lockouts* one IP has triggered; after 5 lockouts in 24h, `blockIp()` bans that IP for 1 hour (`rateStore.js:65-68`), enforced globally by `ipBlockMiddleware` — the very first middleware in the chain (`app.js:25`, `ipBlock.middleware.js:6-11`) — so a blocked IP is rejected before CORS, body parsing, or any route logic even runs.
- All of the above uses an **in-memory Map-based store** (`rateStore.js:1-10`) with periodic self-cleanup via `setInterval(...).unref()` — acceptable for a coursework/single-instance deployment; would need Redis for horizontal scaling in production.

---

## 6. Rate Limiting

**In IT terms:** Rate limiting caps how many requests any single client can make within a time window, regardless of whether the requests are individually "wrong" — it protects against overload or abuse even from technically-valid requests sent too fast or too often.

**Toddler version:** Like a school cafeteria only letting each kid go through the food line so many times per lunch period. Nobody's doing anything wrong by wanting seconds — but without a limit, one hungry kid going through 50 times means nobody else gets fed.

**What if this wasn't implemented:** A single attacker — or even an accidental bug in someone's own frontend — could hammer the server with requests non-stop, slowing it down or knocking it over entirely for every other user, or running up unnecessary load with no limit in place.

**How it was implemented:** Different ceilings for different levels of sensitivity — a generous limit for normal browsing, tighter limits on login/OTP/MFA endpoints, and the tightest limit of all (5 attempts per 15 minutes) specifically on admin login, since an admin account being compromised is the highest-impact outcome.

**We have:**

**File:** `Backend/src/app.js:201-259` (`express-rate-limit`)

Layered limiters, tightest on the most sensitive endpoints:

| Limiter | Window | Max (prod) | Max (dev) | Applied to |
|---|---|---|---|---|
| Global | 15 min | 300 | 5000 | every request |
| Auth (patient/doctor) | 15 min | 20 | 1000 | `/login` |
| Auth (admin) | 15 min | **5** | 5 | `/admin/login` — tighter, admin compromise is higher-impact |
| OTP | 15 min | 10 | 200 | OTP send endpoints |
| MFA verify | 5 min | 10 | 200 | `/login/verify-mfa` |

`skipSuccessfulRequests: true` on auth/MFA limiters — only failed attempts count, so legitimate users retrying after a typo aren't punished, but crackers stepping through a password list are.

---

## 7. Input Sanitization (NoSQL Injection)

**In IT terms:** NoSQL injection is when an attacker sends specially crafted input — like `{"$ne": null}` — that gets misread as a database *command* instead of plain data, potentially bypassing checks like password matching entirely. Sanitization strips anything that looks like a database operator out of user input before it can ever reach a database query.

**Toddler version:** Imagine a form asks "what's your name?" and instead of writing a name, someone writes a magic spell — and the robot filling in the paperwork accidentally casts the spell instead of just recording it as text. Sanitization is a guard standing at the door who crosses out any "magic words" before they reach the robot, so only harmless plain text ever gets through.

**What if this wasn't implemented:** An attacker could submit something like `{"email": {"$ne": null}, "password": {"$ne": null}}` as their login "credentials." MongoDB could interpret that as "match any account where email is not null" — potentially logging the attacker in as an arbitrary user without knowing any real password at all.

**How it was implemented:** A small recursive function walks through every request's body and query parameters and deletes any object key that starts with `$` (Mongo's operator prefix), running right after the request body is parsed and before it ever reaches a controller or a database call.

**We have:**

**File:** `Backend/src/app.js:182-195`

Custom recursive sanitizer runs on every request body and query string, **after** `express.json()` but **before** CSRF/rate limiting:
```js
const stripMongoOperators = (obj) => {
    if (Array.isArray(obj)) { obj.forEach(stripMongoOperators); return; }
    if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj)) {
            if (key.startsWith("$")) { delete obj[key]; }
            else { stripMongoOperators(obj[key]); }
        }
    }
};
```
Strips any key starting with `$` (e.g. `{"email": {"$ne": null}}` login-bypass attempts) recursively through nested objects/arrays — defends against classic NoSQL operator-injection where Mongoose would otherwise pass a raw object straight into a `find()`/`findOne()` query.

---

## 8. Authorization / IDOR Protection

**In IT terms:** Authentication proves *who* you are; authorization checks whether you're allowed to touch the *specific thing* you're asking for. IDOR (Insecure Direct Object Reference) is the bug where an app checks "are you logged in?" but forgets to also check "does this record actually belong to you?" — letting a valid, logged-in user reach someone else's data just by changing an ID number in the request.

**Toddler version:** It's a hotel that checks you have *a* room key at the front desk, but the security guard upstairs forgets to check the key only opens *your* room number — so anyone holding any valid room key could just try different doors and walk into other people's rooms.

**What if this wasn't implemented:** Patient A could view or edit Patient B's appointments, prescriptions, lab results, or payment records simply by changing an ID in the request URL — despite being a completely legitimate, logged-in user of their own account. For medical data specifically, this is a serious real-world privacy failure.

**How it was implemented:** Every controller that fetches or modifies one specific record (an appointment, prescription, lab test, payment) explicitly compares that record's stored owner ID against the logged-in user's own ID before doing anything with it, and throws a 403 if they don't match — never relying on "well, they're logged in" as sufficient proof of ownership.

**We have:**

Ownership checks are enforced **in the controller**, not just at the route/role level — e.g. `payment.controller.js:26-28`:
```js
if (appointment.patient.toString() !== req.patient._id.toString()) {
    throw new apiError(403, "Access denied");
}
```
Same pattern repeated for prescriptions/labtests/appointments across doctor and patient controllers — a valid JWT for *a* patient is not sufficient; the resource must also belong to *that specific* patient. Also: server never trusts client-supplied `patientId`/price/amount fields (see §9) — always re-derived server-side from the authenticated session or a validated parent resource.

---

## 9. Payment Security (Stripe)

**In IT terms:** Handling money online safely means never trusting the client (the browser) to tell the server the price, and verifying that any "payment succeeded" notification received really came from the payment processor rather than being forged by an attacker.

**Toddler version:** Imagine a vending machine that asks the customer "how much did you pay?" instead of counting its own coins — a kid could just say "I paid £100!" and get a free snack. Real security means the machine counts its *own* coins (computes the price itself) and only trusts a receipt (webhook) that has the payment company's official wax seal stamped on it (a cryptographic signature) — a hand-written fake receipt gets thrown straight in the bin.

**What if this wasn't implemented:** A tampered client request could set an appointment's price to £0.01, or a forged "payment succeeded" webhook could mark an unpaid appointment as fully paid — all without a real card ever being charged.

**How it was implemented:** The charge amount is always calculated server-side from the doctor's consultation fee stored in the database — the browser is never asked for or trusted with a price. Incoming Stripe webhook events are verified via HMAC signature checking against a secret key, and a payment is only marked "completed" after independently re-confirming its status directly with Stripe's own API and cross-checking the session metadata for signs of tampering.

**We have:**

**File:** `Backend/src/controllers/payment.controller.js`

- **Server-computed price** (`payment.controller.js:38-43`): the charge amount is calculated from `doctor.consultationfee` in the DB, never accepted from the client request body — prevents a tampered client from paying £0.01 for a £50 consultation.
- **Webhook signature verification** (`payment.controller.js:128-147`): `stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)` — requires the **raw** unparsed body, which is why the webhook route is registered *before* `express.json()` in `app.js:177` with `express.raw({ type: "application/json" })`. A forged webhook without a valid HMAC signature is rejected and logged as a security event (`payment.controller.js:136-146`).
- **Metadata tamper check** (`payment.controller.js:174-190`): even after signature verification, the webhook re-confirms the session's `patientId`/`appointmentId` metadata matches the stored `Payment` row before marking it paid — a defense-in-depth check against a theoretically-valid-but-mismatched session.
- **Idempotency**: every branch (`completed`, `failed`, `expired`) checks the payment's *current* status before mutating it, so duplicate webhook deliveries (which Stripe explicitly says can happen) are no-ops, not double-processed (`payment.controller.js:161-164, 213, 256-258`).
- **Reconciliation** (`payment.controller.js:234-300`, most recently added): handles `checkout.session.expired` so an abandoned checkout doesn't leave a `Payment` stuck in `pending` forever — transitions `pending → expired` only, explicitly refuses to touch an already-`completed`/`failed` row, and logs an `payment_unexpected_state` audit entry for any state that shouldn't be reachable (e.g. an expired event arriving for an already-completed session) rather than silently ignoring it.
- Full status lifecycle: `pending → completed | failed | expired` (`Backend/src/models/payment.model.js`).

---

## 10. HTTPS / TLS

**In IT terms:** HTTPS encrypts everything sent between the browser and the server, so anyone snooping on the network — public WiFi, a compromised router, an ISP — sees scrambled gibberish instead of readable passwords, session tokens, and medical data.

**Toddler version:** Sending data over plain HTTP is like shouting your secrets across a crowded room — anyone nearby can just listen in. HTTPS is like passing a note sealed in a locked box that only the intended reader has the key for — even if someone grabs the box mid-air, they can't read what's written inside.

**What if this wasn't implemented:** Login passwords, session cookies, and medical or payment details would travel across the network as plain, readable text — trivially interceptable by anyone else on the same WiFi network, a malicious router, or any point along the way.

**How it was implemented:** An optional self-signed HTTPS mode for local development, toggled by an `HTTPS_ENABLED` environment variable, wrapping the exact same Express app in Node's built-in `https` server using a generated certificate/key pair (kept out of git). In real production hosting, HTTPS is provided automatically by the hosting platform.

**We have:**

**File:** `Backend/src/index.js`

- Opt-in via `HTTPS_ENABLED=true` env var — defaults to plain HTTP so nothing breaks for anyone not using it.
- Self-signed cert/key loaded from `Backend/certs/` (path resolved relative to `__dirname`, not process CWD, so it works regardless of where `npm run dev` is invoked from) (`index.js:25-26`).
- When enabled: `https.createServer(credentials, app).listen(...)` wraps the **same** Express app — zero duplicated route/middleware logic between HTTP and HTTPS modes (`index.js:64-66`).
- **Deliberate design choice, not an oversight**: no HTTP→HTTPS redirect and no dual-listener. When `HTTPS_ENABLED=true`, that's the *only* server started — a plain HTTP request to the port fails the TLS handshake outright (browser shows a connection error, not a 301), because there's nothing else listening to redirect from (`index.js:56-63`, documented inline). This was explicitly verified and is intentional for a dev-only feature.
- `Backend/certs/*.pem` is **gitignored** (`.gitignore`) — confirmed via `git ls-files` that the private key was never committed.
- The same `isSecureContext` boolean (`isProduction || HTTPS_ENABLED === "true"`) is reused consistently for cookie `Secure`/`SameSite` flags (`otp.controller.js:16`, `csrf.js`), the CSP `upgradeInsecureRequests` directive (`app.js:86`), and file-URL scheme generation (`localUpload.js`) — one source of truth for "are we in a secure context" across the whole backend.

---

## 11. GDPR — Data Export & Right of Access

**In IT terms:** A legal right (under GDPR and similar privacy laws) letting a user request a complete copy of everything a company holds about them, so they can inspect it, verify it's accurate, or take it elsewhere.

**Toddler version:** Imagine you left toys at a friend's house over the years, and one day you ask "can I have a full list of every toy of mine you're still holding, please?" A good friend hands you a complete, neatly organized list — not a random dusty box, and definitely not "some of them, trust us."

**What if this wasn't implemented:** The system would fail to meet data protection law requirements, and users would have no way to see or double-check exactly what personal and medical data is being stored about them — a genuine trust and legal-liability problem for any system handling health records.

**How it was implemented:** An authenticated, ownership-scoped endpoint gathers everything tied to that one logged-in user — profile, appointments, prescriptions, lab results, payments, and their own audit log — and streams it back as a formatted PDF report, explicitly excluding sensitive internal fields (password hash, session tokens) before the PDF is even generated.

**We have:**

**Files:** `Backend/src/controllers/{patient,doctor,admin}.controller.js` (`exportMyData`), `Backend/src/services/pdfExport.service.js`, routes: `GET /api/v1/{patient,doctor,admin}/export-data`

- Auth-gated (`bearerAuth`), **ownership-scoped** — always exports only `req.patient._id`'s own data, aggregated via `Promise.all` across Appointments, Prescriptions, Labtests, Payments, and the user's own audit log (last 200 entries) (`patient.controller.js:556-567`).
- Rendered as a **streamed PDF** using `pdfkit` (`pdfExport.service.js`) — branded header/logo, key-value and table section renderers, `bufferPages` for page-number footers. Sensitive fields (password, refresh token, password history, login attempts) are explicitly excluded via Mongoose `.select("-password -refreshtoken ...")` before the data ever reaches the PDF layer (`patient.controller.js:557-558`).
- CORS `exposedHeaders: ["Content-Disposition"]` (`app.js:167`) added specifically so the frontend `fetch()` can read the filename off the response and trigger a proper browser download.
- **Honest limitation to state in the viva**: this satisfies **GDPR Article 15 (right of access)** well — a complete, human-readable copy of everything held. It does **not** strictly satisfy **Article 20 (data portability)**, which requires a "structured, commonly used, machine-readable format" (JSON/CSV/XML) so data can be re-imported elsewhere — a PDF is human-readable, not machine-readable in that legal sense. This was a deliberate scope decision (PDF was explicitly requested over JSON) — if asked "is this GDPR-complete," the accurate answer is *"Article 15 yes, Article 20 partially — would need a JSON/CSV export option to fully close that gap."*

---

## 12. Account Deletion (Soft Delete)

**In IT terms:** Letting a user permanently close their account while keeping the underlying business records (like past medical appointments) intact enough that other people's data doesn't break — achieved by disabling and scrubbing the account's personal details rather than physically erasing the database row.

**Toddler version:** Imagine crossing out a name on a filed folder and writing "REDACTED" instead of shredding the whole folder — because other folders (like appointment records) are stapled to it, and shredding it would tear those too. The person's private details are gone for good, but the paperwork trail other people still need stays in one piece.

**What if this wasn't implemented:** Either deletion requests would be impossible to honor properly (a real problem for user rights and GDPR's "right to erasure"), or a careless hard-delete would leave broken, dangling references in other people's appointment and payment history — potentially crashing pages or corrupting other users' records.

**How it was implemented:** Deletion requires re-entering the current password plus a freshly emailed OTP, so a hijacked browser session alone can't wipe the account. On success, the account is flagged `isDeleted`, personal fields are overwritten with non-identifying placeholder values, any uploaded files are deleted from disk, upcoming appointments are cancelled, and every further request using that account's tokens is rejected from that moment on — even a still-valid, not-yet-expired access token immediately stops working.

**We have:**

**Files:** same controllers, `deleteMyAccount`; models: `Backend/src/models/{patient,doctor,admin}.model.js` (`isDeleted`, `deletedAt` fields)

- **Verification required**: current password **and** a freshly-verified OTP, both checked before any mutation (`patient.controller.js:702-719`) — a stolen session cookie alone cannot delete the account.
- **Soft delete, not hard delete** — deliberate architectural decision:
  - **Why**: `Appointment`, `Payment`, and `Labtest` documents hold required `ObjectId` references to the patient/doctor. A hard `deleteOne()` would leave those references dangling (orphaned foreign keys), breaking every other role's view of historical appointments/payments and corrupting audit trails.
  - **How**: sets `isDeleted = true`, `deletedAt = now`, then **scrubs PII in place** — name replaced with a placeholder, email rewritten to a non-deliverable tombstone address (`deleted-<id>@smartfit.invalid`), username/phone/guardian-name/profile-picture cleared (`patient.controller.js:732-740`).
  - The uploaded profile picture **file** is actually deleted from disk (`deleteUploadedFile`, `patient.controller.js:730`) — the file itself carries no referential-integrity constraint, so it doesn't need to be kept.
  - The account is **immediately unusable**: `verifyAuth` rejects any request from a deleted account even with a still-valid, unexpired access token (`auth.middleware.js:54`) — so revoking `refreshtoken` alone wouldn't have been sufficient; the deletion check happens on every authenticated request, not just at login.
  - Future appointments are cancelled (`patient.controller.js:724-727`) rather than left dangling in "Pending"/"Confirmed" for an account that no longer exists in any real sense.
- **Role-specific guards, checked after password/OTP verification** (never before — a business-rule check must never leak account state to an unauthenticated caller):
  - **Doctor**: blocked (409) if they have any upcoming Pending/Confirmed appointments — must be reassigned/cancelled first.
  - **Admin**: blocked (409) if this is the last remaining admin account — prevents the system being left with zero administrators.
- All sessions revoked (`refreshtoken = null`) and cookies cleared on success.

---

## 13. Swagger / OpenAPI Documentation

**In IT terms:** Auto-generated, interactive documentation describing every API endpoint — what to send, what comes back, what each error means — that developers or examiners can read, and even test live from a webpage, instead of guessing by digging through source code.

**Toddler version:** Imagine a restaurant menu that doesn't just list every dish, but lets you actually order and eat it right from the page to see exactly what you get. Swagger is that menu for an API — instead of digging through the kitchen (source code) to figure out what's on offer, you read the menu, and can even "try it" live to see the real result.

**What if this wasn't implemented:** Anyone wanting to use or test the API — teammates, examiners, or even you yourself in six months — would have to read through every single route and controller file by hand to work out what each endpoint expects and returns. Slow, error-prone, and a poor way to demonstrate the API in a viva.

**How it was implemented:** `swagger-jsdoc` scans dedicated documentation-only files (pure comment blocks, zero real executable code) describing every endpoint, merges them into one OpenAPI 3.0 specification, and `swagger-ui-express` serves that spec as an interactive page at `/api-docs` where you can log in, authorize with a token, and fire off real test requests against the live backend.

**We have:**

**Files:** `Backend/src/docs/` (11 files, all new, zero executable logic — pure JSDoc)

- **Stack**: `swagger-jsdoc` (builds the spec from JSDoc comments) + `swagger-ui-express` (serves the interactive UI).
- **Isolation principle** (important to be able to explain): `swaggerDef.js` (static info/servers/tags/components) + nine `*.docs.js` files, one per resource (auth, patient, doctor, admin, department, appointment, prescription, labtest, payment, privacy), each containing only `/** @openapi ... */` comment blocks — **no route file, controller, or model was modified** to add these. `app.js` only gained two mount points (`app.js:40, 42-64`) that import the pre-built `swaggerSpec` object; nothing in the request-handling pipeline imports `Backend/src/docs/` at all, so a mistake in the docs can never affect real API behavior.
- **OpenAPI 3.0.3**, title "SmartFit Hospital Management System API", 11 tags, two security schemes:
  - `bearerAuth` — JWT via `Authorization: Bearer <token>`, usable through the **Authorize** button (persists across reloads: `persistAuthorization: true`, `app.js:59`).
  - `csrfToken` — a header-based scheme documenting the `X-CSRF-Token` requirement (§4) — since Swagger UI has no first-class CSRF concept, the tester manually copies the `csrfToken` cookie value into this field.
- **Coverage**: 101 documented operations across 92 distinct path keys — verified by parsing the live-served `/api-docs.json`, matching a hand-built inventory exactly.
- **A real Express quirk you should be able to explain**: `POST /doctor/prescriptions/:appointmentid` and `GET/PATCH/DELETE /prescriptions/:prescriptionid` share the same route *pattern*, so OpenAPI (which keys paths by URL shape) collapses them into **one path item** with a generically-named `{id}` parameter — documented per-operation which specific ID it actually represents. Same situation for `/doctor/labtests/{id}`.
- **Deliberately excluded from the public spec** (documented in the description, `swaggerDef.js:70-77`): the Stripe webhook receiver, the internal cron trigger, the admin raw-document file server, and the admin security-monitoring dashboard — all internal-only and/or authenticated by a mechanism other than a normal user session.
- **Access**: `GET /api-docs` (UI), `GET /api-docs.json` (raw spec, importable into Postman/Insomnia).
- **Known limitation to be upfront about**: `PaginationMeta` schema exists in components but is intentionally unused — no endpoint implements real server-side pagination yet; every list endpoint returns its full scoped result set.

---

## 14. CI/CD Pipeline (GitHub Actions)

**In IT terms:** CI/CD automatically runs a checklist — installing dependencies, building, linting, testing, scanning for known vulnerabilities — every single time code is pushed, so problems are caught immediately instead of being discovered later, or worse, in production.

**Toddler version:** Imagine a strict robot inspector standing at the factory door, automatically checking every single toy that rolls off the line — does it turn on, are the wheels attached properly, are any parts sharp or dangerous — before it's ever allowed to ship out. It never forgets to check, and it checks every single toy, every single time, without a tired human having to remember.

**What if this wasn't implemented:** Broken code, a failing build, or a newly introduced security vulnerability could get pushed and merged without anyone noticing — until a real user, or an examiner, runs into the bug in person. Catching problems that late is far more expensive and embarrassing than catching them the moment they're pushed.

**How it was implemented:** A GitHub Actions workflow triggers on every push/PR to `main` — installs dependencies, runs a dependency security audit, builds, lints, and tests the backend and all three frontends in parallel, uploads the built frontend files as downloadable artifacts, and runs GitHub's own CodeQL static-analysis security scanner for a deeper check — all with zero manual setup steps on a completely fresh clone.

**We have:**

**File:** `.github/workflows/ci.yml`

Three parallel jobs on every push/PR to `main`:

1. **`backend`** — `npm ci` → `npm audit --audit-level=critical` → `npm run build` (a module-graph verification script, `Backend/scripts/verify-build.mjs`, since a bare Express app has no bundler build step) → `npm test --if-present` (no-op today, doesn't fail CI if no real test suite exists yet, but will pick one up automatically the moment tests are added).
2. **`frontend`** — matrix over all three apps (`[Frontend, Doctor, Admin]`, `fail-fast: false` so one app's failure doesn't hide the others' results): `npm ci` → audit → `eslint` → tests → `vite build` → upload the `dist/` folder as a build artifact (`if-no-files-found: error` — a silently-empty build would otherwise pass).
3. **`codeql`** — GitHub's static analysis security scanner (`javascript-typescript` language pack), runs independently, results surface in the repo's Security tab.

**Design notes worth mentioning:**
- `actions/setup-node@v4` with `cache: npm` + explicit `cache-dependency-path` per app — meaningfully faster reruns without any manual cache-key wrangling.
- `--audit-level=critical` (not `high`/`moderate`) — deliberately tuned so CI doesn't perpetually fail on transitive advisories with no available fix (there's one known critical in `bcrypt`'s `tar` dependency, flagged transparently rather than force-resolved, since fixing it would mean a breaking `bcrypt` major upgrade — a call for the maintainer, not something CI should silently paper over).
- Works on a completely fresh clone — no hardcoded paths, no manual setup steps, no secrets required for the checks that run.

---

## 15. Frontend Performance

**In IT terms:** How much unnecessary work a webpage does before the user can actually see and use it. The two biggest causes here were "blocking" the whole page behind one slow check, and shipping code for pages the user hasn't even visited yet.

**Toddler version:** Imagine a restaurant that makes every customer wait at the door until the *entire* kitchen — starters, mains, desserts, and food nobody at this table even ordered — is fully prepped, before anyone's allowed to sit down. The fix is: let people sit and start their drink right away (show the page immediately), only cook what this table actually ordered (only load the code for the page you're on), and bring dishes out as each one finishes instead of waiting for all of them together (each section loads independently).

**What if this wasn't implemented:** Every user would stare at a blank loading screen for longer than necessary, even when the one piece of data they actually cared about (like "my next appointment") was ready almost instantly — and everyone would download code for pages, like Admin settings, that most users will never even open.

**How it was implemented:** Removed the single app-wide loading gate that blocked the entire route tree; each protected page now runs its own auth check locally instead. Converted every page import to `React.lazy()` so the browser only downloads the code for the page actually being visited, not the whole app upfront. Replaced combined "everything or nothing" dashboard spinners with separate loading flags per section, so each part of a dashboard appears the moment its own data is ready, instead of waiting for the slowest piece.

**We have:**

**Files:** `{Frontend,Doctor,Admin}/src/main.jsx`, `{Frontend,Doctor,Admin}/src/App.jsx`, dashboard pages

Two root causes of render-blocking were found and fixed — not just moved spinners around:

1. **Top-level auth gate removed.** Previously every app blocked its *entire* route tree behind a single `isInitialized` check before rendering anything. Now each route's own `AuthLayout` guard handles this locally (`App.jsx`, comment at the removal site: "Deliberately no app-wide gate on isInitialized: the auth check runs in the background... each protected route's own AuthLayout shows its own localized 'Loading session...' state until isInitialized flips true").
2. **Route-level code splitting.** Every page import converted to `React.lazy()` (e.g. `Frontend/src/main.jsx:14-27`) wrapped in a single `<Suspense fallback={<RouteFallback />}>` around the router `<Outlet/>` (`App.jsx`) — the initial JS bundle only contains the code for the first route actually visited, not all pages in the app.
3. **Localized loading states replacing combined dashboard spinners** — e.g. `PatientDashboard.jsx` previously blocked the whole page on one `isLoading`; now `showAppointmentSkeleton` / `showLabSkeleton` let each panel render independently as its own data arrives. Same pattern in `DoctorDashboard.jsx` (`isScheduleLoading` replacing a combined flag).

**Net effect**: perceived load time driven by architecture (what has to finish before *anything* paints), not by relocating where a spinner is drawn.

---

## 16. Likely Viva Questions & Model Answers

**Q: Why double-submit cookie CSRF instead of a synchronizer token stored server-side?**
A: Stateless — no server-side session store needed, fits a JWT-based architecture where the server doesn't otherwise track sessions. Security relies on same-origin policy preventing a cross-site attacker from reading the cookie to also set the matching header.

**Q: Why soft delete instead of hard delete?**
A: Referential integrity — Appointment/Payment/Labtest hold required ObjectId references to the user. Hard delete would orphan them. Soft delete + PII scrub balances "the account is functionally gone" against "history/audit trail stays intact."

**Q: Is the data export GDPR-compliant?**
A: Article 15 (right of access) — yes. Article 20 (portability, machine-readable format) — not fully, since it's PDF-only; a JSON/CSV export would be needed to close that gap completely. Be upfront about this if asked — it was a deliberate scope choice.

**Q: Why is Swagger a separate `docs/` folder instead of comments in the route files?**
A: Isolation — keeps 100% of the documentation change surface out of any file that affects real request handling. A typo in the docs can never break or alter API behavior, and it was explicit in the requirements not to touch business logic.

**Q: Why does `/api-docs` get a different CSP than the rest of the API?**
A: The API itself never serves HTML/JS, so its CSP is maximally locked down (`default-src: 'none'`). Swagger UI is the one page in this backend that *does* need to run its own JS — rather than weaken the whole API's policy, only that one route gets a permissive, scoped override.

**Q: What happens if HTTPS is enabled and someone hits plain HTTP?**
A: No redirect exists — the TLS handshake simply fails and the connection is dropped (browser shows a connection error). This is intentional for a dev-only self-signed-cert feature: when `HTTPS_ENABLED=true` there is only one listener running, so there's nothing to redirect *from*.

**Q: How do you prevent a forged Stripe webhook?**
A: HMAC signature verification via `stripe.webhooks.constructEvent()` against `STRIPE_WEBHOOK_SECRET`, which requires the raw unparsed request body — that's why the webhook route is registered before the global `express.json()` middleware with its own `express.raw()` parser.

**Q: What's the known/unfixed weakness you'd disclose if asked directly?**
A: The `tar` transitive dependency (via `bcrypt`) has a known critical CVE with no available non-breaking fix — flagged in CI (`npm audit --audit-level=critical`) rather than silently ignored or force-resolved into a breaking `bcrypt` upgrade. Also: the rate-limit/lockout store is in-memory (`Map`-based), fine for a single coursework instance, but wouldn't survive a server restart or scale across multiple instances — Redis would be the production fix.
