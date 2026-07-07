import { Patient } from '../models/patient.model.js';
import { Admin } from '../models/admin.model.js';
import { Doctor } from '../models/doctor.model.js';
import { asyncHandler } from '../utils/asynchandler.js';
import { uploadLocal } from '../utils/localUpload.js';
import { apiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import sendMail from '../services/mail.js';
import { welcomeemailtemplate, logintemplate } from '../utils/emailtemplate.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { trackAttempt } from '../utils/rateStore.js';
import { verifyCaptchaToken } from '../middlewares/captcha.middleware.js';
import { saveOTP, verifyOTP, clearOTP } from '../services/otp.js';
import generateOtp from '../utils/otpgenerator.js';
import { forgetpasswordotptemplate } from '../utils/emailtemplate.js';
import bcrypt from 'bcrypt';

const sendPatientMail = async (mailOptions) => {
    try {
        await sendMail(mailOptions);
    } catch (error) {
        console.error("Patient email notification failed:", error.message);
    }
};

const isProduction = process.env.NODE_ENV === "production";

const ACCESS_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
    maxAge: 1 * 24 * 60 * 60 * 1000,
};
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
    maxAge: 20 * 24 * 60 * 60 * 1000,
};
const CLEAR_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const PASSWORD_EXPIRY_DAYS = 90;

const generateaccesstokenandrefreshtoken = async (patientId) => {
    // BUG-002 fix: select "+refreshtoken" so it can be stored and compared on renewal.
    const patient = await Patient.findById(patientId).select("+refreshtoken");
    const accesstoken = patient.generateaccesstoken();
    const refreshtoken = patient.generaterefreshtoken();

    patient.refreshtoken = refreshtoken;
    await patient.save({ validateBeforeSave: false });

    return { accesstoken, newrefreshtoken: refreshtoken };
};

const checkPasswordHistory = async (plaintext, passwordHistory = []) => {
    for (const oldHash of passwordHistory) {
        if (await bcrypt.compare(plaintext, oldHash)) return true;
    }
    return false;
};

const REG_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const REG_LIMIT = 5;

const registerPatient = asyncHandler(async (req, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    if (trackAttempt(`reg:${clientIp}`, REG_WINDOW_MS, REG_LIMIT)) {
        const token = req.body["h-captcha-response"];
        if (!token) return res.status(200).json(new apiResponse(200, { captchaRequired: true }, "Please complete CAPTCHA verification."));
        await verifyCaptchaToken(token);
    }

    const { patientname, patientusername, email, password, confirmPassword, phonenumber, age, sex } = req.body;

    if (
        [patientname, patientusername, email, phonenumber, age, sex, password].some(
            (field) => !field || String(field).trim() === ""
        )
    ) {
        throw new apiError(400, "All fields are required");
    }

    // BUG-018 fix: confirmPassword is now required, not optional.
    if (!confirmPassword) {
        throw new apiError(400, "Please confirm your password");
    }
    if (confirmPassword !== password) {
        throw new apiError(400, "Passwords do not match");
    }

    const passwordError = validatePassword(password);
    if (passwordError) throw new apiError(400, passwordError);

    const parsedAge = Number(age);
    if (Number.isNaN(parsedAge) || parsedAge < 0) {
        throw new apiError(400, "Age must be a valid positive number");
    }

    const existedpatient = await Patient.findOne({ $or: [{ patientusername }, { email }] });
    if (existedpatient) {
        throw new apiError(409, "Patient with same email or username already exists");
    }

    let profilepicture;
    if (req.file) {
        profilepicture = await uploadLocal(req.file.buffer, "patients/profile-pictures");
    }

    const patient = await Patient.create({
        patientname,
        patientusername,
        email,
        password,
        phonenumber: String(phonenumber),
        age: parsedAge,
        sex,
        guardianName: req.body.guardianName || "",
        profilepicture: profilepicture?.secure_url || "",
        passwordChangedAt: new Date(),
    });

    if (!patient) throw new apiError(500, "Patient registration failed");

    const createdpatient = await Patient.findById(patient._id).select("-password -refreshtoken -passwordHistory");

    sendPatientMail({
        to: email,
        subject: `Welcome to SmartFit, ${createdpatient.patientname}! Your Registration is Successful`,
        html: welcomeemailtemplate(createdpatient.patientname),
    });

    return res.status(201).json(new apiResponse(201, createdpatient, "Patient registered successfully"));
});

