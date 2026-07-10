import { AuditLog } from "../models/auditLog.model.js";

export const logAudit = async ({ userId, userRole, action, resource, ip, result, metadata } = {}) => {
    try {
        await AuditLog.create({
            userId: userId ? String(userId) : "anonymous",
            userRole: userRole || "unknown",
            action,
            resource: resource || "",
            ip: ip || "",
            result,
            metadata: metadata || {},
        });
    } catch (err) {
        console.error("Audit log write failed:", err.message);
    }
};
