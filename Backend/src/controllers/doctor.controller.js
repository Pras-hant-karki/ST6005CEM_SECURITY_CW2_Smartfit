import { asyncHandler } from "../utils/asynchandler.js";
import { Doctor } from "../models/doctor.model.js";
import { apiError } from "../utils/apiError.js";
import { uploadLocal } from "../utils/localUpload.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import sendMail from "../services/mail.js";
import { welcomeemailtemplate, logintemplate } from "../utils/emailtemplate.js";
import { validatePassword } from "../utils/passwordValidator.js";
import { trackAttempt, trackLockout, blockIp } from "../utils/rateStore.js";
import { verifyCaptchaToken } from "../middlewares/captcha.middleware.js";
import { logAudit } from "../services/auditLog.service.js";
import { saveOTP, verifyOTP, clearOTP } from "../services/otp.js";
import generateOtp from "../utils/otpgenerator.js";
import { issueCsrfCookie, clearCsrfCookie } from "../utils/csrf.js";
import bcrypt from "bcrypt";

const sendDoctorMail = async (mailOptions) => {
    try {
        await sendMail(mailOptions);
    } catch (error) {
        console.error("Doctor email notification failed:", error.message);
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
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;
const PASSWORD_EXPIRY_DAYS = 90;

const generateaccesstokenandrefreshtoken = async (doctorId, userAgent) => {
    // BUG-001 fix: select "+refreshtoken" to allow comparison on renewal.
    const doctor = await Doctor.findById(doctorId).select("+refreshtoken");
    const accesstoken = doctor.generateaccesstoken();
    const refreshtoken = doctor.generaterefreshtoken();

    doctor.refreshtoken = refreshtoken;
    if (userAgent) doctor.lastUserAgent = userAgent;
    await doctor.save({ validateBeforeSave: false });

    return { accesstoken, refreshtoken };
};

const checkPasswordHistory = async (plaintext, passwordHistory = []) => {
    for (const oldHash of passwordHistory) {
        if (await bcrypt.compare(plaintext, oldHash)) return true;
    }
    return false;
};

const parseShiftArray = (shift) => {
    if (!shift) return [];
    let parsedShift;
    try {
        parsedShift = Array.isArray(shift) ? shift : JSON.parse(shift);
    } catch {
        throw new apiError(400, "Invalid format for 'shift'. Must be a valid JSON array.");
    }
    if (!Array.isArray(parsedShift)) throw new apiError(400, "Invalid format for 'shift'. Must be a valid JSON array.");
    return parsedShift;
};

const generateDoctorUsername = async (email) => {
    const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) || "doctor";
    let candidate = base;
    let suffix = 1;
    while (await Doctor.exists({ doctorusername: candidate })) {
        candidate = `${base}${suffix}`;
        suffix += 1;
    }
    return candidate;
};

const uploadOptionalDoctorFiles = async (files = {}) => {
    const citizenshipDocumentBuffer = files?.citizenshipdocument?.[0]?.buffer;
    const medicalDegreeBuffer = files?.medicaldegree?.[0]?.buffer;
    const medicalLicenseBuffer = files?.medicallicense?.[0]?.buffer;
    const profilePictureBuffer = files?.profilepicture?.[0]?.buffer;

    const [citizenshipdocument, medicaldegree, medicallicense, profilepicture] = await Promise.all([
        citizenshipDocumentBuffer ? uploadLocal(citizenshipDocumentBuffer, "doctors/citizenship-document") : null,
        medicalDegreeBuffer ? uploadLocal(medicalDegreeBuffer, "doctors/medical-degree") : null,
        medicalLicenseBuffer ? uploadLocal(medicalLicenseBuffer, "doctors/medical-license") : null,
        profilePictureBuffer ? uploadLocal(profilePictureBuffer, "doctors/profile-picture") : null,
    ]);

    return {
        citizenshipdocument: citizenshipdocument?.secure_url || "",
        medicaldegree: medicaldegree?.secure_url || "",
        medicallicense: medicallicense?.secure_url || "",
        profilepicture: profilepicture?.secure_url || "",
    };
};

const createDoctorByAdmin = asyncHandler(async (req, res) => {
    const {
        doctorname, email, password, phonenumber, sex, age, experience,
        qualification, consultationfee, department, specialization, shift,
    } = req.body;

    if ([doctorname, email, password, consultationfee].some((f) => f === undefined || String(f).trim() === "")) {
        throw new apiError(400, "Doctor name, email, password, and consultation fee are required");
    }

    const passwordError = validatePassword(password);
    if (passwordError) throw new apiError(400, passwordError);

    const parsedFee = Number(consultationfee);
    if (Number.isNaN(parsedFee) || parsedFee < 0) throw new apiError(400, "Consultation fee must be a valid positive number");
    if (phonenumber && !/^[0-9]{10}$/.test(phonenumber)) throw new apiError(400, "Phone number must be 10 digits");

    const parsedAge = age !== undefined && age !== "" ? Number(age) : 0;
    if (Number.isNaN(parsedAge) || parsedAge < 0) throw new apiError(400, "Age must be a valid positive number");
    const parsedExperience = experience !== undefined && experience !== "" ? Number(experience) : 0;
    if (Number.isNaN(parsedExperience) || parsedExperience < 0) throw new apiError(400, "Experience must be a valid positive number");

    const existeddoctor = await Doctor.findOne({ email: email.trim().toLowerCase() });
    if (existeddoctor) throw new apiError(409, "Doctor with same email already exists");

    const doctorusername = await generateDoctorUsername(email);
    const verificationdocument = await uploadOptionalDoctorFiles(req.files);
    const shiftarray = parseShiftArray(shift);

    const doctor = await Doctor.create({
        doctorname: doctorname.trim(),
        doctorusername,
        email: email.trim().toLowerCase(),
        password,
        phonenumber: phonenumber?.trim() || "",
        sex: sex === "Other" ? "Others" : sex || "",
        age: parsedAge,
        verificationdocument,
        experience: parsedExperience,
        qualification: qualification?.trim() || "",
        consultationfee: parsedFee,
        department: department?.trim().toLowerCase() || "",
        specialization: specialization?.trim() || "",
        shift: shiftarray,
        passwordChangedAt: new Date(),
    });

    const createddoctor = await Doctor.findById(doctor._id).select("-password -refreshtoken -passwordHistory");
    if (!createddoctor) throw new apiError(500, "Doctor creation failed");

    sendDoctorMail({
        to: createddoctor.email,
        subject: "Your SmartFit Doctor Account Credentials",
        html: `<p>Hello ${createddoctor.doctorname},</p><p>Your SmartFit doctor account has been created. Please log in and change your password immediately.</p><p><strong>Email:</strong> ${createddoctor.email}</p>`,
    });

    logAudit({ userId: req.admin?._id, userRole: "admin", action: "admin_created_doctor", resource: `doctor/${doctor._id}`, ip: req.ip, result: "success", metadata: { doctorId: doctor._id } });

    return res.status(201).json(new apiResponse(201, createddoctor, "Doctor created successfully"));
});

const deleteDoctorByAdmin = asyncHandler(async (req, res) => {
    const { doctorid } = req.params;
    const deletedDoctor = await Doctor.findByIdAndDelete(doctorid).select("-password -refreshtoken");
    if (!deletedDoctor) throw new apiError(404, "Doctor not found");
    logAudit({ userId: req.admin?._id, userRole: "admin", action: "admin_deleted_doctor", resource: `doctor/${doctorid}`, ip: req.ip, result: "success", metadata: { doctorId: doctorid } });
    return res.status(200).json(new apiResponse(200, deletedDoctor, "Doctor deleted successfully"));
});

const updateDoctorByAdmin = asyncHandler(async (req, res) => {
    const { doctorid } = req.params;
    const {
        doctorname, email, password, phonenumber, sex, age, experience,
        qualification, consultationfee, department, specialization, shift,
    } = req.body;

    const doctor = await Doctor.findById(doctorid).select("+password +passwordHistory");
    if (!doctor) throw new apiError(404, "Doctor not found");

    if (email && email.trim().toLowerCase() !== doctor.email) {
        const existing = await Doctor.findOne({ email: email.trim().toLowerCase(), _id: { $ne: doctorid } });
        if (existing) throw new apiError(409, "Doctor with same email already exists");
        doctor.email = email.trim().toLowerCase();
    }

    if (doctorname !== undefined && doctorname.trim() !== "") doctor.doctorname = doctorname.trim();

    if (password !== undefined && password !== "") {
        const passwordError = validatePassword(password);
        if (passwordError) throw new apiError(400, passwordError);
        const updatedHistory = [doctor.password, ...(doctor.passwordHistory || [])].slice(0, 5);
        doctor.passwordHistory = updatedHistory;
        doctor.password = password;
        doctor.passwordChangedAt = new Date();
    }

    if (phonenumber !== undefined) {
        if (phonenumber && !/^[0-9]{10}$/.test(phonenumber)) throw new apiError(400, "Phone number must be 10 digits");
        doctor.phonenumber = phonenumber?.trim() || "";
    }
    if (sex !== undefined) doctor.sex = sex === "Other" ? "Others" : sex || "";
    if (age !== undefined && age !== "") {
        const parsedAge = Number(age);
        if (Number.isNaN(parsedAge) || parsedAge < 0) throw new apiError(400, "Age must be a valid positive number");
        doctor.age = parsedAge;
    }
    if (experience !== undefined && experience !== "") {
        const parsedExperience = Number(experience);
        if (Number.isNaN(parsedExperience) || parsedExperience < 0) throw new apiError(400, "Experience must be valid");
        doctor.experience = parsedExperience;
    }
    if (consultationfee !== undefined && consultationfee !== "") {
        const parsedFee = Number(consultationfee);
        if (Number.isNaN(parsedFee) || parsedFee < 0) throw new apiError(400, "Consultation fee must be valid");
        doctor.consultationfee = parsedFee;
    }
    if (qualification !== undefined) doctor.qualification = qualification?.trim() || "";
    if (department !== undefined) doctor.department = department?.trim().toLowerCase() || "";
    if (specialization !== undefined) doctor.specialization = specialization?.trim() || "";
    if (shift !== undefined) doctor.shift = parseShiftArray(shift);

    const uploadedDocs = await uploadOptionalDoctorFiles(req.files);
    Object.entries(uploadedDocs).forEach(([key, value]) => {
        if (value) doctor.verificationdocument[key] = value;
    });

    await doctor.save();

    const updatedDoctor = await Doctor.findById(doctor._id).select("-password -refreshtoken -passwordHistory");
    logAudit({ userId: req.admin?._id, userRole: "admin", action: "admin_updated_doctor", resource: `doctor/${doctorid}`, ip: req.ip, result: "success", metadata: { doctorId: doctorid } });
    return res.status(200).json(new apiResponse(200, updatedDoctor, "Doctor updated successfully"));
});

const REG_WINDOW_MS = 10 * 60 * 1000;
const REG_LIMIT = 5;

const registerdoctor = asyncHandler(async (req, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    if (trackAttempt(`reg:${clientIp}`, REG_WINDOW_MS, REG_LIMIT)) {
        const token = req.body["h-captcha-response"];
        if (!token) return res.status(200).json(new apiResponse(200, { captchaRequired: true }, "Please complete CAPTCHA verification."));
        await verifyCaptchaToken(token);
    }

    const { doctorname, doctorusername, email, password, phonenumber, sex, age, experience, qualification, department, specialization, shift } = req.body;

    if ([doctorname, doctorusername, email, password, phonenumber, sex, age, experience, qualification, department, specialization, shift].some(
        (field) => !field || String(field).trim() === ""
    )) {
        throw new apiError(400, "All fields are required");
    }

    const passwordError = validatePassword(password);
    if (passwordError) throw new apiError(400, passwordError);

    const existeddoctor = await Doctor.findOne({ $or: [{ doctorusername }, { email }] });
    if (existeddoctor) throw new apiError(409, "Doctor with same email or username already exists");

    const citizenshipDocumentBuffer = req.files?.citizenshipdocument?.[0]?.buffer;
    const medicalDegreeBuffer = req.files?.medicaldegree?.[0]?.buffer;
    const medicalLicenseBuffer = req.files?.medicallicense?.[0]?.buffer;
    const profilePictureBuffer = req.files?.profilepicture?.[0]?.buffer;

    if (!citizenshipDocumentBuffer || !medicalDegreeBuffer || !medicalLicenseBuffer || !profilePictureBuffer) {
        throw new apiError(400, "All files are required");
    }

    const citizenshipdocument = await uploadLocal(citizenshipDocumentBuffer, "doctors/citizenship-document");
    const medicaldegree = await uploadLocal(medicalDegreeBuffer, "doctors/medical-degree");
    const medicallicense = await uploadLocal(medicalLicenseBuffer, "doctors/medical-license");
    const profilepicture = await uploadLocal(profilePictureBuffer, "doctors/profile-picture");

    if (!citizenshipdocument || !medicaldegree || !medicallicense || !profilepicture) {
        throw new apiError(500, "File upload failed");
    }

    const shiftarray = parseShiftArray(shift);
    const doctor = await Doctor.create({
        doctorname,
        doctorusername,
        email,
        password,
        phonenumber,
        sex,
        age,
        verificationdocument: {
            citizenshipdocument: citizenshipdocument.secure_url,
            medicaldegree: medicaldegree.secure_url,
            medicallicense: medicallicense.secure_url,
            profilepicture: profilepicture.secure_url,
        },
        experience,
        qualification,
        department: department.toLowerCase(),
        specialization,
        shift: shiftarray,
        passwordChangedAt: new Date(),
        isApproved: false,
    });

    if (!doctor) throw new apiError(500, "Doctor registration failed");

    const createddoctor = await Doctor.findById(doctor._id).select("-password -refreshtoken -passwordHistory");
    if (!createddoctor) throw new apiError(500, "Doctor not found");

    sendDoctorMail({
        to: email,
        subject: `Welcome to SmartFit, ${createddoctor.doctorname}! Your Registration is Successful`,
        html: welcomeemailtemplate(createddoctor.doctorname),
    });

    return res.status(201).json(new apiResponse(201, createddoctor, "Doctor registered successfully"));
});

const logindoctor = asyncHandler(async (req, res) => {
    const { email, doctorusername, password } = req.body;
    if (!email && !doctorusername) throw new apiError(400, "Email or username is required");
    if (!password) throw new apiError(400, "Password is required");

    const doctor = await Doctor.findOne({
        $or: [{ email }, { doctorusername }],
    }).select("+password +loginAttempts +lockedUntil +passwordChangedAt");

    if (!doctor) throw new apiError(401, "Invalid credentials");
    if (!doctor.isApproved) throw new apiError(403, "Account pending admin approval");
    // admin approval status visible
    if (doctor.lockedUntil && doctor.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((doctor.lockedUntil - Date.now()) / 60000);
        throw new apiError(423, `Account locked. Try again in ${minutesLeft} minute(s).`);
    }

    // Adaptive CAPTCHA: enforce after 3 failed attempts
    const captchaSecret = process.env.HCAPTCHA_SECRET_KEY;
    if (captchaSecret && (doctor.loginAttempts || 0) >= 3) {
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

    const isPasswordValid = await doctor.ispasswordcorrect(password);
    if (!isPasswordValid) {
        doctor.loginAttempts = (doctor.loginAttempts || 0) + 1;
        if (doctor.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            doctor.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
            if (trackLockout(req.ip)) blockIp(req.ip);
        }
        await doctor.save({ validateBeforeSave: false });
        logAudit({ userId: doctor._id, userRole: "doctor", action: "login_failed", resource: "doctor", ip: req.ip, result: "failure", metadata: { reason: "invalid_password" } });
        throw new apiError(401, "Invalid credentials");
    }

    doctor.loginAttempts = 0;
    doctor.lockedUntil = null;
    await doctor.save({ validateBeforeSave: false });

    if (doctor.passwordChangedAt) {
        const daysSinceChange = (Date.now() - doctor.passwordChangedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceChange > PASSWORD_EXPIRY_DAYS) {
            const tempToken = jwt.sign(
                { _id: doctor._id, role: "doctor" },
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
        { _id: doctor._id, role: "doctor" },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "5m" }
    );

    const otp = generateOtp();
    await saveOTP(doctor.email, otp);

    sendDoctorMail({
        to: doctor.email,
        subject: "SmartFit — Login Verification Code",
        html: `<p>Your SmartFit login verification code is: <strong>${otp}</strong></p><p>It expires in 5 minutes. Do not share it.</p>`,
    });

    logAudit({ userId: doctor._id, userRole: "doctor", action: "login_mfa_initiated", resource: "doctor", ip: req.ip, result: "success" });

    return res
        .status(200)
        .cookie("mfaToken", mfaToken, { ...CLEAR_COOKIE_OPTIONS, maxAge: 5 * 60 * 1000 })
        .json(new apiResponse(200, { mfaRequired: true }, "OTP sent to registered email."));
});

const verifyLoginMfa = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    if (!otp) throw new apiError(400, "OTP is required");

    const doctor = req.doctor;

    const result = await verifyOTP(doctor.email, otp);
    if (!result.valid) {
        logAudit({ userId: doctor._id, userRole: "doctor", action: "mfa_failed", resource: "doctor", ip: req.ip, result: "failure", metadata: { reason: result.reason } });
        if (result.reason === "expired") throw new apiError(401, "OTP expired. Please log in again.");
        if (result.reason === "too_many_attempts") throw new apiError(429, "Too many OTP attempts. Please log in again.");
        throw new apiError(401, "Invalid OTP");
    }
    clearOTP(doctor.email);

    const { accesstoken, refreshtoken } = await generateaccesstokenandrefreshtoken(doctor._id, req.headers["user-agent"]);
    const loggedindoctor = await Doctor.findById(doctor._id).select("-password -refreshtoken -passwordHistory");

    sendDoctorMail({
        to: doctor.email,
        subject: "Login Alert – SmartFit Account Accessed Successfully",
        html: logintemplate(doctor.doctorname),
    });

    logAudit({ userId: doctor._id, userRole: "doctor", action: "login_success", resource: "doctor", ip: req.ip, result: "success" });

    // Rotate the CSRF token on login — the anonymous token issued before
    // authentication is discarded in favor of one tied to this new session.
    issueCsrfCookie(res);

    return res
        .status(200)
        .clearCookie("mfaToken", CLEAR_COOKIE_OPTIONS)
        .cookie("accesstoken", accesstoken, ACCESS_COOKIE_OPTIONS)
        .cookie("refreshtoken", refreshtoken, REFRESH_COOKIE_OPTIONS)
        .json(new apiResponse(200, { user: loggedindoctor }, "Login successful"));
});

const logoutdoctor = asyncHandler(async (req, res) => {
    await Doctor.findByIdAndUpdate(req.doctor?._id, { $unset: { refreshtoken: 1 } }, { new: true });
    logAudit({ userId: req.doctor?._id, userRole: "doctor", action: "logout", resource: "doctor", ip: req.ip, result: "success" });
    clearCsrfCookie(res);
    return res
        .clearCookie("accesstoken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshtoken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "Doctor logged out successfully"));
});

const accesstokenrenewal = asyncHandler(async (req, res) => {
    // BUG-008 fix: optional chaining — req.cookies is always {}, body fallback never worked.
    const refreshtoken = req.cookies?.refreshtoken;

    if (!refreshtoken) throw new apiError(401, "Unauthorized request");

    let decodetoken;
    try {
        // BUG-007 fix: jwt.verify throws, wrap in try/catch.
        decodetoken = jwt.verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        clearCsrfCookie(res);
        throw new apiError(401, "Invalid or expired refresh token");
    }

    if (decodetoken.role !== "doctor") throw new apiError(401, "Doctor session required");

    const doctor = await Doctor.findById(decodetoken._id).select("+refreshtoken +lastUserAgent");
    if (!doctor) throw new apiError(404, "Doctor not found");

    if (doctor.refreshtoken !== refreshtoken) {
        clearCsrfCookie(res);
        throw new apiError(401, "Refresh token mismatch or already used");
    }

    const currentUserAgent = req.headers["user-agent"];
    if (doctor.lastUserAgent && currentUserAgent && doctor.lastUserAgent !== currentUserAgent) {
        doctor.refreshtoken = null;
        await doctor.save({ validateBeforeSave: false });
        logAudit({ userId: doctor._id, userRole: "doctor", action: "session_device_mismatch", resource: "doctor", ip: req.ip, result: "failure" });
        clearCsrfCookie(res);
        throw new apiError(401, "Session from a different device detected. Please log in again.");
    }

    const { accesstoken, refreshtoken: newrefreshtoken } = await generateaccesstokenandrefreshtoken(doctor._id, currentUserAgent);

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

    const doctor = await Doctor.findById(req.doctor?._id).select("+password +passwordHistory");
    if (!doctor) throw new apiError(404, "Doctor not found");

    const isOldValid = await doctor.ispasswordcorrect(oldpassword);
    if (!isOldValid) throw new apiError(401, "Old password is incorrect");

    if (await bcrypt.compare(newpassword, doctor.password)) {
        throw new apiError(400, "New password cannot be the same as the current password");
    }

    for (const oldHash of doctor.passwordHistory || []) {
        if (await bcrypt.compare(newpassword, oldHash)) {
            throw new apiError(400, "Password has been used recently. Please choose a different password.");
        }
    }

    const updatedHistory = [doctor.password, ...(doctor.passwordHistory || [])].slice(0, 5);
    doctor.passwordHistory = updatedHistory;
    doctor.passwordHistory = updatedHistory;
    doctor.password = newpassword;
    doctor.refreshtoken = null;
    doctor.passwordChangedAt = new Date();
    await doctor.save({ validateBeforeSave: false });

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

    const doctor = await Doctor.findById(req.user?._id).select("+password +passwordHistory");
    if (!doctor) throw new apiError(404, "Doctor not found");

    if (await bcrypt.compare(newpassword, doctor.password)) {
        throw new apiError(400, "New password cannot be the same as the current password");
    }
    for (const oldHash of doctor.passwordHistory || []) {
        if (await bcrypt.compare(newpassword, oldHash)) {
            throw new apiError(400, "Password has been used recently. Please choose a different password.");
        }
    }

    const updatedHistory = [doctor.password, ...(doctor.passwordHistory || [])].slice(0, 5);
    doctor.passwordHistory = updatedHistory;
    doctor.password = newpassword;
    doctor.refreshtoken = null;
    doctor.passwordChangedAt = new Date();
    await doctor.save({ validateBeforeSave: false });

    clearCsrfCookie(res);

    return res
        .status(200)
        .clearCookie("tempToken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("accesstoken", CLEAR_COOKIE_OPTIONS)
        .clearCookie("refreshtoken", CLEAR_COOKIE_OPTIONS)
        .json(new apiResponse(200, {}, "Password reset successfully. Please log in again."));
});


const getdoctorprofiledetails = asyncHandler(async (req, res) => {
    const { doctorid } = req.params;
    const doctor = await Doctor.findById(doctorid).select(
        "-password -refreshtoken -passwordHistory -verificationdocument.citizenshipdocument -verificationdocument.medicaldegree -verificationdocument.medicallicense"
    );
    if (!doctor) throw new apiError(404, "Doctor not found");
    return res.status(200).json(new apiResponse(200, doctor, "Profile fetched successfully"));
});

const getdoctorprofiledetailsprivate = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.doctor?._id).select("-password -refreshtoken -passwordHistory");
    if (!doctor) throw new apiError(404, "Doctor not found");
    return res.status(200).json(new apiResponse(200, doctor, "Profile fetched successfully"));
});

