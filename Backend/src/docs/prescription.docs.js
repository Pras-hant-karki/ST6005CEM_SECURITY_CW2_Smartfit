/**
 * Prescription — issued by doctors for a completed appointment, viewed by
 * the treating doctor, the owning patient, or an admin.
 * Pure documentation module (see swagger.js).
 */

// ---------------------------------------------------------------------
// Patient (read-only)
// ---------------------------------------------------------------------

/**
 * @openapi
 * /patient/prescriptions:
 *   get:
 *     summary: List the authenticated patient's prescriptions
 *     tags: [Prescription]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All prescriptions for this patient, newest first.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/Prescription' } } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /patient/prescriptions/appointment/{appointmentid}:
 *   get:
 *     summary: Get the prescription for a specific appointment (patient)
 *     tags: [Prescription]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: appointmentid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Prescription found., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Prescription' } } }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: No prescription exists yet for this appointment. }
 */

/**
 * @openapi
 * /patient/prescriptions/{prescriptionid}:
 *   get:
 *     summary: Get a single prescription (patient)
 *     tags: [Prescription]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: prescriptionid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Prescription details., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Prescription' } } }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

// ---------------------------------------------------------------------
// Doctor (read/write)
// ---------------------------------------------------------------------

/**
 * @openapi
 * /doctor/prescriptions:
 *   get:
 *     summary: List the authenticated doctor's issued prescriptions
 *     tags: [Prescription]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All prescriptions issued by this doctor, newest first.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/Prescription' } } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /doctor/prescriptions/appointment/{appointmentid}:
 *   get:
 *     summary: Get the prescription for a specific appointment (doctor)
 *     tags: [Prescription]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: appointmentid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Prescription found. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: No prescription exists yet for this appointment. }
 */

/**
 * @openapi
 * /doctor/prescriptions/{id}:
 *   post:
 *     summary: Create a prescription for a completed appointment
 *     description: '`{id}` is the **appointmentid** for this operation. The appointment must belong to the requesting doctor and have status Completed; only one prescription is allowed per appointment.'
 *     tags: [Prescription]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: appointmentid
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/CreatePrescriptionRequest' } } }
 *     responses:
 *       201: { description: Prescription created., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Prescription' } } }] } } } }
 *       400: { description: Missing diagnosis/medicines, or the appointment isn't Completed yet. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not this doctor's appointment, or CSRF token missing/invalid. }
 *       404: { description: Appointment not found. }
 *       409: { description: A prescription already exists for this appointment. }
 *   get:
 *     summary: Get a single prescription (doctor)
 *     description: '`{id}` is the **prescriptionid** for this operation.'
 *     tags: [Prescription]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: prescriptionid
 *     responses:
 *       200: { description: Prescription details., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Prescription' } } }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     summary: Update a prescription
 *     description: '`{id}` is the **prescriptionid**. Only the issuing doctor may update it.'
 *     tags: [Prescription]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: prescriptionid
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/UpdatePrescriptionRequest' } } }
 *     responses:
 *       200: { description: Prescription updated., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Prescription' } } }] } } } }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not the issuing doctor, or CSRF token missing/invalid. }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     summary: Delete a prescription
 *     description: '`{id}` is the **prescriptionid**. Only the issuing doctor may delete it.'
 *     tags: [Prescription]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: prescriptionid
 *     responses:
 *       200: { description: Prescription deleted. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not the issuing doctor, or CSRF token missing/invalid. }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
