import { Patient } from '../models/patient.model.js';
import { Admin } from '../models/admin.model.js';
import { Doctor } from '../models/doctor.model.js';
import { Appointment } from '../models/appointment.model.js';
import { Prescription } from '../models/prescription.model.js';
import Labtest from '../models/labtest.model.js';
import { Payment } from '../models/payment.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { asyncHandler } from '../utils/asynchandler.js';
import { uploadLocal } from '../utils/localUpload.js';
import { deleteUploadedFile } from '../utils/fileCleanup.js';
import { generatePersonalDataPdf } from '../services/pdfExport.service.js';
import { apiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import sendMail from '../services/mail.js';
import { welcomeemailtemplate, logintemplate } from '../utils/emailtemplate.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { trackAttempt, trackLockout, blockIp } from '../utils/rateStore.js';
import { verifyCaptchaToken } from '../middlewares/captcha.middleware.js';
import { logAudit } from '../services/auditLog.service.js';
import { reportSecurityEvent } from '../services/securityAlert.service.js';
import { saveOTP, verifyOTP, clearOTP } from '../services/otp.js';
import generateOtp from '../utils/otpgenerator.js';
import { forgetpasswordotptemplate } from '../utils/emailtemplate.js';
import { issueCsrfCookie, clearCsrfCookie } from '../utils/csrf.js';
import bcrypt from 'bcrypt';

const sendPatientMail = async (mailOptions) => {
    try {
        await sendMail(mailOptions);
    } catch (error) {
        console.error("Patient email notification failed:", error.message);
    }
};

// See utils/csrf.js for why this also flips on in dev when HTTPS_ENABLED=true.
const isSecureContext = process.env.NODE_ENV === "production" || process.env.HTTPS_ENABLED === "true";

const ACCESS_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isSecureContext,
    sameSite: isSecureContext ? "None" : "Lax",
    path: "/",
    maxAge: 1 * 24 * 60 * 60 * 1000,
};
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isSecureContext,
    sameSite: isSecureContext ? "None" : "Lax",
    path: "/",
    maxAge: 20 * 24 * 60 * 60 * 1000,
};
const CLEAR_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isSecureContext,
    sameSite: isSecureContext ? "None" : "Lax",
    path: "/",
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const PASSWORD_EXPIRY_DAYS = 90;

const generateaccesstokenandrefreshtoken = async (patientId, userAgent) => {
    // refreshtoken is select: false on the schema — must opt in explicitly
    // here so it can be stored and compared again on the next renewal.
    const patient = await Patient.findById(patientId).select("+refreshtoken");
    const accesstoken = patient.generateaccesstoken();
    const refreshtoken = patient.generaterefreshtoken();

    patient.refreshtoken = refreshtoken;
    if (userAgent) patient.lastUserAgent = userAgent;
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

    logAudit({ userId: patient._id, userRole: "patient", action: "registration", resource: "patient", ip: req.ip, result: "success" });

    return res.status(201).json(new apiResponse(201, createdpatient, "Patient registered successfully"));
});

