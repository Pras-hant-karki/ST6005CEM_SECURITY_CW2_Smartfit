// Context-aware request sanitization. Walks req.body/req.query/req.params
// and, for every string value, looks up a sanitizer by that value's own
// object key (e.g. "symptoms", "email", "phonenumber") in FIELD_SANITIZERS
// below. A field with no entry is left completely untouched — this is
// intentionally NOT blanket sanitization. In particular, passwords, OTPs,
// tokens, IDs, dates, and numbers are never listed here, so they always
// pass through unmodified; only validation (already present elsewhere in
// each controller/model) applies to them.
//
// Runs after express.json()/urlencoded() and after the existing
// stripMongoOperators NoSQL-injection guard in app.js — this middleware
// only ever transforms string *values*, never deletes/renames keys, so it
// doesn't duplicate or interfere with that check.
import {
    sanitizeName,
    sanitizePlainText,
    sanitizeRichText,
    sanitizeEmail,
    sanitizePhone,
    sanitizeSearch,
} from "../utils/sanitize.js";

const FIELD_SANITIZERS = {
    // Identity
    patientname: sanitizeName,
    patientusername: sanitizeName,
    doctorname: sanitizeName,
    doctorusername: sanitizeName,
    adminname: sanitizeName,
    adminusername: sanitizeName,
    guardianName: sanitizeName,
    qualification: sanitizeName,
    specialization: sanitizeName,
    deptname: sanitizeName,

    // Email — every role's registration/login/update/forgot-password flow
    email: sanitizeEmail,

    // Phone — every role's registration/update flow
    phonenumber: sanitizePhone,

    // Rich text — free-form clinical/medical prose
    symptoms: sanitizeRichText,
    medicalhistory: sanitizeRichText,
    diagonosis: sanitizeRichText,
    description: sanitizeRichText,
    remarks: sanitizeRichText,
    result_summary: sanitizeRichText,

    // Plain text — short structured fields
    medicinename: sanitizePlainText,
    dosage: sanitizePlainText,
    frequency: sanitizePlainText,
    duration: sanitizePlainText,
    test_name: sanitizePlainText,
    department: sanitizePlainText,
    file_name: sanitizePlainText,

    // Search
    search: sanitizeSearch,
};

// Never recurse into these regardless of context — a defensive backstop
// against prototype pollution while walking arbitrary client-supplied JSON.
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function walk(node) {
    if (!node || typeof node !== "object") return;

    for (const key of Object.keys(node)) {
        if (UNSAFE_KEYS.has(key)) {
            delete node[key];
            continue;
        }

        const value = node[key];
        const sanitizer = FIELD_SANITIZERS[key];

        if (typeof value === "string") {
            if (sanitizer) node[key] = sanitizer(value);
            continue;
        }

        if (Array.isArray(value)) {
            // Array of primitives under a mapped key (e.g. a repeated
            // ?search= query param) — sanitize each element the same way a
            // lone string under that key would be sanitized.
            if (sanitizer) {
                for (let i = 0; i < value.length; i++) {
                    if (typeof value[i] === "string") value[i] = sanitizer(value[i]);
                }
            }
            // Array of objects (e.g. medicines[], tests[]) — recurse into
            // each element so nested fields still get matched by key name.
            for (const item of value) {
                if (item && typeof item === "object") walk(item);
            }
            continue;
        }

        if (value && typeof value === "object") {
            walk(value);
        }
    }
}

// req.body/req.query/req.params are mutated in place (never reassigned) —
// required for req.query under Express 5, which exposes it as a
// getter-only property; the existing stripMongoOperators middleware in
// app.js already relies on the same in-place-mutation approach.
export const sanitizeInput = (req, _res, next) => {
    walk(req.body);
    walk(req.query);
    walk(req.params);
    next();
};