const loginPatient = asyncHandler(async (req, res) => {
    const { email, patientusername, password } = req.body;

    if (!patientusername && !email) throw new apiError(400, "Email or username is required");
    if (!password) throw new apiError(400, "Password is required");

    const patient = await Patient.findOne({
        $or: [{ patientusername }, { email }],
    }).select("+password +loginAttempts +lockedUntil +passwordChangedAt");

    if (!patient) throw new apiError(404, "Patient not found");

    // Account lockout check
    if (patient.lockedUntil && patient.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((patient.lockedUntil - Date.now()) / 60000);
        throw new apiError(423, `Account locked due to repeated failed attempts. Try again in ${minutesLeft} minute(s).`);
    }

    // Adaptive CAPTCHA: enforce after 3 failed attempts
    const captchaSecret = process.env.HCAPTCHA_SECRET_KEY;
    if (captchaSecret && (patient.loginAttempts || 0) >= 3) {
        const captchaToken = req.body["h-captcha-response"];
        if (!captchaToken) {
            return res.status(200).json(new apiResponse(200, { captchaRequired: true }, "Please complete CAPTCHA verification."));
        }
        const captchaParams = new URLSearchParams({ secret: captchaSecret, response: captchaToken });
        let captchaData;
        try {
            const captchaRes = await fetch("https://hcaptcha.com/siteverify", { method: "POST", body: captchaParams, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
            captchaData = await captchaRes.json();
        } catch {
            throw new apiError(503, "CAPTCHA service unavailable. Please try again.");
        }
        if (!captchaData.success) throw new apiError(400, "CAPTCHA verification failed. Please try again.");
    }

    const isPasswordValid = await patient.ispasswordcorrect(password);

    if (!isPasswordValid) {
        // Increment failed attempts
        patient.loginAttempts = (patient.loginAttempts || 0) + 1;
        if (patient.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            patient.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        }
        await patient.save({ validateBeforeSave: false });
        throw new apiError(401, "Invalid password");
    }

    // Reset lockout on success
    patient.loginAttempts = 0;
    patient.lockedUntil = null;
    await patient.save({ validateBeforeSave: false });

    // Check password expiry
    if (patient.passwordChangedAt) {
        const daysSinceChange = (Date.now() - patient.passwordChangedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceChange > PASSWORD_EXPIRY_DAYS) {
            // Issue a temp token so the user can reset their password without logging in fully.
            const tempToken = jwt.sign(
                { _id: patient._id, role: "patient" },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: "10m" }
            );
            return res
                .status(403)
                .cookie("tempToken", tempToken, { ...CLEAR_COOKIE_OPTIONS, maxAge: 10 * 60 * 1000 })
                .json(new apiResponse(403, { passwordExpired: true }, "Your password has expired. Please reset it."));
        }
    }

    // MFA: generate short-lived token, send OTP, do NOT issue session tokens yet.
    const mfaToken = jwt.sign(
        { _id: patient._id, role: "patient" },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "5m" }
    );

    const otp = generateOtp();
    await saveOTP(patient.email, otp);

    sendPatientMail({
        to: patient.email,
        subject: "SmartFit — Login Verification Code",
        html: `<p>Your SmartFit login verification code is: <strong>${otp}</strong></p><p>It expires in 2 minutes. Do not share it with anyone.</p>`,
    });

    return res
        .status(200)
        .cookie("mfaToken", mfaToken, { ...CLEAR_COOKIE_OPTIONS, maxAge: 5 * 60 * 1000 })
        .json(new apiResponse(200, { mfaRequired: true }, "OTP sent to registered email. Please verify to complete login."));
});

