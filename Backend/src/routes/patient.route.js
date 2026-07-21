import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
    registerPatient,
    loginPatient,
    verifyLoginMfa,
    logoutPatient,
    updatepassword,
    updateprofile,
    resetForgottenPassword,
    accesstokenrenewal,
    getprofiledetails,
    updateprofilepic,
    getPatient,
    exportMyData,
    deleteMyAccount,
} from "../controllers/patient.controller.js";
import {
    sendotp,
    verifyotp,
    sendForgetPasswordOtp,
    verifyForgotPasswordOtp,
} from "../controllers/otp.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import { sanitizeInput } from "../middlewares/sanitize.middleware.js";
import { reportSecurityEvent } from "../services/securityAlert.service.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyTempjwt } from "../middlewares/verifytempjwt.middleware.js";
import { verifyMfaToken } from "../middlewares/mfa.middleware.js";
import { verifyCaptcha } from "../middlewares/captcha.middleware.js";
import {
    getalldoctorprofiledetails,
    getdoctorbydept,
    getdoctorprofiledetails,
} from "../controllers/doctor.controller.js";
import { getAllDepartments } from "../controllers/department.controller.js";
import {
    getprescription,
    getallprescriptionsforpatient,
    getprescriptionbyappointment,
} from "../controllers/prescription.contorller.js";
import {
    getlabtest,
    getalllabtestsforpatient,
    getlabtestbyprescription,
} from "../controllers/labtest.controller.js";

const router = Router();
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 10 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: "Too many OTP requests. Please wait before requesting another." },
    // Overrides the default response so the limit-exceeded event also gets
    // audited/alerted; still returns the same status/body as before.
    handler: (req, res, _next, options) => {
        reportSecurityEvent({
            eventType: "otp_rate_limit_exceeded",
            role: "patient",
            ip: req.ip,
            endpoint: req.originalUrl,
            description: "OTP request rate limit exceeded.",
        });
        res.status(options.statusCode).json(options.message);
    },
});

// Tighter than the global limiter for profile writes and account-lifecycle
// actions (export/delete) — not auth-adjacent, but still sensitive.
const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 20 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: "Too many profile requests. Please wait before trying again." },
});

// Auth — public
// sanitizeInput runs again here, after upload.single(): multer is what
// actually parses multipart/form-data into req.body, and it runs after the
// global sanitizeInput in app.js (which only ever sees a body already
// parsed by express.json()/urlencoded() — never multipart). Route-specific
// re-application is required for every multipart route below for the same
// reason; see the identical comment there.
router.post("/register", upload.single("profilepicture"), sanitizeInput, registerPatient);
router.post("/login", loginPatient);
router.post("/login/verify-mfa", verifyMfaToken, verifyLoginMfa);
router.post("/renew-access-token", accesstokenrenewal);

// Auth — protected
router.post("/logout", verifyAuth("patient"), logoutPatient);

// Profile
router.patch("/update-profile", profileLimiter, verifyAuth("patient"), updateprofile);
router.patch("/update-profilepicture", profileLimiter, verifyAuth("patient"), upload.single("profilepicture"), sanitizeInput, updateprofilepic);
router.get("/get-profile", verifyAuth("patient"), getprofiledetails);
router.get("/get-patient", verifyAuth("patient"), getPatient);
router.get("/export-data", profileLimiter, verifyAuth("patient"), exportMyData);
router.post("/delete-account/send-otp", otpLimiter, verifyAuth("patient"), sendotp);
router.delete("/delete-account", profileLimiter, verifyAuth("patient"), deleteMyAccount);

// Password change (requires login + OTP)
router.post("/update-password/send-otp", otpLimiter, verifyAuth("patient"), sendotp);
router.post("/update-password/verify-otp", otpLimiter, verifyAuth("patient"), verifyotp);
router.patch("/update-password", otpLimiter, verifyAuth("patient"), updatepassword);


// Forgot password (public — rate limited in app.js)
router.post("/forgot-password/send-otp", otpLimiter, sendForgetPasswordOtp);
router.post("/forgot-password/verify-otp", otpLimiter, verifyTempjwt, verifyForgotPasswordOtp);
router.patch("/forgot-password/update-password", otpLimiter, verifyTempjwt, resetForgottenPassword);

// Public doctor/department lookups
router.get("/doctors/:doctorid", getdoctorprofiledetails);
router.get("/doctors", getalldoctorprofiledetails);
router.get("/departments", getAllDepartments);
router.get("/departments/:deptname/doctors", getdoctorbydept);

// Patient-scoped records
router.get("/prescriptions", verifyAuth("patient"), getallprescriptionsforpatient);
router.get("/prescriptions/appointment/:appointmentid", verifyAuth("patient"), getprescriptionbyappointment);
router.get("/prescriptions/:prescriptionid", verifyAuth("patient"), getprescription);

router.get("/labtests", verifyAuth("patient"), getalllabtestsforpatient);
router.get("/labtests/prescription/:prescriptionid", verifyAuth("patient"), getlabtestbyprescription);
router.get("/labtests/:labtestid", verifyAuth("patient"), getlabtest);

export default router;
