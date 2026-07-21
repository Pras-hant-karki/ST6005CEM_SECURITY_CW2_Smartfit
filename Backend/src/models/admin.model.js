import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const adminDocumentSchema = new Schema(
  {
    citizenshipdocument: { type: String, required: true },
    adminId: { type: String, required: true },
    profilepicture: { type: String, required: true },
    appointmentletter: { type: String, required: true },
  },
  { _id: false }
);

const adminSchema = new Schema(
  {
    adminname: { type: String, required: true, trim: true },
    adminusername: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 12, select: false },
    phonenumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[0-9]{10}$/,
    },
    verificationdocs: { type: adminDocumentSchema, required: true },
    refreshtoken: { type: String, select: false },
    lastUserAgent: { type: String, default: null, select: false },
    loginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
    passwordChangedAt: { type: Date, select: false },
    passwordHistory: { type: [String], default: [], select: false },
    // Soft delete: kept as a tombstone document (never hard-deleted) so any
    // AuditLog/history referencing this admin's id stays meaningful. See
    // deleteMyAccount in admin.controller.js — blocked outright if this
    // would remove the last remaining admin.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

adminSchema.methods.ispasswordcorrect = function (password) {
  return bcrypt.compare(password, this.password);
};

adminSchema.methods.generateaccesstoken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      adminname: this.adminname,
      adminusername: this.adminusername,
      role: "admin", // specified role
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

adminSchema.methods.generaterefreshtoken = function () {
  return jwt.sign(
    { _id: this._id, role: "admin" }, // specified role
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const Admin = mongoose.model("Admin", adminSchema);
