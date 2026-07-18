import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const doctorDocumentSchema = new Schema(
  {
    citizenshipdocument: { type: String, default: "" },
    medicaldegree: { type: String, default: "" },
    medicallicense: { type: String, default: "" },
    profilepicture: { type: String, default: "" },
  },
  { _id: false }
);

const timeSchema = new Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    starttime: { type: String, required: true, trim: true },
    endtime: { type: String, required: true, trim: true },
    patientslot: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const doctorSchema = new Schema(
  {
    doctorname: { type: String, required: true, trim: true, index: true },
    doctorusername: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phonenumber: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          return !value || /^[0-9]{10}$/.test(value);
        },
        message: "Phone number must be 10 digits",
      },
    },
    sex: { type: String, enum: ["Male", "Female", "Others", ""], default: "" },
    age: { type: Number, min: 0, default: 0 },
    verificationdocument: { type: doctorDocumentSchema, default: () => ({}) },
    experience: { type: Number, min: 0, default: 0 },
    qualification: { type: String, trim: true, default: "" },
    consultationfee: { type: Number, required: true, min: 0, default: 0 },
    shift: { type: [timeSchema], default: [] },
    department: { type: String, trim: true, default: "" },
    specialization: { type: String, trim: true, default: "" },
    refreshtoken: { type: String, select: false },
    loginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
    
    passwordChangedAt: { type: Date, select: false },
    passwordHistory: { type: [String], default: [], select: false }, 
    isApproved: { type: Boolean, default: false }, // Admin approval needed for doctor accounts
  },
  { timestamps: true }
);

doctorSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

doctorSchema.methods.ispasswordcorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

doctorSchema.methods.generateaccesstoken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      doctorname: this.doctorname,
      doctorusername: this.doctorusername,
      role: "doctor", // specified role 
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

doctorSchema.methods.generaterefreshtoken = function () {
  return jwt.sign(
    { _id: this._id, role: "doctor" },  // specified role
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const Doctor = mongoose.model("Doctor", doctorSchema);
