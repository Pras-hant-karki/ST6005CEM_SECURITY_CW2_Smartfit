import { apiError } from "../utils/apiError.js";

export const errorMiddleware = (err, req, res, next) => {
    console.error("Error caught by middleware:", err);

    if (err instanceof apiError) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Something went wrong",
            errors: err.errors || [],
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }

    // Map Mongoose/driver errors to generic messages — never expose internals in production
    if (err.name === "CastError") {
        return res.status(400).json({ success: false, message: "Invalid identifier format" });
    }
    if (err.name === "ValidationError") {
        return res.status(400).json({ success: false, message: "Validation failed" });
    }
    if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Duplicate entry" });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
}
