import express from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import patientRouter from "./routes/patient.route.js";
import doctorRouter from "./routes/doctor.route.js";
import adminRouter from "./routes/admin.route.js";
import appointmentRouter from "./routes/appointment.route.js";
import paymentRouter from "./routes/payment.route.js";
import cronRoutes from "./routes/cron.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { ipBlockMiddleware } from "./middlewares/ipBlock.middleware.js";
import { ensureCsrfCookie, verifyCsrf } from "./middlewares/csrf.middleware.js";
import { sanitizeInput } from "./middlewares/sanitize.middleware.js";
import { stripeWebhook } from "./controllers/payment.controller.js";
import { swaggerSpec } from "./docs/swagger.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const isSecureContext = isProduction || process.env.HTTPS_ENABLED === "true";


app.use(ipBlockMiddleware);


app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

app.use(
    "/api-docs",
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
            },
        },
    }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "SmartFit Hospital Management System API Docs",
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: "list",
        },
    })
);

// ---------------------------------------------------------------------------
// Security headers (Helmet)
// ---------------------------------------------------------------------------
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,

    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'none'"],
            scriptSrc: ["'none'"],
            styleSrc: ["'none'"],
            imgSrc: ["'self'"],
            fontSrc: ["'none'"],
            connectSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'none'"],
            formAction: ["'none'"],
            frameAncestors: ["'none'"],
            ...(isSecureContext ? { upgradeInsecureRequests: [] } : {}),
        },
    },

    strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: false,
    },

    
    frameguard: { action: "deny" },

    referrerPolicy: { policy: "no-referrer" },
}));


app.use((req, res, next) => {
    res.setHeader(
        "Permissions-Policy",
        [
            "camera=()",
            "microphone=()",
            "geolocation=()",
            "payment=()",
            "usb=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()",
            "fullscreen=(self)",
        ].join(", ")
    );
    next();
});


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
            // Requests with no Origin header (curl, Postman, server-to-server) are
            // only allowed in development — production requires a real browser origin.
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
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
        exposedHeaders: ["Content-Disposition"],
        credentials: true,
    })
);

app.use(cookieparser());

app.post("/api/v1/payment/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

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


app.use(sanitizeInput);

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
