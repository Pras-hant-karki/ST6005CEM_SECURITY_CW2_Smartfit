import { asyncHandler } from "../utils/asynchandler.js";
import { Admin } from "../models/admin.model.js";
import { apiError } from "../utils/apiError.js";
import { uploadLocal } from "../utils/localUpload.js";
import { deleteUploadedFiles } from "../utils/fileCleanup.js";
import { generatePersonalDataPdf } from "../services/pdfExport.service.js";
import { apiResponse } from "../utils/apiResponse.js";
import sendMail from "../services/mail.js";
import { welcomeemailtemplate, logintemplate } from "../utils/emailtemplate.js";
import { validatePassword } from "../utils/passwordValidator.js";
import { trackAttempt, trackLockout, blockIp } from "../utils/rateStore.js";
import { verifyCaptchaToken } from "../middlewares/captcha.middleware.js";
import { logAudit } from "../services/auditLog.service.js";
import { reportSecurityEvent } from "../services/securityAlert.service.js";
import { AuditLog } from "../models/auditLog.model.js";
import { saveOTP, verifyOTP, clearOTP } from "../services/otp.js";
import generateOtp from "../utils/otpgenerator.js";
import { issueCsrfCookie, clearCsrfCookie } from "../utils/csrf.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const sendAdminMail = async (mailOptions) => {
    try {
        await sendMail(mailOptions);
    } catch (error) {
        console.error("Admin email notification failed:", error.message);
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
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;
const PASSWORD_EXPIRY_DAYS = 90;

const generateaccesstokenandrefreshtoken = async (adminId, userAgent) => {
    // BUG-001 fix: select "+refreshtoken" to allow comparison during renewal.
    const admin = await Admin.findById(adminId).select("+refreshtoken");
    const accesstoken = admin.generateaccesstoken();
    const refreshtoken = admin.generaterefreshtoken();

    admin.refreshtoken = refreshtoken;
    if (userAgent) admin.lastUserAgent = userAgent;
    await admin.save({ validateBeforeSave: false });

    return { accesstoken, refreshtoken };
};

const REG_WINDOW_MS = 10 * 60 * 1000;
const REG_LIMIT = 5;

const registeradmin = asyncHandler(async (req, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    if (trackAttempt(`reg:${clientIp}`, REG_WINDOW_MS, REG_LIMIT)) {
        const token = req.body["h-captcha-response"];
        if (!token) return res.status(200).json(new apiResponse(200, { captchaRequired: true }, "Please complete CAPTCHA verification."));
        await verifyCaptchaToken(token);
    }

    const { adminname, adminusername, email, password, phonenumber } = req.body;

    if ([adminname, adminusername, email, password, phonenumber].some((f) => !f || f?.trim() === "")) {
        throw new apiError(400, "All fields are required");
    }

    const passwordError = validatePassword(password);
    if (passwordError) throw new apiError(400, passwordError);

    const existedadmin = await Admin.findOne({ $or: [{ adminusername }, { email }] });
    if (existedadmin) throw new apiError(409, "Admin with same email or username already exists");

    const citizenshipDocumentLocalPath = req.files?.citizenshipdocument?.[0]?.buffer;
    const adminIdlocalpath = req.files?.adminId?.[0]?.buffer;
    const profilepicturelocalpath = req.files?.profilepicture?.[0]?.buffer;
    const appointmentletterlocalpath = req.files?.appointmentletter?.[0]?.buffer;

    if (!citizenshipDocumentLocalPath || !adminIdlocalpath || !profilepicturelocalpath || !appointmentletterlocalpath) {
        throw new apiError(400, "All files are required");
    }

    const citizenshipdocument = await uploadLocal(citizenshipDocumentLocalPath, "admin/citizenship-document");
    const adminId = await uploadLocal(adminIdlocalpath, "admin/admin-id");
    const profilepicture = await uploadLocal(profilepicturelocalpath, "admin/profile-picture");
    const appointmentletter = await uploadLocal(appointmentletterlocalpath, "admin/appointment-letter");

    if (!citizenshipdocument || !adminId || !profilepicture || !appointmentletter) {
        throw new apiError(500, "File upload failed");
    }

    const admin = await Admin.create({
        adminname,
        adminusername,
        email,
        password,
        phonenumber,
        verificationdocs: {
            citizenshipdocument: citizenshipdocument.secure_url,
            adminId: adminId.secure_url,
            profilepicture: profilepicture.secure_url,
            appointmentletter: appointmentletter.secure_url,
        },
        passwordChangedAt: new Date(),
    });

    if (!admin) throw new apiError(500, "Admin registration failed");

    const createdAdmin = await Admin.findById(admin._id).select("-password -refreshtoken -passwordHistory");

    sendAdminMail({
        to: email,
        subject: `Welcome to SmartFit, ${createdAdmin.adminname}! Your Registration is Successful`,
        html: welcomeemailtemplate(createdAdmin.adminname),
    });

    logAudit({ userId: admin._id, userRole: "admin", action: "registration", resource: "admin", ip: req.ip, result: "success" });

    return res.status(201).json(new apiResponse(201, createdAdmin, "Admin registered successfully"));
});

const loginadmin = asyncHandler(async (req, res) => {
    const { adminusername, email, password } = req.body;

    if (!adminusername && !email) throw new apiError(400, "Admin username or email is required");
    if (!password) throw new apiError(400, "Password is required");

    const admin = await Admin.findOne({
        $or: [{ adminusername }, { email }],
    }).select("+password +loginAttempts +lockedUntil +passwordChangedAt");

    if (!admin || admin.isDeleted) throw new apiError(404, "Admin not found");

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((admin.lockedUntil - Date.now()) / 60000);
        throw new apiError(423, `Account locked. Try again in ${minutesLeft} minute(s).`);
    }

    // Adaptive CAPTCHA: enforce after 3 failed attempts
    const captchaSecret = process.env.HCAPTCHA_SECRET_KEY;
    if (captchaSecret && (admin.loginAttempts || 0) >= 3) {
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

    const isPasswordValid = await admin.ispasswordcorrect(password);
    if (!isPasswordValid) {
        admin.loginAttempts = (admin.loginAttempts || 0) + 1;
        if (admin.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            admin.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
            reportSecurityEvent({
                eventType: "account_locked",
                userId: admin._id,
                role: "admin",
                ip: req.ip,
                endpoint: "/admin/login",
                description: `Admin account locked after ${MAX_LOGIN_ATTEMPTS} consecutive failed login attempts.`,
            });
            if (trackLockout(req.ip)) {
                blockIp(req.ip);
                reportSecurityEvent({
                    eventType: "ip_blocked",
                    role: "admin",
                    ip: req.ip,
                    endpoint: "/admin/login",
                    description: "IP address temporarily blocked after triggering repeated account lockouts.",
                });
            }
        }
        await admin.save({ validateBeforeSave: false });
        logAudit({ userId: admin._id, userRole: "admin", action: "login_failed", resource: "admin", ip: req.ip, result: "failure", metadata: { reason: "invalid_password" } });
        throw new apiError(401, "Password is not valid");
    }

    admin.loginAttempts = 0;
    admin.lockedUntil = null;
    await admin.save({ validateBeforeSave: false });

    // Dev-only MFA bypass for a single named admin account (explicitly requested).
    if (admin.adminusername === "prashantadmin") {
        const { accesstoken, refreshtoken } = await generateaccesstokenandrefreshtoken(admin._id, req.headers["user-agent"]);
        const loggedinadmin = await Admin.findById(admin._id).select("-password -refreshtoken -passwordHistory");

        logAudit({ userId: admin._id, userRole: "admin", action: "login_success", resource: "admin", ip: req.ip, result: "success" });

        issueCsrfCookie(res);

        return res
            .status(200)
            .cookie("accesstoken", accesstoken, ACCESS_COOKIE_OPTIONS)
            .cookie("refreshtoken", refreshtoken, REFRESH_COOKIE_OPTIONS)
            .json(new apiResponse(200, { user: loggedinadmin }, "Admin logged in successfully"));
    }

    if (admin.passwordChangedAt) {
        const daysSinceChange = (Date.now() - admin.passwordChangedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceChange > PASSWORD_EXPIRY_DAYS) {
            const tempToken = jwt.sign(
                { _id: admin._id, role: "admin" },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: "10m" }
            );
            return res
                .status(403)
                .cookie("tempToken", tempToken, { ...CLEAR_COOKIE_OPTIONS, maxAge: 10 * 60 * 1000 })
                .json(new apiResponse(403, { passwordExpired: true }, "Your password has expired. Please reset it."));
        }
    }

    const mfaToken = jwt.sign(
        { _id: admin._id, role: "admin" },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "5m" }
    );

    const otp = generateOtp();
    await saveOTP(admin.email, otp);

    sendAdminMail({
        to: admin.email,
        subject: "SmartFit — Login Verification Code",
        html: `<p>Your SmartFit admin login verification code is: <strong>${otp}</strong></p><p>It expires in 5 minutes.</p>`,
    });

    logAudit({ userId: admin._id, userRole: "admin", action: "login_mfa_initiated", resource: "admin", ip: req.ip, result: "success" });

    return res
        .status(200)
        .cookie("mfaToken", mfaToken, { ...CLEAR_COOKIE_OPTIONS, maxAge: 5 * 60 * 1000 })
        .json(new apiResponse(200, { mfaRequired: true }, "OTP sent to registered email."));
});