const verifyLoginMfa = asyncHandler(async (req, res) => {
    // req.patient is populated by verifyMfaToken middleware.
    const { otp } = req.body;
    if (!otp) throw new apiError(400, "OTP is required");

    const patient = req.patient;

    const result = await verifyOTP(patient.email, otp);
    if (!result.valid) {
        if (result.reason === "expired") throw new apiError(401, "OTP expired. Please log in again.");
        if (result.reason === "too_many_attempts") throw new apiError(429, "Too many incorrect OTP attempts. Please log in again.");
        throw new apiError(401, "Invalid OTP");
    }
    clearOTP(patient.email);

    const { accesstoken, newrefreshtoken } = await generateaccesstokenandrefreshtoken(patient._id);
    const loggedInPatient = await Patient.findById(patient._id).select("-password -refreshtoken -passwordHistory");

    sendPatientMail({
        to: patient.email,
        subject: "Login Alert – SmartFit Account Accessed Successfully",
        html: logintemplate(patient.patientname),
    });

    return res
        .status(200)
        .clearCookie("mfaToken", CLEAR_COOKIE_OPTIONS)
        .cookie("accessToken", accesstoken, ACCESS_COOKIE_OPTIONS)
        .cookie("refreshToken", newrefreshtoken, REFRESH_COOKIE_OPTIONS)
        .json(new apiResponse(200, { user: loggedInPatient }, "Login successful"));
});

const logoutPatient = asyncHandler(async (req, res) => {
    await Patient.findByIdAndUpdate(
        req.patient._id,
        { $unset: { refreshtoken: 1 } },
        { new: true }
    );

    return res
        .status(200)
        .clearCookie("accessToken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "User logged out"));
});

const accesstokenrenewal = asyncHandler(async (req, res) => {
    // BUG-008 fix: req.cookies is always {}, use optional chaining to actually read the value.
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) throw new apiError(401, "Unauthorized request");

    let decoded;
    try {
        // BUG-007 fix: jwt.verify throws on failure — wrap in try/catch instead of dead if(!decoded).
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        throw new apiError(401, "Invalid or expired refresh token");
    }

    if (decoded.role !== "patient") throw new apiError(401, "Patient session required");

    // BUG-002 fix: must select "+refreshtoken" to compare stored token.
    const patient = await Patient.findById(decoded._id).select("+refreshtoken");
    if (!patient) throw new apiError(404, "Patient not found");

    if (patient.refreshtoken !== refreshToken) {
        throw new apiError(401, "Refresh token mismatch or already used");
    }

    const { accesstoken, newrefreshtoken } = await generateaccesstokenandrefreshtoken(patient._id);

    return res
        .status(200)
        .cookie("accessToken", accesstoken, ACCESS_COOKIE_OPTIONS)
        .cookie("refreshToken", newrefreshtoken, REFRESH_COOKIE_OPTIONS)
        .json(new apiResponse(200, { accesstoken }, "Access token renewed successfully"));
});

