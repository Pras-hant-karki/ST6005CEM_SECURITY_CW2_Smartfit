import Stripe from "stripe";
import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Appointment } from "../models/appointment.model.js";
import { Payment } from "../models/payment.model.js";
import { logAudit } from "../services/auditLog.service.js";
import { reportSecurityEvent } from "../services/securityAlert.service.js";

const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) throw new apiError(503, "Payment service not configured");
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// POST /api/v1/payment/create-checkout-session
// Body: { appointmentId }
export const createCheckoutSession = asyncHandler(async (req, res) => {
    if (!req.patient) throw new apiError(401, "Unauthorized");

    const { appointmentId } = req.body;
    if (!appointmentId) throw new apiError(400, "Appointment ID is required");

    // Verify appointment exists and belongs to this patient (IDOR check)
    const appointment = await Appointment.findById(appointmentId).populate("doctor");
    if (!appointment) throw new apiError(404, "Appointment not found");
    if (appointment.patient.toString() !== req.patient._id.toString()) {
        throw new apiError(403, "Access denied");
    }
    if (appointment.status === "Cancelled") {
        throw new apiError(400, "Cannot pay for a cancelled appointment");
    }

    // Prevent duplicate payment
    const existing = await Payment.findOne({ appointmentId, status: "completed" });
    if (existing) throw new apiError(409, "Appointment already paid");

    // Server-side amount — never trust client-provided price
    const doctor = appointment.doctor;
    if (!doctor || doctor.consultationfee == null) {
        throw new apiError(500, "Doctor consultation fee not configured");
    }
    const amountInPence = Math.round(doctor.consultationfee * 100);
    if (amountInPence <= 0) throw new apiError(400, "Invalid consultation fee");

    const stripe = getStripe();
    const patientUrl = process.env.PATIENT_FRONTEND_URL || "http://192.168.1.67:5173";

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
            price_data: {
                currency: "gbp",
                product_data: {
                    name: `Consultation with Dr. ${doctor.doctorname}`,
                    description: `Appointment on ${appointment.appointmentdate.toDateString()}`,
                },
                unit_amount: amountInPence,
            },
            quantity: 1,
        }],
        mode: "payment",
        success_url: `${patientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${patientUrl}/payment/cancel`,
        metadata: {
            appointmentId: appointmentId.toString(),
            patientId: req.patient._id.toString(),
            doctorId: doctor._id.toString(),
        },
        client_reference_id: appointmentId.toString(),
    });

    await Payment.create({
        appointmentId,
        patientId: req.patient._id,
        doctorId: doctor._id,
        amount: amountInPence,
        currency: "gbp",
        stripeSessionId: session.id,
        status: "pending",
    });

    await logAudit({
        userId: req.patient._id,
        userRole: "patient",
        action: "payment_initiated",
        resource: `appointment/${appointmentId}`,
        ip: req.ip,
        result: "success",
        metadata: { appointmentId, amount: amountInPence, currency: "gbp" },
    });

    return res.status(200).json(new apiResponse(200, { url: session.url, sessionId: session.id }, "Checkout session created"));
});

// GET /api/v1/payment/verify?session_id=...
export const verifyPayment = asyncHandler(async (req, res) => {
    if (!req.patient) throw new apiError(401, "Unauthorized");

    const { session_id } = req.query;
    if (!session_id) throw new apiError(400, "Session ID is required");

    // Ownership check: payment must belong to this patient
    const payment = await Payment.findOne({ stripeSessionId: session_id, patientId: req.patient._id });
    if (!payment) throw new apiError(404, "Payment record not found");

    return res.status(200).json(new apiResponse(200, {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        appointmentId: payment.appointmentId,
        processedAt: payment.processedAt,
    }, "Payment status retrieved"));
});