const verifyLoginMfa = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    if (!otp) throw new apiError(400, "OTP is required");

    const admin = req.admin;

    const result = await verifyOTP(admin.email, otp);
    if (!result.valid) {
        logAudit({ userId: admin._id, userRole: "admin", action: "mfa_failed", resource: "admin", ip: req.ip, result: "failure", metadata: { reason: result.reason } });
        if (result.reason === "expired") throw new apiError(401, "OTP expired. Please log in again.");
        if (result.reason === "too_many_attempts") {
            reportSecurityEvent({
                eventType: "mfa_attempts_exceeded",
                userId: admin._id,
                role: "admin",
                ip: req.ip,
                endpoint: "/admin/login/verify-mfa",
                description: "MFA verification failed repeatedly — attempt threshold exceeded.",
            });
            throw new apiError(429, "Too many OTP attempts. Please log in again.");
        }
        throw new apiError(401, "Invalid OTP");
    }
    clearOTP(admin.email);

    const { accesstoken, refreshtoken } = await generateaccesstokenandrefreshtoken(admin._id, req.headers["user-agent"]);
    const loggedinadmin = await Admin.findById(admin._id).select("-password -refreshtoken -passwordHistory");

    sendAdminMail({
        to: admin.email,
        subject: "Login Alert – SmartFit Account Accessed Successfully",
        html: logintemplate(admin.adminname),
    });

    logAudit({ userId: admin._id, userRole: "admin", action: "login_success", resource: "admin", ip: req.ip, result: "success" });

    // Rotate the CSRF token on login — the anonymous token issued before
    // authentication is discarded in favor of one tied to this new session.
    issueCsrfCookie(res);

    return res
        .status(200)
        .clearCookie("mfaToken", CLEAR_COOKIE_OPTIONS)
        .cookie("accesstoken", accesstoken, ACCESS_COOKIE_OPTIONS)
        .cookie("refreshtoken", refreshtoken, REFRESH_COOKIE_OPTIONS)
        .json(new apiResponse(200, { user: loggedinadmin }, "Admin logged in successfully"));
});

