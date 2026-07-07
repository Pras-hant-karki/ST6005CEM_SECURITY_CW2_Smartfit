import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify";

export const verifyCaptcha = asyncHandler(async (req, res, next) => {
    const secret = process.env.HCAPTCHA_SECRET_KEY;
    if (!secret) {
        console.warn("[CAPTCHA] HCAPTCHA_SECRET_KEY not configured — verification skipped. Set this variable in production.");
        return next();
    }

    const token = req.body["h-captcha-response"];
    if (!token) {
        return res.status(200).json(
            new apiResponse(200, { captchaRequired: true }, "Please complete CAPTCHA verification.")
        );
    }

    const params = new URLSearchParams({ secret, response: token });
    let data;
    try {
        const response = await fetch(HCAPTCHA_VERIFY_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        data = await response.json();
    } catch {
        throw new apiError(503, "CAPTCHA verification service unavailable. Please try again.");
    }

    if (!data.success) {
        throw new apiError(400, "CAPTCHA verification failed. Please try again.");
    }

    next();
});