const updateprofile = asyncHandler(async (req, res) => {
    const { phonenumber, age, sex, experience, qualification, department, specialization, shift } = req.body;

    if (!phonenumber || !age || !sex || experience === undefined || experience === "" || !qualification || !department || shift === undefined) {
        throw new apiError(400, "Phone number, age, gender, experience, qualification, department, and schedule are required");
    }

    const updates = {};
    if (!/^[0-9]{10}$/.test(phonenumber)) throw new apiError(400, "Phone number must be 10 digits");
    updates.phonenumber = phonenumber;

    if (age !== undefined && age !== "") {
        const parsedAge = Number(age);
        if (Number.isNaN(parsedAge) || parsedAge < 0) throw new apiError(400, "Age must be a valid positive number");
        updates.age = parsedAge;
    }
    updates.sex = sex === "Other" ? "Others" : sex;
    if (experience !== undefined && experience !== "") {
        const parsedExperience = Number(experience);
        if (Number.isNaN(parsedExperience) || parsedExperience < 0) throw new apiError(400, "Experience must be valid");
        updates.experience = parsedExperience;
    }
    updates.qualification = qualification;
    updates.specialization = specialization || "";
    updates.department = department.toLowerCase();
    const parsedShift = parseShiftArray(shift);
    if (parsedShift.length === 0) throw new apiError(400, "At least one availability schedule is required");
    updates.shift = parsedShift;

    const updateddoctor = await Doctor.findByIdAndUpdate(
        req.doctor?._id,
        { $set: updates },
        { new: true }
    ).select("-password -refreshtoken -passwordHistory");

    if (!updateddoctor) throw new apiError(404, "Doctor not found");
    return res.status(200).json(new apiResponse(200, updateddoctor, "Profile updated successfully"));
});