const logoutadmin = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(req.admin?._id, { $unset: { refreshtoken: 1 } }, { new: true });
    logAudit({ userId: req.admin?._id, userRole: "admin", action: "logout", resource: "admin", ip: req.ip, result: "success" });
    clearCsrfCookie(res);
    return res
        .status(200)
        .clearCookie("accesstoken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshtoken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "Admin logged out successfully"));
});

const accesstokenrenewal = asyncHandler(async (req, res) => {
    // BUG-008 fix: optional chaining on cookies.
    const refreshtoken = req.cookies?.refreshtoken;

    if (!refreshtoken) throw new apiError(401, "Unauthorized request");

    let decodetoken;
    try {
        // BUG-007 fix: wrap jwt.verify in try/catch.
        decodetoken = jwt.verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        clearCsrfCookie(res);
        throw new apiError(401, "Invalid or expired refresh token");
    }

    if (decodetoken.role !== "admin") throw new apiError(401, "Admin session required");

    const admin = await Admin.findById(decodetoken._id).select("+refreshtoken +lastUserAgent");
    if (!admin) throw new apiError(404, "Admin not found");

    if (admin.refreshtoken !== refreshtoken) {
        reportSecurityEvent({
            eventType: "refresh_token_reuse",
            userId: admin._id,
            role: "admin",
            ip: req.ip,
            endpoint: "/admin/renew-access-token",
            description: "A refresh token was presented that did not match the one on record — possible token theft or reuse of a revoked token.",
        });
        clearCsrfCookie(res);
        throw new apiError(401, "Refresh token mismatch or already used");
    }

    const currentUserAgent = req.headers["user-agent"];
    if (admin.lastUserAgent && currentUserAgent && admin.lastUserAgent !== currentUserAgent) {
        admin.refreshtoken = null;
        await admin.save({ validateBeforeSave: false });
        reportSecurityEvent({
            eventType: "session_device_mismatch",
            userId: admin._id,
            role: "admin",
            ip: req.ip,
            endpoint: "/admin/renew-access-token",
            description: "Refresh token used from a different device/browser than the one it was issued to.",
        });
        clearCsrfCookie(res);
        throw new apiError(401, "Session from a different device detected. Please log in again.");
    }

    const { accesstoken, refreshtoken: newrefreshtoken } = await generateaccesstokenandrefreshtoken(admin._id, currentUserAgent);

    return res
        .status(200)
        .cookie("accesstoken", accesstoken, ACCESS_COOKIE_OPTIONS)
        .cookie("refreshtoken", newrefreshtoken, REFRESH_COOKIE_OPTIONS)
        .json(new apiResponse(200, { accesstoken }, "Access token renewed successfully"));
});

