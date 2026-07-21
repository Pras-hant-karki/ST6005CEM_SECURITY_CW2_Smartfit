/**
 * Appointment — booking, availability, rescheduling, cancellation, and
 * doctor-side verification. Grouped by resource; each role's mount prefix
 * keeps the full paths distinct even where the operation name repeats
 * (e.g. doctor vs admin "today's appointments").
 * Pure documentation module (see swagger.js).
 */

// ---------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------

/**
 * @openapi
 * /patient/appointments/availability:
 *   get:
 *     summary: Check a doctor's availability for a given month
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: doctorid
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: month
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: integer, example: 2026 }
 *     responses:
 *       200:
 *         description: One entry per day of the month, with open slots after subtracting already-booked ones.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/AvailabilityDay' } } } }]
 *       400: { description: Missing/invalid doctorid, month, or year. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @openapi
 * /patient/appointments:
 *   get:
 *     summary: List the authenticated patient's appointments
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All appointments for this patient, newest first.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/Appointment' } } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /patient/appointments/book-appointment/{doctorid}:
 *   post:
 *     summary: Book an appointment with a doctor
 *     description: The requested date/time must fall within one of the doctor's configured shift slots for that day and not already be booked (unique per doctor+date+time).
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: doctorid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/CreateAppointmentRequest' } } }
 *     responses:
 *       201:
 *         description: Appointment created (status Confirmed) and a confirmation email sent.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Appointment' } } }]
 *       400: { description: Missing/invalid date, a past date, or a time outside the doctor's availability. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       404: { description: Doctor not found. }
 *       409: { description: That slot was booked by someone else in the meantime. }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/appointments/cancelAppointment/{appointmentid}:
 *   post:
 *     summary: Cancel an appointment
 *     description: 'Naming note: this uses POST and mixed-case path segment for historical reasons and is kept exactly as-is because the frontend already depends on it — see the API stabilization notes.'
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: appointmentid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Appointment cancelled; auto-purged 24h later. A cancellation email is sent.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Appointment' } } }]
 *       400: { description: Already cancelled or already completed. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not this patient's appointment, or CSRF token missing/invalid. }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/appointments/updateappointment/{appointmentid}:
 *   patch:
 *     summary: Reschedule an appointment
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: appointmentid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/UpdateAppointmentRequest' } } }
 *     responses:
 *       200:
 *         description: Appointment updated; an update email is sent.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Appointment' } } }]
 *       400: { description: Cancelled/completed appointment, or the new slot is already booked. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not this patient's appointment, or CSRF token missing/invalid. }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /patient/appointments/{appointmentid}:
 *   get:
 *     summary: Get a single appointment (patient)
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: appointmentid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Appointment details.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Appointment' } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

// ---------------------------------------------------------------------
// Doctor
// ---------------------------------------------------------------------

/**
 * @openapi
 * /doctor/todayappointments:
 *   get:
 *     summary: List the authenticated doctor's appointments for today
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Today's appointments, ordered by time.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/Appointment' } } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /doctor/appointments:
 *   get:
 *     summary: List all of the authenticated doctor's appointments
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All appointments for this doctor, newest first.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/Appointment' } } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /doctor/appointments/verify-appointment:
 *   post:
 *     summary: Verify a patient's arrival and mark the appointment Completed
 *     description: Matches the appointment's stored uniquecode exactly; the appointment must belong to the requesting doctor.
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/VerifyAppointmentRequest' } } }
 *     responses:
 *       200:
 *         description: Appointment marked Completed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Appointment' } } }]
 *       400: { description: Invalid code, or the appointment is already cancelled. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @openapi
 * /doctor/appointments/{appointmentid}:
 *   get:
 *     summary: Get a single appointment (doctor)
 *     tags: [Appointment]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: appointmentid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Appointment details.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Appointment' } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

// ---------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------

/**
 * @openapi
 * /admin/todayappointments:
 *   get:
 *     summary: List today's appointments across the whole system (admin)
 *     tags: [Appointment, Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Today's appointments, all doctors. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @openapi
 * /admin/appointments:
 *   get:
 *     summary: List every appointment in the system (admin)
 *     tags: [Appointment, Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All appointments, newest first.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/Appointment' } } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @openapi
 * /admin/appointments/{appointmentid}:
 *   get:
 *     summary: Get a single appointment (admin)
 *     tags: [Appointment, Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: appointmentid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Appointment details. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
