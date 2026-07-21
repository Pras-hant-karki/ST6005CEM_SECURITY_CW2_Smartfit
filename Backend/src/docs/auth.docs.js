/**
 * Authentication — Patient, Doctor, and Admin.
 * Pure documentation module: JSDoc @openapi blocks only, scanned by
 * swagger-jsdoc (see swagger.js). Not imported by any route/controller.
 */

// =====================================================================
// PATIENT
// =====================================================================

/**
 * @openapi
 * /patient/register:
 *   post:
 *     summary: Register a new patient account
 *     description: Creates a patient account. Rate-limited (5 per 10 min per IP); an hCaptcha response is required once that threshold is hit.
 *     tags: [Authentication, Patient]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/RegisterPatientRequest'
 *     responses:
 *       201:
 *         description: Patient registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/PatientProfile' }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/login:
 *   post:
 *     summary: Log in as a patient (step 1 of 2 — password)
 *     description: Verifies credentials and, on success, emails an OTP rather than issuing session tokens directly. Adaptive CAPTCHA is required after 3 failed attempts on the account; the account locks for 30 minutes after 5.
 *     tags: [Authentication, Patient]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginPatientRequest' }
 *     responses:
 *       200:
 *         description: Either MFA/CAPTCHA is required, or the password has expired.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/MfaRequiredResponse'
 *                 - $ref: '#/components/schemas/CaptchaRequiredResponse'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: Password has expired (90-day policy) — a tempToken cookie is issued for the reset flow.
 *       423:
 *         description: Account temporarily locked after repeated failed attempts.
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/login/verify-mfa:
 *   post:
 *     summary: Log in as a patient (step 2 of 2 — OTP)
 *     description: Verifies the emailed OTP against the short-lived mfaToken cookie issued by /login, and issues the real session (access + refresh token cookies).
 *     tags: [Authentication, Patient]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MfaVerifyRequest' }
 *     responses:
 *       200:
 *         description: Login successful — session cookies set.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginSuccessResponse' }
 *       401:
 *         description: Invalid or expired OTP, or missing/expired MFA session.
 *       429:
 *         description: Too many incorrect OTP attempts — the MFA session is invalidated and login must restart.
 */

/**
 * @openapi
 * /patient/renew-access-token:
 *   post:
 *     summary: Renew the access token using the refresh token cookie
 *     description: Rotates both tokens. Rejects (and clears the CSRF cookie) if the refresh token is invalid/expired, has already been rotated out (reuse detection), or was issued to a different device (User-Agent binding).
 *     tags: [Authentication, Patient]
 *     responses:
 *       200:
 *         description: New access/refresh token pair issued.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TokenRenewalResponse' }
 *       401:
 *         description: Missing, invalid, reused, or device-mismatched refresh token.
 */

/**
 * @openapi
 * /patient/logout:
 *   post:
 *     summary: Log out
 *     description: Clears session and CSRF cookies and revokes the stored refresh token server-side.
 *     tags: [Authentication, Patient]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     responses:
 *       200: { description: Logged out. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 */

/**
 * @openapi
 * /patient/update-password/send-otp:
 *   post:
 *     summary: Request an OTP to change password while logged in
 *     tags: [Authentication, Patient]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     responses:
 *       200: { description: OTP emailed., content: { application/json: { schema: { $ref: '#/components/schemas/OtpSendResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/update-password/verify-otp:
 *   post:
 *     summary: Verify the change-password OTP
 *     tags: [Authentication, Patient]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/MfaVerifyRequest' } } }
 *     responses:
 *       200: { description: OTP verified. }
 *       401: { description: Invalid/expired OTP. }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/update-password:
 *   patch:
 *     summary: Change password (requires prior OTP verification)
 *     description: Rejects reuse of the current password or any of the last 5 passwords. Revokes all sessions on success (refresh token cleared) — the caller must log in again.
 *     tags: [Authentication, Patient]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } }
 *     responses:
 *       200: { description: Password updated; session cleared. }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { description: Old password incorrect, or not authenticated. }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 */

