import bcrypt from "bcrypt";
import { Otp } from "../models/otp.model.js";

const MAX_ATTEMPTS = 5;
const OTP_BCRYPT_ROUNDS = 6; // Low rounds — OTPs are short-lived, speed matters here.

export const saveOTP = async (email, otp, ttl = 5 * 60 * 1000) => {
    const hash = await bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + ttl);
    await Otp.findOneAndUpdate(
        { email },
        { hash, attempts: 0, expiresAt },
        { upsert: true, new: true }
    );
};

export const verifyOTP = async (email, otp) => {
    const entry = await Otp.findOne({ email });
    if (!entry) return { valid: false, reason: "expired" };

    if (Date.now() > entry.expiresAt.getTime()) {
        await Otp.deleteOne({ email });
        return { valid: false, reason: "expired" };
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
        await Otp.deleteOne({ email });
        return { valid: false, reason: "too_many_attempts" };
    }

    entry.attempts += 1;
    await entry.save();

    const match = await bcrypt.compare(String(otp), entry.hash);
    if (!match) return { valid: false, reason: "invalid" };

    return { valid: true };
};

export const clearOTP = async (email) => {
    await Otp.deleteOne({ email });
};


// import bcrypt from "bcrypt";
// import redis from "./redisClient.js";

// // Stores { hash, attempts, expiresAt } keyed by email.
// // OTPs are hashed before storage so plaintext is never at rest in memory.
// const otpMap = new Map();
 
// const MAX_ATTEMPTS = 5;
// const OTP_BCRYPT_ROUNDS = 6; // Low rounds — OTPs are short-lived, speed matters here.
 
// export const saveOTP = async (email, otp, ttl = 2 * 60 * 1000) => {
//     const hash = await bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
//     const expiresAt = Date.now() + ttl;
//     otpMap.set(email, { hash, attempts: 0, expiresAt });
//     setTimeout(() => otpMap.delete(email), ttl);
// };

// export const verifyOTP = async (email, otp) => {
//     const entry = otpMap.get(email);
//     if (!entry) return { valid: false, reason: "expired" };

//     if (Date.now() > entry.expiresAt) {
//         otpMap.delete(email);
//         return { valid: false, reason: "expired" };
//     }

//     if (entry.attempts >= MAX_ATTEMPTS) {
//         otpMap.delete(email);
//         return { valid: false, reason: "too_many_attempts" };
//     }

//     entry.attempts += 1;

//     const match = await bcrypt.compare(String(otp), entry.hash);
//     if (!match) return { valid: false, reason: "invalid" };

//     return { valid: true };
// };

// export const clearOTP = (email) => otpMap.delete(email);

