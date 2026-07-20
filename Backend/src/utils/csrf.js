import crypto from "crypto";

// Cookies must be Secure/SameSite=None whenever the connection is actually
// HTTPS — in production, or in dev when HTTPS_ENABLED=true (self-signed
// cert). Without this, a dev backend running on https:// would still issue
// SameSite=Lax cookies, which browsers' schemeful-same-site rules treat as
// cross-site relative to an http:// frontend and silently drop on XHR/fetch.
const isSecureContext = process.env.NODE_ENV === "production" || process.env.HTTPS_ENABLED === "true";

export const CSRF_COOKIE_NAME = "csrfToken";

export const generateCsrfToken = () => crypto.randomBytes(32).toString("hex");

// Must be readable by frontend JS (httpOnly: false) — that's the entire
// mechanism of the double-submit pattern: a cross-site request can make the
// browser attach the cookie automatically, but cannot read its value to
// also set the header, so only same-origin JS can make the two match.
export const csrfCookieOptions = {
    httpOnly: false,
    secure: isSecureContext,
    sameSite: isSecureContext ? "None" : "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const csrfClearOptions = {
    httpOnly: false,
    secure: isSecureContext,
    sameSite: isSecureContext ? "None" : "Lax",
    path: "/",
};

export const issueCsrfCookie = (res) => {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
    return token;
};

export const clearCsrfCookie = (res) => {
    res.clearCookie(CSRF_COOKIE_NAME, csrfClearOptions);
};