const getalldoctorprofiledetails = asyncHandler(async (req, res) => {
    const raw = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    // Escape regex metacharacters to prevent ReDoS attacks
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = escaped ? { doctorname: { $regex: escaped, $options: "i" } } : {};
    const doctors = await Doctor.find(query).select(
        "doctorname specialization department qualification experience consultationfee shift verificationdocument.profilepicture"
    );
    return res.status(200).json(new apiResponse(200, doctors, "Doctor profiles fetched successfully"));
});

const updateprofilepic = asyncHandler(async (req, res) => {
    const profilepicturelocalpath = req.file?.buffer;
    if (!profilepicturelocalpath) throw new apiError(400, "Profile picture not found");

    const profilepicture = await uploadLocal(profilepicturelocalpath, "doctors/profile-picture");
    if (!profilepicture) throw new apiError(400, "Profile picture upload failed");

    const updateddoctor = await Doctor.findByIdAndUpdate(
        req.doctor?._id,
        { $set: { "verificationdocument.profilepicture": profilepicture.secure_url } },
        { new: true }
    ).select("-password -refreshtoken -passwordHistory");

    if (!updateddoctor) throw new apiError(404, "Doctor not found");
    return res.status(200).json(new apiResponse(200, updateddoctor, "Profile picture updated successfully"));
});

