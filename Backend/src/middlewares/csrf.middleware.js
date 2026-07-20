import crypto from "crypto";
import { CSRF_COOKIE_NAME, issueCsrfCookie } from "../utils/csrf.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Endpoints that are never called with an ambient browser session, so there
// is no CSRF-relevant cookie to protect and a token cannot exist on the
// caller's side to send back:
//   - /api/v1/payment/webhook — called server-to-server by Stripe, authenticated
//     by the `stripe-signature` header against STRIPE_WEBHOOK_SECRET, not by
//     our cookies. Stripe's servers never receive our csrfToken cookie.
// This route is also registered in app.js before this middleware and sends
// its own response without calling next(), so in practice it never reaches
// this check at all. It's listed here anyway so the exclusion is explicit
// and doesn't silently depend on that registration order.
const CSRF_EXEMPT_PATHS = new Set([
    "/api/v1/payment/webhook",
]);

// Issues a CSRF cookie for any client that doesn't already have one, so a
// token exists before the first state-changing request — including login
// and registration, which happen before any authenticated session exists —
// is ever made. Runs on every request; a no-op once a cookie is present.
export const ensureCsrfCookie = (req, res, next) => {
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
        issueCsrfCookie(res);
    }
    next();
};

// Double-submit cookie check. The token in the readable csrfToken cookie
// must match the token echoed back in the X-CSRF-Token header. A cross-site
// form or script can make the browser attach the cookie automatically on a
// forged request, but same-origin policy prevents it from reading the
// cookie's value to also set the header — so the two only match when the
// request genuinely originated from our own frontend JS.
export const verifyCsrf = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    if (CSRF_EXEMPT_PATHS.has(req.path)) return next();

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers["x-csrf-token"];

    const valid =
        typeof cookieToken === "string" &&
        typeof headerToken === "string" &&
        cookieToken.length === headerToken.length &&
        crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));

    if (!valid) {
        return res.status(403).json({ statusCode: 403, message: "Invalid or missing CSRF token" });
    }

    next();
};
