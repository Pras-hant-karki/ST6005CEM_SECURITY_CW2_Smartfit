import multer from "multer";
import { apiError } from "../utils/apiError.js";

const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (_req, file, cb) => {
        const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
        if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
            cb(null, true);
        } else {
            cb(new apiError(400, "Only JPEG, PNG, WebP images and PDF files are allowed"));
        }
    },
});
