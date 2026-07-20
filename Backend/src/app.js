import express from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import patientRouter from "./routes/patient.route.js";
import doctorRouter from "./routes/doctor.route.js";
import adminRouter from "./routes/admin.route.js";
import appointmentRouter from "./routes/appointment.route.js";
import paymentRouter from "./routes/payment.route.js";
import cronRoutes from "./routes/cron.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { ipBlockMiddleware } from "./middlewares/ipBlock.middleware.js";
import { ensureCsrfCookie, verifyCsrf } from "./middlewares/csrf.middleware.js";
import { stripeWebhook } from "./controllers/payment.controller.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Rejects IPs that have repeatedly triggered account lockouts, before any
// other middleware runs.
app.use(ipBlockMiddleware);

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow serving static files to other origins
    contentSecurityPolicy: isProduction ? undefined : false,  // disable CSP in dev to avoid blocking hot-reload
}));

// Static uploads (profile pictures, documents) must be servable by plain <img>/<a> tags,
// which never send an Origin header — mount before the CORS Origin check so those
// requests aren't rejected by the "no Origin in production" rule below.
app.use(express.static("public"));

const envOrigins = [
    process.env.CORS_ORIGIN_DOCTOR,
    process.env.CORS_ORIGIN_PATIENT,
    process.env.CORS_ORIGIN_ADMIN,
    process.env.CORS_ORIGINS,
]
    .filter(Boolean)
    .flatMap((origin) => origin.split(","))
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [
    ...envOrigins,
    "http://192.168.1.67:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.67:5173",
    "http://192.168.1.67:5174",
    "http://127.0.0.1:5174",
    "http://192.168.1.67:5175",
    "http://127.0.0.1:5175",
    "http://92.168.18.17:5173",
].filter(Boolean);

const isLocalDevOrigin = (origin) =>
    !isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
    cors({
        origin: function (origin, callback) {
            // BUG-015 fix: null/missing origin (e.g. curl, Postman) is only allowed in development.
            if (!origin) {
                if (!isProduction) return callback(null, true);
                return callback(new Error("CORS: requests without an Origin header are not allowed in production"));
            }
            if (allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`Not allowed by CORS: ${origin}`));
            }
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        // X-CSRF-Token must be explicitly allow-listed — the three frontends
        // run on different ports than this API, so every request carrying a
        // custom header is cross-origin and subject to CORS preflight; without
        // this, the browser blocks the request before it ever reaches verifyCsrf.
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
        credentials: true,
    })
);

app.use(cookieparser());

// Stripe webhook must receive the raw body BEFORE express.json() parses it.
// Signature verification requires the original raw bytes from Stripe.
app.post("/api/v1/payment/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// Strip MongoDB operator keys ($-prefixed) from body and query to prevent NoSQL injection.
const stripMongoOperators = (obj) => {
    if (Array.isArray(obj)) { obj.forEach(stripMongoOperators); return; }
    if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj)) {
            if (key.startsWith("$")) { delete obj[key]; }
            else { stripMongoOperators(obj[key]); }
        }
    }
};
app.use((req, _res, next) => {
    if (req.body) stripMongoOperators(req.body);
    if (req.query) stripMongoOperators(req.query);
    next();
});

// CSRF protection (double-submit cookie). ensureCsrfCookie issues a token
// for any client that doesn't have one yet (including pre-login visitors);
// verifyCsrf then rejects any unsafe-method request whose X-CSRF-Token
// header doesn't match it. Placed after cookie-parser/body-parsing (needs
// req.cookies) and before the routers, so it applies uniformly to every
// route registered below — the Stripe webhook is exempted inside verifyCsrf
// itself (see csrf.middleware.js) since it's never called from a browser.
app.use(ensureCsrfCookie);
app.use(verifyCsrf);

// Global rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 300 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
});

// Login rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 20 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

const adminAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        statusCode: 429,
        message: "Too many admin login attempts. Please try again later.",
        role: "admin",
        maxAttempts: 5,
    },
});

// BUG-004 fix: OTP endpoints were previously unrated.
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 10 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: "Too many OTP requests. Please wait before requesting another." },
});

// MFA verification limiter
const mfaLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: isProduction ? 10 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: "Too many MFA verification attempts." },
});

app.use(limiter);

// Auth rate limiting
app.use("/api/v1/patient/login", authLimiter);
app.use("/api/v1/doctor/login", authLimiter);
app.use("/api/v1/admin/login", adminAuthLimiter);

// MFA verification rate limiting
app.use("/api/v1/patient/login/verify-mfa", mfaLimiter);
app.use("/api/v1/doctor/login/verify-mfa", mfaLimiter);
app.use("/api/v1/admin/login/verify-mfa", mfaLimiter);

// Routes
app.use("/api/v1", cronRoutes);
app.use("/api/v1/patient", patientRouter);
app.use("/api/v1/doctor", doctorRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/patient/appointments", appointmentRouter);
app.use("/api/v1/payment", paymentRouter);
app.use(errorMiddleware);

app.get("/", (req, res) => {
    res.send("Backend is running successfully!");
});

export { app };
export default app;
