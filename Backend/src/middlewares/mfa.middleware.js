import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { Patient } from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Admin } from "../models/admin.model.js";

// Validates the short-lived mfaToken cookie set during the first login step.
export const verifyMfaToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.mfaToken;
    if (!token) throw new apiError(401, "MFA session not found. Please log in again.");

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        throw new apiError(401, "MFA session expired. Please log in again.");
    }

    let user;
    if (decoded.role === "patient") {
        user = await Patient.findById(decoded._id).select("+loginAttempts +lockedUntil +passwordChangedAt");
        if (!user) throw new apiError(404, "Patient not found.");
        req.patient = user;
    } else if (decoded.role === "doctor") {
        user = await Doctor.findById(decoded._id).select("+loginAttempts +lockedUntil +passwordChangedAt");
        if (!user) throw new apiError(404, "Doctor not found.");
        req.doctor = user;
    } else if (decoded.role === "admin") {
        user = await Admin.findById(decoded._id).select("+loginAttempts +lockedUntil +passwordChangedAt");
        if (!user) throw new apiError(404, "Admin not found.");
        req.admin = user;
    } else {
        throw new apiError(401, "Invalid MFA session.");
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
});
