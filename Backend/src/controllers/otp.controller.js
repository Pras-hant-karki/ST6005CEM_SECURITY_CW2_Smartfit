import sendMail from "../services/mail.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { trackAttempt } from "../utils/rateStore.js";
import { verifyCaptchaToken } from "../middlewares/captcha.middleware.js";
import generateOtp from "../utils/otpgenerator.js";
import { saveOTP, verifyOTP, clearOTP } from "../services/otp.js";
import { Patient } from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Admin } from "../models/admin.model.js";
import { forgetpasswordotptemplate, otpTemplate } from "../utils/emailtemplate.js";
import jwt from "jsonwebtoken";

// See utils/csrf.js for why this also flips on in dev when HTTPS_ENABLED=true.
const isSecureContext = process.env.NODE_ENV === "production" || process.env.HTTPS_ENABLED === "true";
const CLEAR_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isSecureContext,
    sameSite: isSecureContext ? "None" : "Lax",
    path: "/",
};

const sendotp = asyncHandler(async (req, res) => {
    const email = req.patient?.email || req.doctor?.email || req.admin?.email;
    if (!email) {
        throw new apiError(400, "User not logged in or email not available");
    }

    const otp = generateOtp();
    await saveOTP(email, otp);

    const response = await sendMail({
        to: email,
        subject: "SmartFit OTP Verification",
        html: otpTemplate(otp),
    });
    if (!response) {
        throw new apiError(500, "Failed to send OTP");
    }

    return res.status(200).json(new apiResponse(200, {}, "OTP sent successfully"));
});

const verifyotp = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const email = req.patient?.email || req.doctor?.email || req.admin?.email;

    if (!email) throw new apiError(400, "User not logged in or email not available");
    if (!otp) throw new apiError(400, "OTP is required");

    const result = await verifyOTP(email, String(otp));
    if (!result.valid) {
        if (result.reason === "expired") throw new apiError(401, "OTP expired. Please request a new one.");
        if (result.reason === "too_many_attempts") throw new apiError(429, "Too many incorrect attempts. Please request a new OTP.");
        throw new apiError(401, "Invalid OTP");
    }

    clearOTP(email);
    return res.status(200).json(new apiResponse(200, {}, "OTP verified successfully"));
});

const sendForgetPasswordOtp = asyncHandler(async (req, res) => {
    const { email, phonenumber } = req.body;

    if (!email && !phonenumber) throw new apiError(400, "Email or phone number is required");

    const identifier = email || phonenumber || req.ip || "unknown";
    if (trackAttempt(`forgotpwd:${identifier}`, 10 * 60 * 1000, 3)) {
        const token = req.body["h-captcha-response"];
        if (!token) return res.status(200).json(new apiResponse(200, { captchaRequired: true }, "Please complete CAPTCHA verification."));
        await verifyCaptchaToken(token);
    }

    const query = email ? { email } : { phonenumber };
    const patient = await Patient.findOne(query);
    const doctor = await Doctor.findOne(query);
    const admin = await Admin.findOne(query);

    if (!patient && !doctor && !admin) {
        return res.status(200).json(new apiResponse(200, {}, "If an account with these details exists, an OTP has been sent."));
    }

    const user = {};
    if (patient) {
        user.id = patient._id; user.role = "patient"; user.email = patient.email; user.name = patient.patientname;
    } else if (doctor) {
    // chaining with else-if means only the first match is kept, nothing after it can overwrite it anymore
        user.id = doctor._id; user.role = "doctor"; user.email = doctor.email; user.name = doctor.doctorname;
    } else if (admin) {
        user.id = admin._id; user.role = "admin"; user.email = admin.email; user.name = admin.adminname;
    }

    const greeting =
        user.role === "doctor" ? `Hello Dr. ${user.name}` :
        user.role === "admin" ? "Hello Admin" :
        `Hello ${user.name}`;

    const tempToken = jwt.sign(
        { _id: user.id, role: user.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "5m" }
    );

    const otp = generateOtp();
    await saveOTP(user.email, otp);

    const response = await sendMail({
        to: user.email,
        subject: "Your SmartFit OTP Code to Reset Password",
        html: forgetpasswordotptemplate(otp, greeting),
    });
    if (!response) throw new apiError(500, "Failed to send OTP");

    return res
        .status(200)
        .cookie("tempToken", tempToken, { ...CLEAR_COOKIE_OPTIONS, maxAge: 5 * 60 * 1000 })
        .json(new apiResponse(200, {}, "OTP sent successfully")); 
        //empty body — token lives only in HttpOnly cookie
});

const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    if (!otp) throw new apiError(400, "OTP is required");

    const email = req.user?.email;
    if (!email) throw new apiError(400, "Session invalid. Please restart the password reset flow.");

    const result = await verifyOTP(email, String(otp));
    if (!result.valid) {
        if (result.reason === "expired") throw new apiError(401, "OTP expired. Please request a new one.");
        if (result.reason === "too_many_attempts") throw new apiError(429, "Too many incorrect attempts. Please request a new OTP.");
        throw new apiError(401, "Invalid OTP");
    }

    clearOTP(email);

    const decoded = jwt.decode(req.cookies?.tempToken);
    const freshTempToken = jwt.sign(
        { _id: decoded._id, role: decoded.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "5m" }
    );

    return res
        .status(200)
        .cookie("tempToken", freshTempToken, { ...CLEAR_COOKIE_OPTIONS, maxAge: 5 * 60 * 1000 })
        .json(new apiResponse(200, {}, "OTP verified successfully"));
});


export { sendotp, verifyotp, verifyForgotPasswordOtp, sendForgetPasswordOtp };