const loginPatient = asyncHandler(async (req, res) => {
    const { email, patientusername, password } = req.body;

    if (!patientusername && !email) throw new apiError(400, "Email or username is required");
    if (!password) throw new apiError(400, "Password is required");

    const patient = await Patient.findOne({
        $or: [{ patientusername }, { email }],
    }).select("+password +loginAttempts +lockedUntil +passwordChangedAt");

    if (!patient || patient.isDeleted) throw new apiError(401, "Invalid credentials");
    // when we return the same status and message as a wrong password means
    // a stranger can no longer tell whether this email is registered
    // (a deleted account gets the exact same response, for the same reason —
    // it must not be distinguishable from "no such account")


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
            reportSecurityEvent({
                eventType: "account_locked",
                userId: patient._id,
                role: "patient",
                ip: req.ip,
                endpoint: "/patient/login",
                description: `Patient account locked after ${MAX_LOGIN_ATTEMPTS} consecutive failed login attempts.`,
            });
            // An IP that causes repeated account lockouts (not just repeated
            // failed attempts on one account) gets temporarily blocked outright.
            if (trackLockout(req.ip)) {
                blockIp(req.ip);
                reportSecurityEvent({
                    eventType: "ip_blocked",
                    role: "patient",
                    ip: req.ip,
                    endpoint: "/patient/login",
                    description: "IP address temporarily blocked after triggering repeated account lockouts.",
                });
            }
        }
        await patient.save({ validateBeforeSave: false });
        logAudit({ userId: patient._id, userRole: "patient", action: "login_failed", resource: "patient", ip: req.ip, result: "failure", metadata: { reason: "invalid_password" } });
                throw new apiError(401, "Invalid credentials");
        // matching wording on both failure paths removes the last remaining clue 
        // (the message text itself) that could distinguish the two cases

        
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
        html: `<p>Your SmartFit login verification code is: <strong>${otp}</strong></p><p>It expires in 5 minutes. Do not share it with anyone.</p>`,
    });

    logAudit({ userId: patient._id, userRole: "patient", action: "login_mfa_initiated", resource: "patient", ip: req.ip, result: "success" });

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
        logAudit({ userId: patient._id, userRole: "patient", action: "mfa_failed", resource: "patient", ip: req.ip, result: "failure", metadata: { reason: result.reason } });
        if (result.reason === "expired") throw new apiError(401, "OTP expired. Please log in again.");
        if (result.reason === "too_many_attempts") {
            reportSecurityEvent({
                eventType: "mfa_attempts_exceeded",
                userId: patient._id,
                role: "patient",
                ip: req.ip,
                endpoint: "/patient/login/verify-mfa",
                description: "MFA verification failed repeatedly — attempt threshold exceeded.",
            });
            throw new apiError(429, "Too many incorrect OTP attempts. Please log in again.");
        }
        throw new apiError(401, "Invalid OTP");
    }
    clearOTP(patient.email);

    const { accesstoken, newrefreshtoken } = await generateaccesstokenandrefreshtoken(patient._id, req.headers["user-agent"]);
    const loggedInPatient = await Patient.findById(patient._id).select("-password -refreshtoken -passwordHistory");

    sendPatientMail({
        to: patient.email,
        subject: "Login Alert – SmartFit Account Accessed Successfully",
        html: logintemplate(patient.patientname),
    });

    logAudit({ userId: patient._id, userRole: "patient", action: "login_success", resource: "patient", ip: req.ip, result: "success" });

    // Rotate the CSRF token on login — the anonymous token issued before
    // authentication is discarded in favor of one tied to this new session.
    issueCsrfCookie(res);

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

    logAudit({ userId: req.patient._id, userRole: "patient", action: "logout", resource: "patient", ip: req.ip, result: "success" });

    clearCsrfCookie(res);

    return res
        .status(200)
        .clearCookie("accessToken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "User logged out"));
});

