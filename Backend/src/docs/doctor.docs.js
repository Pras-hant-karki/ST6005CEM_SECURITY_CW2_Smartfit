/**
 * Doctor — self-service profile/document management, public doctor
 * directory (mounted under the Patient portal), and admin-managed doctor
 * account CRUD (mounted under the Admin portal). Grouped here by resource
 * rather than by which router file registers them.
 * Pure documentation module (see swagger.js).
 */

// ---------------------------------------------------------------------
// Doctor self-service
// ---------------------------------------------------------------------

/**
 * @openapi
 * /doctor/update-profile:
 *   patch:
 *     summary: Update the authenticated doctor's profile
 *     description: doctorname, email, and consultationfee are admin-managed and cannot be changed here. All other listed fields are required together (full replacement of the editable fields, not a partial patch).
 *     tags: [Doctor]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/UpdateDoctorProfileRequest' } } }
 *     responses:
 *       200: { description: Profile updated., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/DoctorProfile' } } }] } } } }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /doctor/update-profilepicture:
 *   patch:
 *     summary: Update the authenticated doctor's profile picture
 *     tags: [Doctor]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [profilepicture], properties: { profilepicture: { type: string, format: binary } } }
 *     responses:
 *       200: { description: Profile picture updated. }
 *       400: { description: Missing or invalid file. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /doctor/profile:
 *   get:
 *     summary: Get the authenticated doctor's full (private) profile
 *     tags: [Doctor]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profile fetched., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/DoctorProfile' } } }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /doctor/get-doctor:
 *   get:
 *     summary: Get the currently authenticated doctor (session check)
 *     tags: [Doctor]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current doctor returned. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /doctor/update-document:
 *   patch:
 *     summary: Update the authenticated doctor's verification documents
 *     description: At least one of the three files is required.
 *     tags: [Doctor]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { multipart/form-data: { schema: { $ref: '#/components/schemas/UpdateDoctorDocumentsRequest' } } }
 *     responses:
 *       200: { description: Document(s) updated. }
 *       400: { description: No file provided, or a file failed validation. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

// ---------------------------------------------------------------------
// Public doctor directory (patient portal)
// ---------------------------------------------------------------------

/**
 * @openapi
 * /patient/doctors:
 *   get:
 *     summary: Browse doctors (public)
 *     tags: [Doctor]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive partial match on doctor name.
 *     responses:
 *       200:
 *         description: List of doctors (summary fields only).
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/DoctorProfile' } } } }]
 */

/**
 * @openapi
 * /patient/doctors/{doctorid}:
 *   get:
 *     summary: Get a single doctor's public profile
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: doctorid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctor profile (sensitive document fields stripped)., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/DoctorProfile' } } }] } } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @openapi
 * /patient/departments/{deptname}/doctors:
 *   get:
 *     summary: List doctors in a department (public)
 *     tags: [Doctor, Department]
 *     parameters:
 *       - in: path
 *         name: deptname
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctors in this department., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/DoctorProfile' } } } }] } } } }
 *       404: { description: No doctors found for the given department. }
 */

// ---------------------------------------------------------------------
// Admin-managed doctor account CRUD
// ---------------------------------------------------------------------

/**
 * @openapi
 * /admin/doctors:
 *   get:
 *     summary: List all doctors (admin)
 *     description: Unlike the public directory, returns every doctor regardless of approval status.
 *     tags: [Doctor, Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All doctors., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/DoctorProfile' } } } }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     summary: Create a doctor account (admin)
 *     tags: [Doctor, Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { multipart/form-data: { schema: { $ref: '#/components/schemas/RegisterDoctorRequest' } } }
 *     responses:
 *       201: { description: Doctor created. }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */

/**
 * @openapi
 * /admin/doctors/{doctorid}:
 *   get:
 *     summary: Get a doctor's full profile (admin)
 *     tags: [Doctor, Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: doctorid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctor profile., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/DoctorProfile' } } }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     summary: Update a doctor's account (admin)
 *     description: Unlike the doctor's own update-profile, this can also change doctorname, email, and consultationfee.
 *     tags: [Doctor, Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: doctorid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content: { multipart/form-data: { schema: { $ref: '#/components/schemas/RegisterDoctorRequest' } } }
 *     responses:
 *       200: { description: Doctor updated. }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     summary: Delete a doctor's account (admin)
 *     tags: [Doctor, Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: doctorid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctor deleted. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @openapi
 * /admin/departments/{deptname}/doctors:
 *   get:
 *     summary: List doctors in a department (admin)
 *     tags: [Doctor, Admin, Department]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: deptname
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctors in this department. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