// POST /api/v1/payment/webhook  — raw body required; must be registered before express.json()
//
// INTERNAL — not a public API endpoint, and deliberately does not use the
// apiResponse/apiError envelope used everywhere else. This is called by
// Stripe's servers, not our own frontends or any API consumer; Stripe's own
// webhook documentation expects (and this follows) a plain
// `{ received: true }` / `{ error: "..." }` shape, and never parses our
// envelope. It's also not wrapped in asyncHandler, since it must guarantee
// Stripe always gets a well-formed acknowledgement — including on internal
// failures — rather than falling through to the generic error middleware.
// Exclude from public Swagger documentation, or document separately under
// an "internal/webhooks" tag.
export const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });
    if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "Webhook not configured" });

    let event;
    try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Stripe webhook signature verification failed:", err.message);
        reportSecurityEvent({
            eventType: "stripe_webhook_invalid_signature",
            role: "system",
            ip: req.ip,
            endpoint: "/payment/webhook",
            description: "A request to the Stripe webhook endpoint failed signature verification — either a misconfigured secret or a forged request.",
            metadata: { reason: err.message },
        });
        return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const obj = event.data.object;

    try {
        if (event.type === "checkout.session.completed") {
            const stripeSessionId = obj.id;
            const payment = await Payment.findOne({ stripeSessionId });

            if (!payment) {
                console.error(`Webhook: no payment record for session ${stripeSessionId}`);
                return res.status(200).json({ received: true });
            }

            // Idempotent: already processed
            if (payment.status === "completed") {
                return res.status(200).json({ received: true });
            }

            // Verify payment status directly with Stripe (prevent replay attacks)
            const stripe = getStripe();
            const stripeSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
            if (stripeSession.payment_status !== "paid") {
                return res.status(200).json({ received: true });
            }

            // Validate metadata integrity (prevent metadata tampering)
            const meta = stripeSession.metadata || {};
            if (
                meta.patientId !== payment.patientId.toString() ||
                meta.appointmentId !== payment.appointmentId.toString()
            ) {
                console.error(`Webhook: metadata mismatch for session ${stripeSessionId}`);
                await reportSecurityEvent({
                    eventType: "payment_metadata_mismatch",
                    userId: payment.patientId,
                    role: "patient",
                    ip: "stripe-webhook",
                    endpoint: `appointment/${payment.appointmentId}`,
                    description: "Stripe webhook metadata did not match the stored payment record — possible tampering or a stale session.",
                    metadata: { stripeSessionId },
                });
                return res.status(200).json({ received: true });
            }

            // Update database only after verified successful payment
            payment.status = "completed";
            payment.stripePaymentIntentId = stripeSession.payment_intent || "";
            payment.processedAt = new Date();
            await payment.save();

            await logAudit({
                userId: payment.patientId,
                userRole: "patient",
                action: "payment_completed",
                resource: `appointment/${payment.appointmentId}`,
                ip: "stripe-webhook",
                result: "success",
                metadata: { stripeSessionId, amount: payment.amount, currency: payment.currency },
            });
        }

        if (event.type === "payment_intent.payment_failed") {
            const paymentIntentId = obj.id;
            const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

            if (payment && payment.status !== "completed") {
                payment.status = "failed";
                payment.processedAt = new Date();
                await payment.save();

                await logAudit({
                    userId: payment.patientId,
                    userRole: "patient",
                    action: "payment_failed",
                    resource: `appointment/${payment.appointmentId}`,
                    ip: "stripe-webhook",
                    result: "failure",
                    metadata: { paymentIntentId },
                });
            }
        }

        // Reconciliation: a Checkout Session that was never completed expires
        // ~24h after creation (or earlier if configured). Without this, an
        // abandoned checkout leaves its Payment stuck in "pending" forever —
        // this closes it out so pending rows always reach a terminal state.
        if (event.type === "checkout.session.expired") {
            const stripeSessionId = obj.id;
            const payment = await Payment.findOne({ stripeSessionId });

            if (!payment) {
                // Missing payment record — nothing to reconcile locally, but
                // worth a record since it means our DB and Stripe disagree
                // on what sessions exist.
                console.error(`Webhook: no payment record for expired session ${stripeSessionId}`);
                await logAudit({
                    userRole: "system",
                    action: "payment_unexpected_state",
                    resource: `stripe-session/${stripeSessionId}`,
                    ip: "stripe-webhook",
                    result: "failure",
                    metadata: { stripeSessionId, reason: "no_local_payment_record", stripeEvent: event.type },
                });
                return res.status(200).json({ received: true });
            }

            // Idempotent: duplicate webhook delivery for a session already
            // marked expired — no-op, no re-logging.
            if (payment.status === "expired") {
                return res.status(200).json({ received: true });
            }

            // Never touch a payment that already reached a completed or
            // failed terminal state — those are reconciled by their own
            // event types. A "completed" payment receiving an expired event
            // shouldn't happen (Stripe treats the two as mutually exclusive
            // outcomes for the same session) so it's flagged as unexpected
            // rather than silently ignored.
            if (payment.status === "completed") {
                console.error(`Webhook: expired event for already-completed session ${stripeSessionId}`);
                await logAudit({
                    userId: payment.patientId,
                    userRole: "patient",
                    action: "payment_unexpected_state",
                    resource: `appointment/${payment.appointmentId}`,
                    ip: "stripe-webhook",
                    result: "failure",
                    metadata: { stripeSessionId, reason: "expired_event_on_completed_payment", stripeEvent: event.type },
                });
                return res.status(200).json({ received: true });
            }

            if (payment.status === "failed") {
                // Already reconciled via payment_intent.payment_failed — a
                // later expiry of the same session is expected, not an error.
                return res.status(200).json({ received: true });
            }

            // payment.status === "pending" — the only state this event is
            // meant to reconcile.
            payment.status = "expired";
            payment.processedAt = new Date();
            await payment.save();

            await logAudit({
                userId: payment.patientId,
                userRole: "patient",
                action: "payment_session_expired",
                resource: `appointment/${payment.appointmentId}`,
                ip: "stripe-webhook",
                result: "success",
                metadata: { stripeSessionId, amount: payment.amount, currency: payment.currency },
            });
        }
    } catch (err) {
        console.error("Webhook processing error:", err.message);
        return res.status(500).json({ error: "Webhook processing failed" });
    }

    return res.status(200).json({ received: true });
};
