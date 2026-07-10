import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, index: true },
    userId: { type: String, default: "anonymous" },
    userRole: { type: String, default: "unknown" },
    action: { type: String, required: true, index: true },
    resource: { type: String, default: "" },
    ip: { type: String, default: "" },
    result: { type: String, enum: ["success", "failure"], required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: false });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