const accesstokenrenewal = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) throw new apiError(401, "Unauthorized request");

    let decoded;
    try {
        // jwt.verify throws on an invalid/expired token rather than returning
        // null, so the failure case is handled in the catch block below.
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        // Expired/invalid refresh token means this session is over — the
        // CSRF token paired with it should die with it too.
        clearCsrfCookie(res);
        throw new apiError(401, "Invalid or expired refresh token");
    }

    if (decoded.role !== "patient") throw new apiError(401, "Patient session required");

    const patient = await Patient.findById(decoded._id).select("+refreshtoken +lastUserAgent");
    if (!patient) throw new apiError(404, "Patient not found");

    if (patient.refreshtoken !== refreshToken) {
        reportSecurityEvent({
            eventType: "refresh_token_reuse",
            userId: patient._id,
            role: "patient",
            ip: req.ip,
            endpoint: "/patient/renew-access-token",
            description: "A refresh token was presented that did not match the one on record — possible token theft or reuse of a revoked token.",
        });
        clearCsrfCookie(res);
        throw new apiError(401, "Refresh token mismatch or already used");
    }

    // Session-to-device binding: a refresh token replayed from a different
    // device/browser than the one it was issued to is rejected outright.
    const currentUserAgent = req.headers["user-agent"];
    if (patient.lastUserAgent && currentUserAgent && patient.lastUserAgent !== currentUserAgent) {
        patient.refreshtoken = null;
        await patient.save({ validateBeforeSave: false });
        reportSecurityEvent({
            eventType: "session_device_mismatch",
            userId: patient._id,
            role: "patient",
            ip: req.ip,
            endpoint: "/patient/renew-access-token",
            description: "Refresh token used from a different device/browser than the one it was issued to.",
        });
        clearCsrfCookie(res);
        throw new apiError(401, "Session from a different device detected. Please log in again.");
    }

    const { accesstoken, newrefreshtoken } = await generateaccesstokenandrefreshtoken(patient._id, currentUserAgent);

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
    patient.refreshtoken = null;  // revoke all existing sessions
    patient.passwordChangedAt = new Date();
    await patient.save({ validateBeforeSave: false });

    clearCsrfCookie(res);

    return res
        .status(200)
        .clearCookie("accessToken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "Password updated. Please log in again."));
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
    user.refreshtoken = null;
    user.passwordChangedAt = new Date();
    await user.save({ validateBeforeSave: false });
    logAudit({ userId: req.user?._id, userRole: req.userRole || "patient", action: "password_reset",
        resource: "patient", ip: req.ip, result: "success" });
    clearCsrfCookie(res);
    return res
        .status(200)
        .clearCookie("tempToken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("accessToken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS)
        // all 3 tokens are refreshed now, so user must log in again.
        .json(new apiResponse(200, {}, "Password reset successfully. Please log in again."));
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

    logAudit({ userId: req.patient._id, userRole: "patient", action: "profile_updated", resource: "patient", ip: req.ip, result: "success", metadata: { fields: Object.keys(updates) } });

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

// Data portability: lets a patient download every record their account owns
// as a single professional PDF report (profile, appointments, medical
// history notes, prescriptions, lab reports, payments, and their own audit
// trail) rather than a raw JSON dump.
const exportMyData = asyncHandler(async (req, res) => {
    const patient = await Patient.findById(req.patient._id)
        .select("-password -refreshtoken -passwordHistory -loginAttempts -lockedUntil");
    if (!patient) throw new apiError(404, "Patient not found");

    const [appointments, prescriptions, labtests, payments, auditLogs] = await Promise.all([
        Appointment.find({ patient: patient._id }).populate("doctor", "doctorname department").sort({ appointmentdate: -1 }),
        Prescription.find({ "patientdetails.patientusername": patient.patientusername }).sort({ createdAt: -1 }),
        Labtest.find({ patient_id: patient._id }).populate("verified_by", "doctorname").sort({ createdAt: -1 }),
        Payment.find({ patientId: patient._id }).sort({ createdAt: -1 }),
        AuditLog.find({ userId: String(patient._id) }).sort({ timestamp: -1 }).limit(200),
    ]);

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
    const formatDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB") : "—");

    const medicalHistoryRows = appointments
        .filter((a) => a.medicalhistory && a.medicalhistory.trim())
        .map((a) => [formatDate(a.appointmentdate), a.doctor?.doctorname || "—", a.medicalhistory]);

    const sections = [
        {
            heading: "Account Information",
            type: "keyvalue",
            rows: [
                ["Patient ID", String(patient._id)],
                ["Full Name", patient.patientname],
                ["Username", patient.patientusername],
                ["Email", patient.email],
                ["Phone Number", patient.phonenumber],
                ["Age", patient.age],
                ["Gender", patient.sex],
                ["Guardian Name", patient.guardianName || "—"],
                ["Account Created", formatDate(patient.createdAt)],
            ],
        },
        { heading: "Profile Picture", type: "profilePicture", url: patient.profilepicture },
        {
            heading: "Appointments",
            type: "table",
            columns: [
                { header: "Date", width: 0.16 },
                { header: "Time", width: 0.12 },
                { header: "Doctor", width: 0.24 },
                { header: "Department", width: 0.2 },
                { header: "Status", width: 0.14 },
                { header: "Symptoms", width: 0.14 },
            ],
            rows: appointments.map((a) => [
                formatDate(a.appointmentdate),
                a.appointmenttime || "—",
                a.doctor?.doctorname || "—",
                a.doctor?.department || "—",
                a.status,
                a.symptoms || "—",
            ]),
        },
        {
            heading: "Medical History Notes",
            type: "table",
            columns: [
                { header: "Date", width: 0.18 },
                { header: "Doctor", width: 0.25 },
                { header: "Notes", width: 0.57 },
            ],
            rows: medicalHistoryRows,
        },
        {
            heading: "Prescriptions",
            type: "table",
            columns: [
                { header: "Date", width: 0.14 },
                { header: "Doctor", width: 0.2 },
                { header: "Diagnosis", width: 0.28 },
                { header: "Medicines", width: 0.38 },
            ],
            rows: prescriptions.map((p) => [
                formatDate(p.createdAt),
                p.doctordetails?.doctorname || "—",
                p.diagonosis || "—",
                (p.medicines || []).map((m) => `${m.medicinename} ${m.dosage} (${m.frequency}, ${m.duration})`).join("; ") || "—",
            ]),
        },
        {
            heading: "Lab Reports",
            type: "table",
            columns: [
                { header: "Date", width: 0.16 },
                { header: "Test(s)", width: 0.36 },
                { header: "Status", width: 0.18 },
                { header: "Verified By", width: 0.3 },
            ],
            rows: labtests.map((l) => [
                formatDate(l.report_date || l.createdAt),
                (l.tests || []).map((t) => t.test_name).join(", ") || "—",
                l.overall_status,
                l.verified_by?.doctorname ? `Dr. ${l.verified_by.doctorname}` : "Not yet verified",
            ]),
        },
        {
            heading: "Payments",
            type: "table",
            columns: [
                { header: "Date", width: 0.18 },
                { header: "Amount", width: 0.18 },
                { header: "Currency", width: 0.18 },
                { header: "Status", width: 0.18 },
                { header: "Stripe Session", width: 0.28 },
            ],
            rows: payments.map((p) => [
                formatDate(p.createdAt),
                (p.amount / 100).toFixed(2),
                p.currency?.toUpperCase(),
                p.status,
                p.stripeSessionId,
            ]),
        },
        {
            heading: "Account Activity (Audit Log)",
            type: "table",
            columns: [
                { header: "Timestamp", width: 0.28 },
                { header: "Action", width: 0.28 },
                { header: "Result", width: 0.16 },
                { header: "IP Address", width: 0.28 },
            ],
            rows: auditLogs.map((a) => [formatDateTime(a.timestamp), a.action, a.result, a.ip || "—"]),
        },
    ];

    logAudit({ userId: patient._id, userRole: "patient", action: "data_exported", resource: "patient", ip: req.ip, result: "success" });

    generatePersonalDataPdf(res, {
        filename: `smartfit-data-export-${patient.patientusername}.pdf`,
        reportTitle: "Patient Data Export",
        generatedFor: { name: patient.patientname, role: "Patient", identifier: patient.patientusername },
        sections,
    });
});

// Right-to-erasure. Requires: current password + a freshly verified OTP
// (sent to the account's registered email) + explicit frontend confirmation.
// Soft-deletes rather than hard-deletes — see the isDeleted field comment on
// the Patient model for why: Appointment/Payment/Labtest hold required
// ObjectId references to this document, so removing it outright would
// orphan every appointment, payment, and lab record this patient ever had.
const deleteMyAccount = asyncHandler(async (req, res) => {
    const { password, otp } = req.body;
    if (!password) throw new apiError(400, "Password confirmation is required to delete your account");
    if (!otp) throw new apiError(400, "OTP verification is required to delete your account");

    const patient = await Patient.findById(req.patient._id).select("+password");
    if (!patient) throw new apiError(404, "Patient not found");

    const isPasswordValid = await patient.ispasswordcorrect(password);
    if (!isPasswordValid) throw new apiError(401, "Incorrect password");

    const otpResult = await verifyOTP(patient.email, String(otp));
    if (!otpResult.valid) {
        if (otpResult.reason === "expired") throw new apiError(401, "OTP expired. Please request a new one and try again.");
        if (otpResult.reason === "too_many_attempts") throw new apiError(429, "Too many incorrect OTP attempts. Please request a new OTP.");
        throw new apiError(401, "Invalid OTP");
    }
    await clearOTP(patient.email);

    // Preserve the appointment records, but reflect reality: a cancelled
    // account can't show up for a future booking. Only touches appointments
    // that haven't already reached a terminal state.
    await Appointment.updateMany(
        { patient: patient._id, status: { $in: ["Pending", "Confirmed"] } },
        { $set: { status: "Cancelled" } }
    );

    // The profile picture is the only file this account owns on disk.
    await deleteUploadedFile(patient.profilepicture);

    const deletedId = patient._id.toString();
    patient.isDeleted = true;
    patient.deletedAt = new Date();
    patient.patientname = "Deleted Patient";
    patient.email = `deleted-${deletedId}@smartfit.invalid`;
    patient.patientusername = `deleted-${deletedId}`;
    patient.phonenumber = "0000000000";
    patient.guardianName = "";
    patient.profilepicture = "";
    patient.refreshtoken = null;
    patient.lastUserAgent = null;
    await patient.save({ validateBeforeSave: false });

    logAudit({ userId: deletedId, userRole: "patient", action: "account_deleted", resource: "patient", ip: req.ip, result: "success" });

    clearCsrfCookie(res);

    return res
        .status(200)
        .clearCookie("accessToken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "Account deleted successfully"));
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
    exportMyData,
    deleteMyAccount,
};
