/**
 * Lab Test — ordered by a doctor against a prescription, results entered
 * and verified by a doctor, viewed by the owning patient.
 * Pure documentation module (see swagger.js).
 */

// ---------------------------------------------------------------------
// Patient (read-only)
// ---------------------------------------------------------------------

/**
 * @openapi
 * /patient/labtests:
 *   get:
 *     summary: List the authenticated patient's lab tests
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All lab tests for this patient, newest first.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/LabTest' } } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /patient/labtests/prescription/{prescriptionid}:
 *   get:
 *     summary: Get the lab test for a specific prescription (patient)
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: prescriptionid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lab test found. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: No lab test exists for this prescription. }
 */

/**
 * @openapi
 * /patient/labtests/{labtestid}:
 *   get:
 *     summary: Get a single lab test (patient)
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: labtestid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lab test details., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/LabTest' } } }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

// ---------------------------------------------------------------------
// Doctor (read/write/verify)
// ---------------------------------------------------------------------

/**
 * @openapi
 * /doctor/labtests:
 *   get:
 *     summary: List the authenticated doctor's ordered lab tests
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All lab tests ordered by this doctor, newest first.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/LabTest' } } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     summary: Order a lab test against a prescription
 *     description: patient_id is derived server-side from the prescription and can't be supplied by the client. The requesting doctor must own the prescription; only one lab test is allowed per prescription.
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/CreateLabTestRequest' } } }
 *     responses:
 *       201: { description: Lab test created., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/LabTest' } } }] } } } }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not this doctor's prescription, or CSRF token missing/invalid. }
 *       404: { description: Prescription not found. }
 *       409: { description: A lab test already exists for this prescription. }
 */

/**
 * @openapi
 * /doctor/labtests/prescription/{prescriptionid}:
 *   get:
 *     summary: Get the lab test for a specific prescription (doctor)
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: prescriptionid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lab test found. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: No lab test exists for this prescription. }
 */

/**
 * @openapi
 * /doctor/labtests/{labtestid}/test-results:
 *   patch:
 *     summary: Update the results of one test within a lab test
 *     description: Automatically flips overall_status to "completed" (and sets report_date) once every test entry in the array reaches status "completed".
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: labtestid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/UpdateTestResultsRequest' } } }
 *     responses:
 *       200: { description: Test results updated., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/LabTest' } } }] } } } }
 *       400: { description: Invalid test_index. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not this doctor's lab test, or CSRF token missing/invalid. }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @openapi
 * /doctor/labtests/{labtestid}/verify:
 *   post:
 *     summary: Verify a completed lab test
 *     description: Only the ordering doctor may verify, and only once overall_status is "completed".
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: labtestid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lab test verified., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/LabTest' } } }] } } } }
 *       400: { description: Lab test is not yet completed. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not this doctor's lab test, or CSRF token missing/invalid. }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @openapi
 * /doctor/labtests/{labtestid}:
 *   get:
 *     summary: Get a single lab test (doctor)
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: labtestid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lab test details. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     summary: Update a lab test
 *     description: Only the ordering doctor may update it.
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: labtestid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/UpdateLabTestRequest' } } }
 *     responses:
 *       200: { description: Lab test updated. }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not this doctor's lab test, or CSRF token missing/invalid. }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     summary: Delete a lab test
 *     description: Only the ordering doctor may delete it. The reference is also removed from the parent prescription.
 *     tags: [Lab Test]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: labtestid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lab test deleted. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not this doctor's lab test, or CSRF token missing/invalid. }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
