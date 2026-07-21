import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { Doctor } from "../models/doctor.model.js";
import { Admin } from "../models/admin.model.js";
import { Patient } from "../models/patient.model.js";

const verifyAuth = (desiredRole) => asyncHandler(async (req, res, next) => {
  const candidateTokens = [
    req.cookies?.accesstoken,
    req.cookies?.accessToken,
    req.header("Authorization")?.replace("Bearer ", ""),
  ].filter(Boolean);

  if (candidateTokens.length === 0) throw new apiError(401, "Unauthorized request");

  let decoded;
  for (const token of candidateTokens) {
    try {
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (!desiredRole || payload.role === desiredRole) {
        decoded = payload;
        break;
      }
    } catch {
    }
  }

  if (!decoded) {
    throw new apiError(401, desiredRole ? `${desiredRole} session required` : "Unauthorized request");
  }

  let user;

  if (decoded.role === "doctor") {
    user = await Doctor.findById(decoded._id);
    if (!user) throw new apiError(401, "Invalid token");
    req.doctor = user;
  } else if (decoded.role === "admin") {
    user = await Admin.findById(decoded._id);
    if (!user) throw new apiError(401, "Invalid token");
    req.admin = user;
  } else if (decoded.role === "patient") {
    user = await Patient.findById(decoded._id);
    if (!user) throw new apiError(401, "Invalid token");
    req.patient = user;
  } else {
    throw new apiError(401, "Invalid role");
  }

  // A still-unexpired access token issued before a since-completed account
  // deletion must not keep working — the token's signature is still valid,
  // but the account behind it no longer is.
  if (user.isDeleted) throw new apiError(401, "This account has been deleted");

  req.userRole = decoded.role;
  next();
});

const requireRole = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      throw new apiError(403, `${roles.join(" or ")} access required`);
    }
    next();
  });

export { verifyAuth, requireRole };
