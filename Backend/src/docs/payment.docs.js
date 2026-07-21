/**
 * Payment — Stripe Checkout session creation and status verification.
 * The Stripe webhook receiver (POST /payment/webhook) is intentionally
 * excluded — see the System tag and payment.controller.js's stripeWebhook
 * for why.
 * Pure documentation module (see swagger.js).
 */

/**
 * @openapi
 * /payment/create-checkout-session:
 *   post:
 *     summary: Create a Stripe Checkout session for an appointment
 *     description: The charge amount is computed server-side from the doctor's consultationfee — never trusted from the client. Rejects appointments that are cancelled, not owned by the caller, or already paid.
 *     tags: [Payment]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCheckoutSessionRequest' }
 *     responses:
 *       200:
 *         description: Checkout session created — redirect the browser to `data.url`.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CheckoutSessionResponse' }
 *       400: { description: Missing appointmentId, or the appointment is cancelled. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Not this patient's appointment, or CSRF token missing/invalid. }
 *       404: { description: Appointment not found. }
 *       409: { description: Appointment is already paid. }
 *       500: { description: Doctor's consultation fee is not configured. }
 *       503: { description: Payment service (Stripe) not configured. }
 */

/**
 * @openapi
 * /payment/verify:
 *   get:
 *     summary: Check the status of a payment by Stripe session ID
 *     description: Ownership-scoped — only returns a result for a session belonging to the authenticated patient. Actual confirmation of payment success happens asynchronously via the Stripe webhook; this endpoint just reflects the currently stored status.
 *     tags: [Payment]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: session_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment status.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentStatusResponse' }
 *       400: { description: Missing session_id. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: No payment record found for this session and patient. }
 */