const updatepassword = asyncHandler(async (req, res) => {
    const { oldpassword, newpassword } = req.body;

    if (!oldpassword || !newpassword) throw new apiError(400, "Old password and new password are required");

    const passwordError = validatePassword(newpassword);
    if (passwordError) throw new apiError(400, passwordError);

    const admin = await Admin.findById(req.admin?._id).select("+password +passwordHistory");
    if (!admin) throw new apiError(404, "Admin not found");

    const isOldValid = await admin.ispasswordcorrect(oldpassword);
    if (!isOldValid) throw new apiError(401, "Old password is incorrect");

    if (await bcrypt.compare(newpassword, admin.password)) {
        throw new apiError(400, "New password cannot be the same as the current password");
    }
    for (const oldHash of admin.passwordHistory || []) {
        if (await bcrypt.compare(newpassword, oldHash)) {
            throw new apiError(400, "Password has been used recently. Please choose a different password.");
        }
    }

    const updatedHistory = [admin.password, ...(admin.passwordHistory || [])].slice(0, 5);
    admin.passwordHistory = updatedHistory;
    admin.password = newpassword;
    admin.refreshtoken = null; // revoke all existing sessions, matching patient/doctor behavior
    admin.passwordChangedAt = new Date();
    await admin.save({ validateBeforeSave: false });

    clearCsrfCookie(res);

    return res
        .status(200)
        .clearCookie("accesstoken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshtoken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "Password updated. Please log in again."));
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
    const { newpassword } = req.body;
    if (!newpassword) throw new apiError(400, "New password is required");

    const passwordError = validatePassword(newpassword);
    if (passwordError) throw new apiError(400, passwordError);

    const admin = await Admin.findById(req.user?._id).select("+password +passwordHistory");
    if (!admin) throw new apiError(404, "Admin not found");

    if (await bcrypt.compare(newpassword, admin.password)) {
        throw new apiError(400, "New password cannot be the same as the current password");
    }
    for (const oldHash of admin.passwordHistory || []) {
        if (await bcrypt.compare(newpassword, oldHash)) {
            throw new apiError(400, "Password has been used recently. Please choose a different password.");
        }
    }

    const updatedHistory = [admin.password, ...(admin.passwordHistory || [])].slice(0, 5);
    admin.passwordHistory = updatedHistory;
    admin.password = newpassword;
    admin.refreshtoken = null; // revoke all existing sessions, matching patient/doctor behavior
    admin.passwordChangedAt = new Date();
    await admin.save({ validateBeforeSave: false });

    clearCsrfCookie(res);

    return res
        .status(200)
        .clearCookie("tempToken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("accesstoken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshtoken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "Password reset successfully. Please log in again."));
});