/**
 * @openapi
 * /patient/forgot-password/send-otp:
 *   post:
 *     summary: Request a password-reset OTP (public)
 *     description: Always returns 200 with a generic message regardless of whether the account exists, to avoid leaking account existence. Rate-limited with adaptive CAPTCHA.
 *     tags: [Authentication, Patient]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } }
 *     responses:
 *       200:
 *         description: If a matching account exists, an OTP was emailed and a tempToken cookie issued.
 *         content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { $ref: '#/components/schemas/CaptchaRequiredResponse' }] } } }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/forgot-password/verify-otp:
 *   post:
 *     summary: Verify the password-reset OTP
 *     description: Requires the tempToken cookie issued by send-otp.
 *     tags: [Authentication, Patient]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/MfaVerifyRequest' } } }
 *     responses:
 *       200: { description: OTP verified; tempToken cookie refreshed for the final reset step. }
 *       401: { description: Invalid/expired OTP or missing tempToken session. }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/forgot-password/update-password:
 *   patch:
 *     summary: Complete password reset
 *     description: Requires the tempToken cookie from the verified reset flow. Clears tempToken and any existing session on success.
 *     tags: [Authentication, Patient]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } }
 *     responses:
 *       200: { description: Password reset successfully. }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { description: Missing/invalid tempToken session. }
 */

// =====================================================================
// DOCTOR (identical flow to Patient; distinct cookies/paths)
// =====================================================================

/**
 * @openapi
 * /doctor/register:
 *   post:
 *     summary: Register a new doctor account
 *     description: Newly registered doctors have isApproved=false until an admin approves them; this does not block login, but excludes them from public doctor listings until approved.
 *     tags: [Authentication, Doctor]
 *     requestBody:
 *       required: true
 *       content: { multipart/form-data: { schema: { $ref: '#/components/schemas/RegisterDoctorRequest' } } }
 *     responses:
 *       201:
 *         description: Doctor registered successfully.
 *         content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/DoctorProfile' } } }] } } }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */

/**
 * @openapi
 * /doctor/login:
 *   post:
 *     summary: Log in as a doctor (step 1 of 2 — password)
 *     tags: [Authentication, Doctor]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/LoginDoctorRequest' } } }
 *     responses:
 *       200: { description: MFA/CAPTCHA required, or password expired., content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/MfaRequiredResponse' }, { $ref: '#/components/schemas/CaptchaRequiredResponse' }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       423: { description: Account temporarily locked. }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /doctor/login/verify-mfa:
 *   post:
 *     summary: Log in as a doctor (step 2 of 2 — OTP)
 *     tags: [Authentication, Doctor]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/MfaVerifyRequest' } } }
 *     responses:
 *       200: { description: Login successful — session cookies set., content: { application/json: { schema: { $ref: '#/components/schemas/LoginSuccessResponse' } } } }
 *       401: { description: Invalid/expired OTP or MFA session. }
 *       429: { description: Too many incorrect attempts — must restart login. }
 */

/**
 * @openapi
 * /doctor/renew-access-token:
 *   post:
 *     summary: Renew the access token using the refresh token cookie
 *     tags: [Authentication, Doctor]
 *     responses:
 *       200: { description: New token pair issued., content: { application/json: { schema: { $ref: '#/components/schemas/TokenRenewalResponse' } } } }
 *       401: { description: Missing, invalid, reused, or device-mismatched refresh token. }
 */

/**
 * @openapi
 * /doctor/logout:
 *   post:
 *     summary: Log out
 *     tags: [Authentication, Doctor]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     responses:
 *       200: { description: Logged out. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 */

/**
 * @openapi
 * /doctor/update-password/send-otp:
 *   post:
 *     summary: Request an OTP to change password while logged in
 *     tags: [Authentication, Doctor]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     responses:
 *       200: { content: { application/json: { schema: { $ref: '#/components/schemas/OtpSendResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /doctor/update-password/verify-otp:
 *   post:
 *     summary: Verify the change-password OTP
 *     tags: [Authentication, Doctor]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/MfaVerifyRequest' } } }
 *     responses:
 *       200: { description: OTP verified. }
 *       401: { description: Invalid/expired OTP. }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /doctor/update-password:
 *   patch:
 *     summary: Change password (requires prior OTP verification)
 *     tags: [Authentication, Doctor]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } }
 *     responses:
 *       200: { description: Password updated; session cleared. }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { description: Old password incorrect. }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 */

