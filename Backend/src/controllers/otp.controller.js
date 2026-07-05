import sendMail from "../services/mail.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import generateOtp from "../utils/otpgenerator.js";
import { saveOTP, getOTP, clearOTP } from "../services/otp.js";
import { forgetpasswordotptemplate, otpTemplate } from "../utils/emailtemplate.js";
import jwt from "jsonwebtoken"

const isProduction = process.env.NODE_ENV === "production";

const sendotp = asyncHandler(async (req, res) => {
    const email = req.patient?.email ;
    if (!email) {
        throw new apiError(400, "email is not found from any user or user is not logged in");
    }
    const otp = generateOtp();

    const response = await sendMail({
        to: email,
        subject: "SmartFit OTP Verification",
        html: otpTemplate(otp),
    });
    if (!response) {
        throw new apiError(500, "Failed to send OTP");
    }
    saveOTP(email, otp);
    return res.status(200)
        .json(new apiResponse(200, {}, "OTP sent successfully"));
})

const verifyotp = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const email = req.patient?.email;
    if (!email) {
        throw new apiError(400, "Email is not found from any user or user is not logged in");
    }
    if (!otp) {
        throw new apiError(400, " OTP is required");
    }
    
    const storedotp = getOTP(email);
    if (!storedotp) {
        throw new apiError(404, "OTP not found or expired");
    }
    
    if (storedotp !== otp) {
        throw new apiError(401, "Invalid OTP");
    }
    
    clearOTP(email);
    return res.status(200)
    .json(new apiResponse(200, {}, "OTP verified successfully"));
    
});
const sendForgetPasswordOtp = asyncHandler(async (req, res) => {
    const { email, phonenumber } = req.body;
    if (!email && !phonenumber) {
        throw new apiError(400, "Email or phone number is required");
    }
    const query = email ? { email } : { phonenumber };
    const patient = await Patient.findOne(query);
    if (!patient) {
        throw new apiError(404, "User not found");
    }
    let user = {}
    if (patient) { user.id = patient._id, user.role = "patient", user.email = patient.email }


    const tempToken = jwt.sign(
        {
            _id: user.id,
            role: user.role
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "5m" }
    );

    const otp = generateOtp();

    const response = await sendMail({
        to: user.email,
        subject: "Your SmartFit OTP Code to Reset Password",
        html: forgetpasswordotptemplate(otp),
    });
    if (!response) {
        throw new apiError(500, "Failed to send OTP");
    }
    saveOTP(user.email, otp);
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
        path: "/",
    }
    return res.status(200).cookie("tempToken", tempToken, options)
        .json(new apiResponse(200, tempToken, "OTP sent successfully"));
})
const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    if (!otp) throw new apiError(400, " OTP is required");

    const storedotp = getOTP(req.user?.email);
    if (!storedotp || storedotp !== otp) throw new apiError(401, "Invalid or expired OTP");

    clearOTP(req.user?.email);
    return res.status(200).json(new apiResponse(200, {}, "otp verified successfully"))
});


export { sendotp, verifyotp, verifyForgotPasswordOtp, sendForgetPasswordOtp };