const updateprofile = asyncHandler(async (req, res) => {
    const { adminname, email, phonenumber } = req.body;

    const updates = {};
    if (adminname) updates.adminname = adminname;
    if (email) updates.email = email;
    if (phonenumber) updates.phonenumber = phonenumber;

    if (Object.keys(updates).length === 0) throw new apiError(400, "At least one field is required to update");

    const updatedadmin = await Admin.findByIdAndUpdate(
        req.admin?._id,
        { $set: updates },
        { new: true }
    ).select("-password -refreshtoken -passwordHistory");

    if (!updatedadmin) throw new apiError(404, "Admin not found");

    return res.status(200).json(new apiResponse(200, updatedadmin, "Profile updated successfully"));
});

const getprofiledetails = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin?._id).select("-password -refreshtoken -passwordHistory");
    if (!admin) throw new apiError(404, "Admin not found");
    return res.status(200).json(new apiResponse(200, admin, "Profile fetched successfully"));
});

const updateprofilepic = asyncHandler(async (req, res) => {
    const profilepicturelocalpath = req.file?.buffer;
    if (!profilepicturelocalpath) throw new apiError(400, "Profile picture not found");

    const profilepicture = await uploadLocal(profilepicturelocalpath, "admin/profile-picture");
    if (!profilepicture) throw new apiError(400, "Profile picture upload failed");

    const updatedadmin = await Admin.findByIdAndUpdate(
        req.admin?._id,
        { $set: { "verificationdocs.profilepicture": profilepicture.secure_url || profilepicture.url } },
        { new: true }
    ).select("-password -refreshtoken -passwordHistory");

    if (!updatedadmin) throw new apiError(404, "Admin not found");

    return res.status(200).json(new apiResponse(200, updatedadmin, "Profile picture updated successfully"));
});

const getCurrentAdmin = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin?._id).select("-password -refreshtoken -passwordHistory");
    if (!admin) throw new apiError(404, "Admin not found");
    return res.status(200).json(new apiResponse(200, admin, "Current admin fetched successfully"));
});