const updatepassword = asyncHandler(async (req, res) => {
    const { oldpassword, newpassword } = req.body;

    if (!oldpassword || !newpassword) throw new apiError(400, "Old password and new password are required");

    const passwordError = validatePassword(newpassword);
    if (passwordError) throw new apiError(400, passwordError);

    const patient = await Patient.findById(req.patient?._id).select("+password +passwordHistory");
    if (!patient) throw new apiError(404, "Patient not found");

    const isOldPasswordValid = await patient.ispasswordcorrect(oldpassword);
    if (!isOldPasswordValid) throw new apiError(401, "Old password is incorrect");

    // Check new password isn't the same as current
    if (await bcrypt.compare(newpassword, patient.password)) {
        throw new apiError(400, "New password cannot be the same as the current password");
    }

    // Check against password history (last 5)
    const reuseFound = await checkPasswordHistory(newpassword, patient.passwordHistory);
    if (reuseFound) throw new apiError(400, "Password has been used recently. Please choose a different password.");

    // Push current hash to history before changing
    const updatedHistory = [patient.password, ...(patient.passwordHistory || [])].slice(0, 5);
    patient.passwordHistory = updatedHistory;
    patient.password = newpassword;
    patient.passwordChangedAt = new Date();
    await patient.save({ validateBeforeSave: false });

    return res.status(200).json(new apiResponse(200, {}, "Password updated successfully"));
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
    const { newpassword } = req.body;
    if (!newpassword) throw new apiError(400, "New password is required");

    const passwordError = validatePassword(newpassword);
    if (passwordError) throw new apiError(400, passwordError);

    const ModelByRole = { patient: Patient, admin: Admin, doctor: Doctor };
    const Model = ModelByRole[req.userRole] || Patient;

    const user = await Model.findById(req.user?._id).select("+password +passwordHistory");
    if (!user) throw new apiError(404, "User not found");

    if (await bcrypt.compare(newpassword, user.password)) {
        throw new apiError(400, "New password cannot be the same as the current password");
    }

    const reuseFound = await checkPasswordHistory(newpassword, user.passwordHistory);
    if (reuseFound) throw new apiError(400, "Password has been used recently. Please choose a different password.");

    const updatedHistory = [user.password, ...(user.passwordHistory || [])].slice(0, 5);
    user.passwordHistory = updatedHistory;
    user.password = newpassword;
    user.passwordChangedAt = new Date();
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .clearCookie("tempToken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "Password reset successfully"));
});

const updateprofile = asyncHandler(async (req, res) => {
    const { patientname, email, phonenumber, age, sex, guardianName } = req.body;

    const updates = {};
    if (patientname) updates.patientname = patientname;
    if (email) updates.email = email;
    if (phonenumber) updates.phonenumber = String(phonenumber);
    if (age !== undefined && age !== "") {
        const parsedAge = Number(age);
        if (Number.isNaN(parsedAge) || parsedAge < 0) throw new apiError(400, "Age must be a valid positive number");
        updates.age = parsedAge;
    }
    if (sex) updates.sex = sex;
    if (guardianName) updates.guardianName = guardianName;

    if (Object.keys(updates).length === 0) throw new apiError(400, "At least one field is required to update");

    const updatedPatient = await Patient.findByIdAndUpdate(
        req.patient._id,
        { $set: updates },
        { new: true }
    ).select("-password -refreshtoken -passwordHistory");

    if (!updatedPatient) throw new apiError(404, "Patient not found");

    return res.status(200).json(new apiResponse(200, updatedPatient, "Profile updated successfully"));
});

const getprofiledetails = asyncHandler(async (req, res) => {
    const patient = await Patient.findById(req.patient?._id).select("-password -refreshtoken -passwordHistory");
    if (!patient) throw new apiError(404, "Patient not found");
    return res.status(200).json(new apiResponse(200, patient, "Profile fetched successfully"));
});

const updateprofilepic = asyncHandler(async (req, res) => {
    const profilepicturelocalpath = req.file?.buffer;
    if (!profilepicturelocalpath) throw new apiError(400, "Profile picture not found");

    const profilepicture = await uploadLocal(profilepicturelocalpath, "patients/profile-pictures");
    if (!profilepicture) throw new apiError(400, "Profile picture upload failed");

    const updatedpatient = await Patient.findByIdAndUpdate(
        req.patient?._id,
        { $set: { profilepicture: profilepicture.secure_url } },
        { new: true }
    ).select("-password -refreshtoken -passwordHistory");

    if (!updatedpatient) throw new apiError(404, "Patient not found");

    return res.status(200).json(new apiResponse(200, updatedpatient, "Profile picture updated successfully"));
});

const getPatient = asyncHandler(async (req, res) => {
    const patient = await Patient.findById(req.patient?._id).select("-password -refreshtoken -passwordHistory");
    if (!patient) throw new apiError(404, "Patient not found");
    return res.status(200).json(new apiResponse(200, patient, "Current patient fetched successfully"));
});

export {
    registerPatient,
    loginPatient,
    verifyLoginMfa,
    logoutPatient,
    accesstokenrenewal,
    updatepassword,
    resetForgottenPassword,
    updateprofile,
    getprofiledetails,
    updateprofilepic,
    getPatient,
};
