import rateLimit from "express-rate-limit";

import {
    registeradmin,
    loginadmin,
    verifyLoginMfa,
    logoutadmin,
    accesstokenrenewal,
    getprofiledetails,
    updateprofile,
    updateprofilepic,
    getCurrentAdmin,
    updatepassword,
    resetForgottenPassword,
    getSecurityDashboard,
} from "../controllers/admin.controller.js";
 // added update password & reset forgot password ?
import { sendForgetPasswordOtp, verifyForgotPasswordOtp } from "../controllers/otp.controller.js";
import { verifyTempjwt } from "../middlewares/verifytempjwt.middleware.js";
import { apiResponse } from "../utils/apiResponse.js";

import { Router } from "express";
import path from "path";

import { upload } from "../middlewares/multer.middleware.js";
import { requireRole, verifyAuth } from "../middlewares/auth.middleware.js";
import { reportSecurityEvent } from "../services/securityAlert.service.js";
import { verifyMfaToken } from "../middlewares/mfa.middleware.js";
import { verifyCaptcha } from "../middlewares/captcha.middleware.js";
import {
    getallappointmentforadmin,
    getappointment,
    gettodayappointment,
} from "../controllers/appointment.controller.js";
import {
    createDoctorByAdmin,
    deleteDoctorByAdmin,
    getalldoctorprofiledetails,
    getdoctorbydept,
    getdoctorprofiledetails,
    updateDoctorByAdmin,
} from "../controllers/doctor.controller.js";
import {
    createDepartment,
    getAllDepartments,
    updateDepartment,
} from "../controllers/department.controller.js";

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
            role: "admin",
            ip: req.ip,
            endpoint: req.originalUrl,
            description: "OTP request rate limit exceeded.",
        });
        res.status(options.statusCode).json(options.message);
    },
});

// Tighter than the global limiter for profile writes — sensitive, not
// auth-adjacent.
const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 20 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: "Too many profile requests. Please wait before trying again." },
});


const adminOnly = [verifyAuth("admin"), requireRole("admin")];
router.get("/documents/:role/:doctype/:filename", adminOnly, (req, res) => {
    const filePath = path.join(process.cwd(), "private", "uploads", req.params.role, req.params.doctype, req.params.filename);
    res.sendFile(filePath, (err) => {
        if (err) res.status(404).json(new apiResponse(404, {}, "Document not found"));
    });
});

// Auth — public
router.post(
    "/register", 
    adminOnly, // role is verified now only admin can POST
    upload.fields([
        { name: "citizenshipdocument", maxCount: 1 },
        { name: "adminId", maxCount: 1 },
        { name: "profilepicture", maxCount: 1 },
        { name: "appointmentletter", maxCount: 1 },
    ]),
    registeradmin
);
router.post("/login", loginadmin);
router.post("/login/verify-mfa", verifyMfaToken, verifyLoginMfa);
router.post("/renew-access-token", accesstokenrenewal);


// Profile
router.post("/logout", adminOnly, logoutadmin);
router.patch("/update-profile", profileLimiter, adminOnly, updateprofile);
router.patch("/update-profilepicture", profileLimiter, adminOnly, upload.single("profilepicture"), updateprofilepic);
router.get("/get-profile", adminOnly, getprofiledetails);
router.get("/get-admin", adminOnly, getCurrentAdmin);
router.get("/security-dashboard", adminOnly, getSecurityDashboard);
router.patch("/update-password", adminOnly, updatepassword);
// update password routes  added

// Forgot password (public — rate limited in otp.controller.js)
router.post("/forgot-password/send-otp", otpLimiter, sendForgetPasswordOtp);
router.post("/forgot-password/verify-otp", otpLimiter, verifyTempjwt, verifyForgotPasswordOtp);
router.patch("/forgot-password/update-password", otpLimiter, verifyTempjwt, resetForgottenPassword);


// Appointments
router.get("/todayappointments", adminOnly, gettodayappointment);
router.get("/appointments", adminOnly, getallappointmentforadmin);
router.get("/appointments/:appointmentid", adminOnly, getappointment);

// Doctor management
router.get("/doctors", adminOnly, getalldoctorprofiledetails);
router.post(
    "/doctors",
    adminOnly,
    upload.fields([
        { name: "citizenshipdocument", maxCount: 1 },
        { name: "medicaldegree", maxCount: 1 },
        { name: "profilepicture", maxCount: 1 },
        { name: "medicallicense", maxCount: 1 },
    ]),
    createDoctorByAdmin
);
router.get("/doctors/:doctorid", adminOnly, getdoctorprofiledetails);
router.patch(
    "/doctors/:doctorid",
    adminOnly,
    upload.fields([
        { name: "citizenshipdocument", maxCount: 1 },
        { name: "medicaldegree", maxCount: 1 },
        { name: "profilepicture", maxCount: 1 },
        { name: "medicallicense", maxCount: 1 },
    ]),
    updateDoctorByAdmin
);
router.delete("/doctors/:doctorid", adminOnly, deleteDoctorByAdmin);
router.get("/departments/:deptname/doctors", adminOnly, getdoctorbydept);

// Departments
router.post("/create-department", adminOnly, createDepartment);
router.get("/departments", adminOnly, getAllDepartments);
router.patch("/update-department/:id", adminOnly, updateDepartment);

export default router;
