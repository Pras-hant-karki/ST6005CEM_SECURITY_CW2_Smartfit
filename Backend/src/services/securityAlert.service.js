import sendMail from "./mail.js";
import { logAudit } from "./auditLog.service.js";
import { shouldSendAlert } from "../utils/rateStore.js";
import { securityAlertTemplate } from "../utils/emailtemplate.js";

// Who receives security alert emails. Falls back to the same mailbox the
// app already sends OTPs/notifications from, so alerts work out of the box
// on this project's single-Gmail-account setup without a new required env
// var — set SECURITY_ALERT_EMAIL to point them somewhere dedicated instead.
const ALERT_RECIPIENT = process.env.SECURITY_ALERT_EMAIL || process.env.SENDER_EMAIL || process.env.EMAIL_USER;

// Explicit allow-list of event types that are severe enough to justify an
// email, not just an audit row. Keeping this a deliberate allow-list (rather
// than alerting on every logAudit call) is what prevents alert fatigue —
// routine failures (a single wrong password, a single 403) are audited but
// never emailed.
const ALERT_WORTHY_EVENTS = new Set([
    "account_locked",
    "ip_blocked",
    "otp_rate_limit_exceeded",
    "refresh_token_reuse",
    "session_device_mismatch",
    "stripe_webhook_invalid_signature",
    "payment_metadata_mismatch",
    "mfa_attempts_exceeded",
]);

const ALERT_SUPPRESSION_WINDOW_MS = 15 * 60 * 1000;

/**
 * Records a high-risk security event: always writes an audit log entry,
 * and — only for events on the alert allow-list, and only once per
 * (event type + source) within the suppression window — emails an
 * administrator. Never throws; a failure here must never break the
 * request that triggered it.
 */
export const reportSecurityEvent = async ({ eventType, userId, role, ip, endpoint, description, metadata }) => {
    // Audit logging is unconditional — this is the record that feeds
    // auditing / incident response / security review, independent of
    // whether the email side is currently suppressed.
    await logAudit({
        userId,
        userRole: role,
        action: eventType,
        resource: endpoint,
        ip,
        result: "failure",
        metadata,
    });

    if (!ALERT_WORTHY_EVENTS.has(eventType)) return;
    if (!ALERT_RECIPIENT) return; // mail not configured — degrade silently, same as the rest of the mail service

    const suppressionKey = `${eventType}:${ip || userId || "unknown"}`;
    if (!shouldSendAlert(suppressionKey, ALERT_SUPPRESSION_WINDOW_MS)) return;

    try {
        await sendMail({
            to: ALERT_RECIPIENT,
            subject: `SmartFit Security Alert: ${eventType}`,
            html: securityAlertTemplate({ eventType, description, ip, userId, role, endpoint }),
        });
    } catch (err) {
        console.error("Security alert email failed:", err.message);
    }
};
