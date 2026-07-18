import rateLimit from "express-rate-limit";

import {
    registerdoctor,
    logindoctor,
    verifyLoginMfa,
    logoutdoctor,
    accesstokenrenewal,
    updatepassword,
    resetForgottenPassword,
    updateprofile,
    updateprofilepic,
    updatedocument,
    getdoctorprofiledetailsprivate,
    getCurrentDoctor,
} from "../controllers/doctor.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import { verifyTempjwt } from "../middlewares/verifytempjwt.middleware.js";
import { verifyMfaToken } from "../middlewares/mfa.middleware.js";
import { verifyCaptcha } from "../middlewares/captcha.middleware.js";
import {
    sendotp,
    verifyotp,
    sendForgetPasswordOtp,
    verifyForgotPasswordOtp,
} from "../controllers/otp.controller.js";
import {
    getallappointmentfordoctor,
    getappointment,
    gettodayappointment,
    verifyappointment,
} from "../controllers/appointment.controller.js";
import {
    createprescription,
    getprescription,
    getallprescriptionsfordoctor,
    getprescriptionbyappointment,
    updateprescription,
    deleteprescription,
} from "../controllers/prescription.contorller.js";
import {
    createlabtest,
    getlabtest,
    getalllabtestsfordoctor,
    getlabtestbyprescription,
    updatelabtest,
    updatetestresults,
    verifylabtest,
    deletelabtest,
} from "../controllers/labtest.controller.js";

const router = Router();

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 10 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: "Too many OTP requests. Please wait before requesting another." },
});

// Auth — public
router.post(
    "/register",
    upload.fields([
        { name: "citizenshipdocument", maxCount: 1 },
        { name: "medicaldegree", maxCount: 1 },
        { name: "profilepicture", maxCount: 1 },
        { name: "medicallicense", maxCount: 1 },
    ]),
    registerdoctor
);
router.post("/login", logindoctor);
router.post("/login/verify-mfa", verifyMfaToken, verifyLoginMfa);
router.post("/renew-access-token", accesstokenrenewal);

// Auth — protected
router.post("/logout", verifyAuth("doctor"), logoutdoctor);
router.patch("/update-profile", verifyAuth("doctor"), updateprofile);
router.patch("/update-profilepicture", verifyAuth("doctor"), upload.single("profilepicture"), updateprofilepic);
router.get("/profile", verifyAuth("doctor"), getdoctorprofiledetailsprivate);
router.get("/get-doctor", verifyAuth("doctor"), getCurrentDoctor);

router.patch(
    "/update-document",
    verifyAuth("doctor"),
    upload.fields([
        { name: "citizenshipdocument", maxCount: 1 },
        { name: "medicaldegree", maxCount: 1 },
        { name: "medicallicense", maxCount: 1 },
    ]),
    updatedocument
);

// Password change (requires login + OTP)
router.post("/update-password/send-otp", otpLimiter, verifyAuth("doctor"), sendotp);
router.post("/update-password/verify-otp", verifyAuth("doctor"), verifyotp);
router.patch("/update-password", verifyAuth("doctor"), updatepassword);

// Forgot password (public — rate limited in app.js)
router.post("/forgot-password/send-otp", otpLimiter, sendForgetPasswordOtp);
router.post("/forgot-password/verify-otp", otpLimiter, verifyTempjwt, verifyForgotPasswordOtp);
router.patch("/forgot-password/update-password", otpLimiter, verifyTempjwt, resetForgottenPassword);


// Appointments
router.get("/todayappointments", verifyAuth("doctor"), gettodayappointment);
router.get("/appointments", verifyAuth("doctor"), getallappointmentfordoctor);
router.post("/appointments/verify-appointment", verifyAuth("doctor"), verifyappointment);
router.get("/appointments/:appointmentid", verifyAuth("doctor"), getappointment);

// Prescriptions
router.get("/prescriptions", verifyAuth("doctor"), getallprescriptionsfordoctor);
router.get("/prescriptions/appointment/:appointmentid", verifyAuth("doctor"), getprescriptionbyappointment);
router.post("/prescriptions/:appointmentid", verifyAuth("doctor"), createprescription);
router.get("/prescriptions/:prescriptionid", verifyAuth("doctor"), getprescription);
router.patch("/prescriptions/:prescriptionid", verifyAuth("doctor"), updateprescription);
router.delete("/prescriptions/:prescriptionid", verifyAuth("doctor"), deleteprescription);

// Lab tests
router.get("/labtests", verifyAuth("doctor"), getalllabtestsfordoctor);
router.post("/labtests", verifyAuth("doctor"), createlabtest);
router.get("/labtests/prescription/:prescriptionid", verifyAuth("doctor"), getlabtestbyprescription);
router.patch("/labtests/:labtestid/test-results", verifyAuth("doctor"), updatetestresults);
router.post("/labtests/:labtestid/verify", verifyAuth("doctor"), verifylabtest);
router.get("/labtests/:labtestid", verifyAuth("doctor"), getlabtest);
router.patch("/labtests/:labtestid", verifyAuth("doctor"), updatelabtest);
router.delete("/labtests/:labtestid", verifyAuth("doctor"), deletelabtest);

export default router;
