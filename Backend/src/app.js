import express from "express"
import cors from "cors"
import cookieparser from "cookie-parser"



const app = express()
const isProduction = process.env.NODE_ENV === "production";
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
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
].filter(Boolean);

const isLocalDevOrigin = (origin) =>
    !isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true); 
            if (allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`Not allowed by CORS: ${origin}`));
            }
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);
app.use(cookieparser())
app.use(express.json({ limit: "20kb" }))
app.use(express.urlencoded({ extended: true, limit: "20kb" }))
app.use(express.static("public"))

import patientRouter from "./routes/patient.route.js"
import doctorRouter from "./routes/doctor.route.js"
import adminRouter from "./routes/admin.route.js"
import appointmentRouter from "./routes/appointment.route.js"
import cronRoutes from "./routes/cron.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js"
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
});

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

app.use(limiter);
app.use("/api/v1/patient/login", authLimiter);
app.use("/api/v1/doctor/login", authLimiter);
app.use("/api/v1/admin/login", adminAuthLimiter);


app.use("/api/v1", cronRoutes);
app.use("/api/v1/patient", patientRouter)
app.use("/api/v1/doctor", doctorRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/patient/appointments", appointmentRouter)
app.use(errorMiddleware);

app.get("/", (req, res) => {
    res.send("Backend is running successfully!");
});




export { app }
export default app;