/**
 * @openapi
 * /doctor/forgot-password/send-otp:
 *   post:
 *     summary: Request a password-reset OTP (public)
 *     tags: [Authentication, Doctor]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } }
 *     responses:
 *       200: { description: Generic confirmation regardless of account existence. }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /doctor/forgot-password/verify-otp:
 *   post:
 *     summary: Verify the password-reset OTP
 *     tags: [Authentication, Doctor]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/MfaVerifyRequest' } } }
 *     responses:
 *       200: { description: OTP verified. }
 *       401: { description: Invalid/expired OTP or missing tempToken session. }
 */

/**
 * @openapi
 * /doctor/forgot-password/update-password:
 *   patch:
 *     summary: Complete password reset
 *     tags: [Authentication, Doctor]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } }
 *     responses:
 *       200: { description: Password reset successfully. }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { description: Missing/invalid tempToken session. }
 */

// =====================================================================
// ADMIN
// =====================================================================

/**
 * @openapi
 * /admin/register:
 *   post:
 *     summary: Register a new admin account (admin-only)
 *     description: Requires an already-authenticated admin — there is no public admin self-registration.
 *     tags: [Authentication, Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { multipart/form-data: { schema: { $ref: '#/components/schemas/RegisterAdminRequest' } } }
 *     responses:
 *       201: { description: Admin registered successfully., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/AdminProfile' } } }] } } } }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */

/**
 * @openapi
 * /admin/login:
 *   post:
 *     summary: Log in as an admin (step 1 of 2 — password)
 *     description: A tighter rate limit applies (5 attempts / 15 min) than patient/doctor login. One dev-only named admin account bypasses MFA — see the Authentication section overview.
 *     tags: [Authentication, Admin]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/LoginAdminRequest' } } }
 *     responses:
 *       200: { description: MFA/CAPTCHA required, password expired, or (named dev account only) session issued directly., content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/MfaRequiredResponse' }, { $ref: '#/components/schemas/CaptchaRequiredResponse' }, { $ref: '#/components/schemas/LoginSuccessResponse' }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Admin not found. }
 *       423: { description: Account temporarily locked. }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /admin/login/verify-mfa:
 *   post:
 *     summary: Log in as an admin (step 2 of 2 — OTP)
 *     tags: [Authentication, Admin]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/MfaVerifyRequest' } } }
 *     responses:
 *       200: { description: Login successful — session cookies set., content: { application/json: { schema: { $ref: '#/components/schemas/LoginSuccessResponse' } } } }
 *       401: { description: Invalid/expired OTP or MFA session. }
 *       429: { description: Too many incorrect attempts — must restart login. }
 */

/**
 * @openapi
 * /admin/renew-access-token:
 *   post:
 *     summary: Renew the access token using the refresh token cookie
 *     tags: [Authentication, Admin]
 *     responses:
 *       200: { description: New token pair issued., content: { application/json: { schema: { $ref: '#/components/schemas/TokenRenewalResponse' } } } }
 *       401: { description: Missing, invalid, reused, or device-mismatched refresh token. }
 */

/**
 * @openapi
 * /admin/logout:
 *   post:
 *     summary: Log out
 *     tags: [Authentication, Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     responses:
 *       200: { description: Logged out. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 */

/**
 * @openapi
 * /admin/update-password:
 *   patch:
 *     summary: Change password
 *     description: Unlike Patient/Doctor, Admin password change does not require a separate OTP step — old password verification only. Revokes the session on success.
 *     tags: [Authentication, Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } }
 *     responses:
 *       200: { description: Password updated; session cleared. }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { description: Old password incorrect. }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 */

/**
 * @openapi
 * /admin/forgot-password/send-otp:
 *   post:
 *     summary: Request a password-reset OTP (public)
 *     tags: [Authentication, Admin]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } }
 *     responses:
 *       200: { description: Generic confirmation regardless of account existence. }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /admin/forgot-password/verify-otp:
 *   post:
 *     summary: Verify the password-reset OTP
 *     tags: [Authentication, Admin]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/MfaVerifyRequest' } } }
 *     responses:
 *       200: { description: OTP verified. }
 *       401: { description: Invalid/expired OTP or missing tempToken session. }
 */

/**
 * @openapi
 * /admin/forgot-password/update-password:
 *   patch:
 *     summary: Complete password reset
 *     tags: [Authentication, Admin]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } }
 *     responses:
 *       200: { description: Password reset successfully. }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { description: Missing/invalid tempToken session. }
 */