const updatedocument = asyncHandler(async (req, res) => {
    const citizenshipdocumentlocalpath = req.files?.citizenshipdocument?.[0]?.buffer;
    const medicaldegreelocalpath = req.files?.medicaldegree?.[0]?.buffer;
    const medicallicenselocalpath = req.files?.medicallicense?.[0]?.buffer;

    if (!citizenshipdocumentlocalpath && !medicaldegreelocalpath && !medicallicenselocalpath) {
        throw new apiError(400, "At least one document is required.");
    }

    let citizenshipdocument, medicaldegree, medicallicense;
    if (citizenshipdocumentlocalpath) citizenshipdocument = await uploadLocal(citizenshipdocumentlocalpath, "doctors/citizenship-document");
    if (medicaldegreelocalpath) medicaldegree = await uploadLocal(medicaldegreelocalpath, "doctors/medical-degree");
    if (medicallicenselocalpath) medicallicense = await uploadLocal(medicallicenselocalpath, "doctors/medical-license");

    if (!citizenshipdocument && !medicaldegree && !medicallicense) {
        throw new apiError(400, "Error while uploading new files");
    }

    const updateddoctor = await Doctor.findByIdAndUpdate(
        req.doctor?._id,
        {
            $set: {
                ...(citizenshipdocument ? { "verificationdocument.citizenshipdocument": citizenshipdocument.secure_url } : {}),
                ...(medicaldegree ? { "verificationdocument.medicaldegree": medicaldegree.secure_url } : {}),
                ...(medicallicense ? { "verificationdocument.medicallicense": medicallicense.secure_url } : {}),
            },
        },
        { new: true }
    ).select("-password -refreshtoken -passwordHistory");

    return res.status(200).json(new apiResponse(200, updateddoctor, "Document updated successfully"));
});

const getdoctorbydept = asyncHandler(async (req, res) => {
    const { deptname } = req.params;
    const doctors = await Doctor.find({ department: deptname.toLowerCase() }).select(

        "doctorname specialization department qualification experience consultationfee shift verificationdocument.profilepicture"
    );
    if (!doctors) throw new apiError(404, "No doctors found for the given department");
    return res.status(200).json(new apiResponse(200, doctors, "Doctors fetched successfully"));
});

const getCurrentDoctor = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.doctor?._id).select("-password -refreshtoken -passwordHistory");
    if (!doctor) throw new apiError(404, "Doctor not found");
    return res.status(200).json(new apiResponse(200, doctor, "Current doctor fetched successfully"));
});

export {
    registerdoctor,
    logindoctor,
    verifyLoginMfa,
    logoutdoctor,
    accesstokenrenewal,
    updatepassword,
    resetForgottenPassword,
    getdoctorprofiledetails,
    updateprofile,
    updateprofilepic,
    updatedocument,
    getalldoctorprofiledetails,
    getdoctorprofiledetailsprivate,
    getdoctorbydept,
    getCurrentDoctor,
    createDoctorByAdmin,
    deleteDoctorByAdmin,
    updateDoctorByAdmin,
};
