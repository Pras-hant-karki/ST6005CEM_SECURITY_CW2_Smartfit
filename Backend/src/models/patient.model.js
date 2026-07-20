import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const patientSchema = new Schema({
    patientname: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    patientusername: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        minlength: 12,
        required: true,
        trim: true,
        select: false,
    },
    phonenumber: {
        type: String,  
        required: true,
        maxlength: 15,
    },
        sex: {
        type: String,
        required: true,
        enum: ["Male", "Female", "Others"], 
    },

    age: {
        type: Number,
        required: true,
        min: 0,
    },
    guardianName: {
        type: String,
        trim: true,
    },
    refreshtoken: {
        type: String,
        select: false,
    },
    lastUserAgent: {
        type: String,
        default: null,
        select: false,
    },
    profilepicture: {
        type: String,
    },
    loginAttempts: {
        type: Number,
        default: 0,
        select: false,
    },
    lockedUntil: {
        type: Date,
        default: null,
        select: false,
    },
    passwordChangedAt: {
        type: Date,
        select: false,
    },
    passwordHistory: {
        type: [String],
        default: [],
        select: false,
    },
}, { timestamps: true })


patientSchema.pre("save", async function (next) {
    if (this.isModified("password"))
        this.password = await bcrypt.hash(this.password, 10)
    next()
})

patientSchema.methods.ispasswordcorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

patientSchema.methods.generateaccesstoken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        patientname: this.patientname,
        patientusername: this.patientusername,
        role: "patient" // specified role
    },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

patientSchema.methods.generaterefreshtoken = function () {
    return jwt.sign(
        { _id: this._id, role: "patient" },  // specified role
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}

export const Patient = mongoose.model("Patient", patientSchema)
