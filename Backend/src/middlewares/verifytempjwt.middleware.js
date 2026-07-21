import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { Patient } from "../models/patient.model.js";
import { Admin } from "../models/admin.model.js";
import { Doctor } from "../models/doctor.model.js";

const verifyTempjwt = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.tempToken;
    if (!token) throw new apiError(401, "Authorization token missing");

    let decoded;
    try {
        // jwt.verify throws on an invalid/expired token rather than returning
        // null, so the failure case is handled in the catch block below.
        decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        throw new apiError(403, "Token invalid or expired");
    }

    let user;
    if (decoded.role === "patient") {
        user = await Patient.findById(decoded._id).select("-password -refreshtoken -passwordHistory");
        if (!user) throw new apiError(404, "Patient not found");
    } else if (decoded.role === "doctor") {
        user = await Doctor.findById(decoded._id).select("-password -refreshtoken -passwordHistory");
        if (!user) throw new apiError(404, "Doctor not found");
    } else if (decoded.role === "admin") {
        user = await Admin.findById(decoded._id).select("-password -refreshtoken -passwordHistory");
        if (!user) throw new apiError(404, "Admin not found");
    } else {
        throw new apiError(401, "Invalid token role");
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
});

export { verifyTempjwt };
