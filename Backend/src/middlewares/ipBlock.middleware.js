import { isIpBlocked } from "../utils/rateStore.js";

// Rejects requests from an IP that has caused repeated account lockouts.
// Runs first in the middleware chain so a blocked IP is turned away before
// it reaches CORS, body parsing, or any route logic.
export const ipBlockMiddleware = (req, res, next) => {
    if (isIpBlocked(req.ip)) {
        return res.status(403).json({ statusCode: 403, message: "Access temporarily denied. Please try again later." });
    }
    next();
};
