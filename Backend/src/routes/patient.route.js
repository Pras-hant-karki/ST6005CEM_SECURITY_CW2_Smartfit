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
router.post("/register", upload.single("profilepicture"), registerPatient);
router.post("/login", loginPatient);
router.post("/login/verify-mfa", verifyMfaToken, verifyLoginMfa);
router.post("/renew-access-token", accesstokenrenewal);

// Auth — protected
router.post("/logout", verifyAuth("patient"), logoutPatient);

// Profile
router.patch("/update-profile", profileLimiter, verifyAuth("patient"), updateprofile);
router.patch("/update-profilepicture", profileLimiter, verifyAuth("patient"), upload.single("profilepicture"), updateprofilepic);
router.get("/get-profile", verifyAuth("patient"), getprofiledetails);
router.get("/get-patient", verifyAuth("patient"), getPatient);
router.get("/export-data", profileLimiter, verifyAuth("patient"), exportMyData);
router.delete("/delete-account", profileLimiter, verifyAuth("patient"), deleteMyAccount);

// Password change (requires login + OTP)
router.post("/update-password/send-otp", otpLimiter, verifyAuth("patient"), sendotp);
router.post("/update-password/verify-otp", otpLimiter, verifyAuth("patient"), verifyotp);
router.patch("/update-password", otpLimiter, verifyAuth("patient"), updatepassword);


// Forgot password (public — rate limited in app.js)
router.post("/forgot-password/send-otp", otpLimiter, sendForgetPasswordOtp);
router.post("/forgot-password/verify-otp", otpLimiter, verifyTempjwt, verifyForgotPasswordOtp);
router.patch("/forgot-password/update-password", otpLimiter, verifyTempjwt, resetForgottenPassword);
//bug is fixed by adding otp limiter into the otp endpoints

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