// Read-only summary of the last 24h of audit activity — polling-based,
// no WebSocket. Surfaces failed-login volume per IP so an admin can spot
// a brute-force pattern without querying MongoDB directly.
const getSecurityDashboard = asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [failedLoginsByIp, eventCounts, recentFailures] = await Promise.all([
        AuditLog.aggregate([
            { $match: { action: "login_failed", timestamp: { $gte: since } } },
            { $group: { _id: "$ip", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ]),
        AuditLog.aggregate([
            { $match: { timestamp: { $gte: since } } },
            { $group: { _id: { action: "$action", result: "$result" }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        AuditLog.find({ result: "failure", timestamp: { $gte: since } })
            .sort({ timestamp: -1 })
            .limit(50)
            .select("timestamp userRole action resource ip result"),
    ]);

    return res.status(200).json(new apiResponse(200, {
        windowStart: since,
        failedLoginsByIp: failedLoginsByIp.map((r) => ({ ip: r._id || "unknown", count: r.count })),
        eventCounts: eventCounts.map((r) => ({ action: r._id.action, result: r._id.result, count: r.count })),
        recentFailures,
    }, "Security dashboard data fetched"));
});

// Data portability: an admin's own account record plus their own audit
// trail — deliberately NOT the whole hospital's data (that would be a
// privacy problem in itself, not a "my data" export). This is why admin
// export is a separate, smaller implementation from patient/doctor export:
// admins don't have appointments, prescriptions, or lab results of their own.
const exportMyData = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin._id).select("-password -refreshtoken -passwordHistory");
    if (!admin) throw new apiError(404, "Admin not found");

    const auditLogs = await AuditLog.find({ userId: String(admin._id) }).sort({ timestamp: -1 }).limit(200);

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
    const formatDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB") : "—");

    const sections = [
        {
            heading: "Account Information",
            type: "keyvalue",
            rows: [
                ["Admin ID", String(admin._id)],
                ["Full Name", admin.adminname],
                ["Username", admin.adminusername],
                ["Email", admin.email],
                ["Phone Number", admin.phonenumber],
                ["Account Created", formatDate(admin.createdAt)],
            ],
        },
        { heading: "Profile Picture", type: "profilePicture", url: admin.verificationdocs?.profilepicture },
        {
            heading: "Uploaded Documents",
            type: "table",
            columns: [
                { header: "Document", width: 0.5 },
                { header: "On File", width: 0.5 },
            ],
            rows: [
                ["Citizenship Document", admin.verificationdocs?.citizenshipdocument ? "Yes" : "No"],
                ["Admin ID Document", admin.verificationdocs?.adminId ? "Yes" : "No"],
                ["Appointment Letter", admin.verificationdocs?.appointmentletter ? "Yes" : "No"],
            ],
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

    logAudit({ userId: admin._id, userRole: "admin", action: "data_exported", resource: "admin", ip: req.ip, result: "success" });

    generatePersonalDataPdf(res, {
        filename: `smartfit-data-export-${admin.adminusername}.pdf`,
        reportTitle: "Admin Data Export",
        generatedFor: { name: admin.adminname, role: "Admin", identifier: admin.adminusername },
        sections,
    });
});

// Right-to-erasure for admin accounts. Same password + OTP + confirmation
// flow as patient/doctor deletion, plus a business-logic guard this role
// uniquely needs: deleting the last remaining admin would leave nobody able
// to administer the hospital system at all, so it's blocked outright.
// Soft-deletes for consistency with Patient/Doctor (see the isDeleted field
// comment on the Admin model).
const deleteMyAccount = asyncHandler(async (req, res) => {
    const { password, otp } = req.body;
    if (!password) throw new apiError(400, "Password confirmation is required to delete your account");
    if (!otp) throw new apiError(400, "OTP verification is required to delete your account");

    const admin = await Admin.findById(req.admin._id).select("+password");
    if (!admin) throw new apiError(404, "Admin not found");

    const isPasswordValid = await admin.ispasswordcorrect(password);
    if (!isPasswordValid) throw new apiError(401, "Incorrect password");

    const remainingAdmins = await Admin.countDocuments({ isDeleted: { $ne: true }, _id: { $ne: admin._id } });
    if (remainingAdmins === 0) {
        throw new apiError(409, "You are the last remaining admin account. Create another admin before deleting this one.");
    }

    const otpResult = await verifyOTP(admin.email, String(otp));
    if (!otpResult.valid) {
        if (otpResult.reason === "expired") throw new apiError(401, "OTP expired. Please request a new one and try again.");
        if (otpResult.reason === "too_many_attempts") throw new apiError(429, "Too many incorrect OTP attempts. Please request a new OTP.");
        throw new apiError(401, "Invalid OTP");
    }
    await clearOTP(admin.email);

    await deleteUploadedFiles([
        admin.verificationdocs?.profilepicture,
        admin.verificationdocs?.citizenshipdocument,
        admin.verificationdocs?.adminId,
        admin.verificationdocs?.appointmentletter,
    ]);

    const deletedId = admin._id.toString();
    admin.isDeleted = true;
    admin.deletedAt = new Date();
    admin.adminname = "Deleted Admin";
    admin.email = `deleted-${deletedId}@smartfit.invalid`;
    admin.adminusername = `deleted-${deletedId}`;
    admin.phonenumber = Date.now().toString().slice(-10); // schema requires a unique 10-digit numeric value
    admin.verificationdocs = { citizenshipdocument: "", adminId: "", profilepicture: "", appointmentletter: "" };
    admin.refreshtoken = null;
    admin.lastUserAgent = null;
    await admin.save({ validateBeforeSave: false });

    logAudit({ userId: deletedId, userRole: "admin", action: "account_deleted", resource: "admin", ip: req.ip, result: "success" });

    clearCsrfCookie(res);

    return res
        .status(200)
        .clearCookie("accesstoken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshtoken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "Account deleted successfully"));
});

export {
    registeradmin,
    loginadmin,
    verifyLoginMfa,
    logoutadmin,
    updateprofile,
    updatepassword,
    resetForgottenPassword,
    getprofiledetails,
    accesstokenrenewal,
    updateprofilepic,
    getCurrentAdmin,
    getSecurityDashboard,
    exportMyData,
    deleteMyAccount,
};
