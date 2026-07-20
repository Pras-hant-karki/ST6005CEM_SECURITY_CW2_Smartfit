import crypto from "crypto";

const isProduction = process.env.NODE_ENV === "production";

export const CSRF_COOKIE_NAME = "csrfToken";

export const generateCsrfToken = () => crypto.randomBytes(32).toString("hex");

// Must be readable by frontend JS (httpOnly: false) — that's the entire
// mechanism of the double-submit pattern: a cross-site request can make the
// browser attach the cookie automatically, but cannot read its value to
// also set the header, so only same-origin JS can make the two match.
export const csrfCookieOptions = {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const csrfClearOptions = {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
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
