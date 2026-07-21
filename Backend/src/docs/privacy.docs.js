/**
 * Privacy — GDPR-style data export (PDF) and account deletion, for all
 * three roles. Deletion is a soft delete: the account is disabled and PII
 * scrubbed, but the document is kept so Appointment/Payment/Labtest
 * references never dangle — see the isDeleted field on each user model.
 * Pure documentation module (see swagger.js).
 */

// ---------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------

/**
 * @openapi
 * /patient/export-data:
 *   get:
 *     summary: Export all of the authenticated patient's data as a PDF
 *     description: Includes account info, profile picture, appointments, medical history notes, prescriptions, lab reports, payments, and the patient's own audit log — as one downloadable PDF report.
 *     tags: [Privacy]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: PDF file stream.
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/delete-account/send-otp:
 *   post:
 *     summary: Request an OTP to authorize account deletion
 *     tags: [Privacy]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     responses:
 *       200: { description: OTP emailed., content: { application/json: { schema: { $ref: '#/components/schemas/OtpSendResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/delete-account:
 *   delete:
 *     summary: Permanently delete (soft-delete) the authenticated patient's account
 *     description: Requires current password + a freshly verified OTP. Cancels the patient's own future Pending/Confirmed appointments, deletes the profile picture file, scrubs PII, revokes all sessions, and clears cookies.
 *     tags: [Privacy]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DeleteAccountRequest' }
 *     responses:
 *       200: { description: Account deleted. }
 *       400: { description: Missing password or OTP. }
 *       401: { description: Incorrect password, or invalid/expired OTP. }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { description: Too many incorrect OTP attempts. }
 */

// ---------------------------------------------------------------------
// Doctor
// ---------------------------------------------------------------------

/**
 * @openapi
 * /doctor/export-data:
 *   get:
 *     summary: Export all of the authenticated doctor's data as a PDF
 *     description: Includes account info, profile picture, uploaded document status, appointments held, prescriptions issued, lab tests ordered/verified, payments received, and the doctor's own audit log.
 *     tags: [Privacy]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: PDF file stream.
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /doctor/delete-account/send-otp:
 *   post:
 *     summary: Request an OTP to authorize account deletion
 *     tags: [Privacy]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     responses:
 *       200: { description: OTP emailed., content: { application/json: { schema: { $ref: '#/components/schemas/OtpSendResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /doctor/delete-account:
 *   delete:
 *     summary: Permanently delete (soft-delete) the authenticated doctor's account
 *     description: Requires current password + a freshly verified OTP. Blocked with 409 if the doctor has any upcoming Pending/Confirmed appointments — those must be reassigned or cancelled first. Deletes uploaded documents/profile picture, scrubs PII, revokes all sessions.
 *     tags: [Privacy]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DeleteAccountRequest' }
 *     responses:
 *       200: { description: Account deleted. }
 *       400: { description: Missing password or OTP. }
 *       401: { description: Incorrect password, or invalid/expired OTP. }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       409: { description: Doctor has upcoming appointments that must be resolved first. }
 *       429: { description: Too many incorrect OTP attempts. }
 */

// ---------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------

/**
 * @openapi
 * /admin/export-data:
 *   get:
 *     summary: Export the authenticated admin's own data as a PDF
 *     description: Scoped to the admin's own account only — account info, uploaded document status, and their own audit log. Never includes hospital-wide data.
 *     tags: [Privacy]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: PDF file stream.
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /admin/delete-account/send-otp:
 *   post:
 *     summary: Request an OTP to authorize account deletion
 *     tags: [Privacy]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     responses:
 *       200: { description: OTP emailed., content: { application/json: { schema: { $ref: '#/components/schemas/OtpSendResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /admin/delete-account:
 *   delete:
 *     summary: Permanently delete (soft-delete) the authenticated admin's account
 *     description: Requires current password + a freshly verified OTP. Blocked with 409 if this is the last remaining admin account — create another admin first.
 *     tags: [Privacy]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DeleteAccountRequest' }
 *     responses:
 *       200: { description: Account deleted. }
 *       400: { description: Missing password or OTP. }
 *       401: { description: Incorrect password, or invalid/expired OTP. }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       409: { description: This is the last remaining admin account. }
 *       429: { description: Too many incorrect OTP attempts. }
 */
