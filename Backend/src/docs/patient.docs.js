/**
 * Patient — self-service profile management.
 * Pure documentation module (see swagger.js).
 */

/**
 * @openapi
 * /patient/update-profile:
 *   patch:
 *     summary: Update the authenticated patient's profile
 *     description: Only the fields provided are updated (partial update). At least one field is required.
 *     tags: [Patient]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdatePatientProfileRequest' }
 *     responses:
 *       200:
 *         description: Profile updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardSuccessResponse'
 *                 - type: object
 *                   properties: { data: { $ref: '#/components/schemas/PatientProfile' } }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/update-profilepicture:
 *   patch:
 *     summary: Update the authenticated patient's profile picture
 *     tags: [Patient]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [profilepicture]
 *             properties:
 *               profilepicture: { type: string, format: binary, description: "JPEG/PNG/WebP, max 5MB." }
 *     responses:
 *       200:
 *         description: Profile picture updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/PatientProfile' } } }]
 *       400: { description: Missing file, or a file that fails MIME/extension/size validation. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/get-profile:
 *   get:
 *     summary: Get the authenticated patient's full profile
 *     tags: [Patient]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile fetched.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/PatientProfile' } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /patient/get-patient:
 *   get:
 *     summary: Get the currently authenticated patient (session check)
 *     description: Used by the frontend on load to determine whether a session is still valid, and to populate global auth state.
 *     tags: [Patient]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current patient returned.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/PatientProfile' } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
