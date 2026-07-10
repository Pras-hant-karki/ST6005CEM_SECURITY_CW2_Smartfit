import { randomInt } from "crypto";

// Uses CSPRNG (crypto.randomInt) — not Math.random() which is not cryptographically secure.
const generateOtp = (length = 6) => {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[randomInt(0, digits.length)];
    }
    return otp;
};

export default generateOtp;
