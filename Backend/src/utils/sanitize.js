// Context-aware input sanitization utilities. Each function targets one
// specific class of user-controlled text — there is deliberately no single
// "sanitize everything the same way" helper. See middlewares/sanitize.middleware.js
// for how these are mapped onto actual request fields.
import sanitizeHtml from "sanitize-html";

// Strips every ASCII control character (0x00-0x1F, 0x7F), including \n and
// \t. Used by every single-line field context below — none of them are
// expected to legitimately contain a raw newline or tab.
const ALL_CONTROL_CHARS = /[\x00-\x1F\x7F]/g;
const stripControlChars = (value) => value.replace(ALL_CONTROL_CHARS, "");

// Same idea, but keeps \n (0x0A) and \t (0x09) — used only by
// sanitizeRichText, the one context where multi-line input is legitimate.
const MULTILINE_CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const stripControlCharsKeepNewlines = (value) => value.replace(MULTILINE_CONTROL_CHARS, "");

const HTML_TAG = /<[^>]*>/g;
const stripTags = (value) => value.replace(HTML_TAG, "");

const collapseWhitespace = (value) => value.replace(/[ \t]+/g, " ").trim();

/**
 * Identity fields: person/department names, usernames, qualifications,
 * specializations. Strips HTML and control characters and collapses
 * whitespace, but never restricts to an alphanumeric charset — real names
 * legitimately contain apostrophes, hyphens, periods, slashes, and
 * ampersands (e.g. "O'Brien", "OB/GYN", "Ear, Nose & Throat"), so a
 * charset whitelist would silently corrupt valid data.
 */
export function sanitizeName(value) {
    if (typeof value !== "string") return value;
    return collapseWhitespace(stripTags(stripControlChars(value)));
}

/**
 * Short structured plain-text fields (medicine name/dosage/frequency/
 * duration, lab test names, department slugs, uploaded-file display names).
 * Same treatment as sanitizeName today — kept as a separate function, as
 * requested, so this context can diverge from identity fields later
 * without touching every call site.
 */
export function sanitizePlainText(value) {
    if (typeof value !== "string") return value;
    return collapseWhitespace(stripTags(stripControlChars(value)));
}

// allowedTags: [] strips every tag; sanitize-html's default nonTextTags
// list (script, style, textarea, ...) discards the tag's inner content too,
// not just the wrapping markup, so `<script>alert(1)</script>` disappears
// entirely rather than leaving "alert(1)" behind as plain text.
const RICH_TEXT_OPTIONS = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
};

// sanitize-html encodes the 5 basic HTML entities in whatever text content
// survives (e.g. bare "&" becomes "&amp;") since its output is meant to be
// safe to re-embed as HTML. Nothing downstream here re-embeds it as HTML —
// it goes into MongoDB as plain text, then to a PDF via pdfkit or to a
// React text node (which escapes on its own) — so left un-decoded it would
// literally show "&amp;" instead of "&" to the end user. Decoding these 5
// back to their literal character is safe at this point: sanitize-html has
// already finished parsing tag *structure* by the time this runs, so a
// decoded stray "&"/"<"/">"/"\""/"'" cannot reconstruct a tag it removed.
const HTML_ENTITY_DECODE = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };
const decodeBasicEntities = (value) => value.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (m) => HTML_ENTITY_DECODE[m]);

/**
 * Free-form clinical/medical text (appointment symptoms, medical history,
 * diagnosis, lab remarks/result summaries, department descriptions). Uses
 * sanitize-html rather than a regex strip because this is the one category
 * genuinely expected to contain punctuation-heavy, multi-line prose —
 * sanitize-html removes <script>/<style> tags (with their content) and any
 * other markup or event-handler attributes while leaving ordinary text,
 * punctuation, and intentional line breaks intact.
 */
export function sanitizeRichText(value) {
    if (typeof value !== "string") return value;
    const withoutControlChars = stripControlCharsKeepNewlines(value);
    const clean = decodeBasicEntities(sanitizeHtml(withoutControlChars, RICH_TEXT_OPTIONS));
    // Tidy up whitespace left behind by stripped tags without collapsing
    // intentional paragraph breaks down to nothing.
    return clean
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Email addresses. Strips control characters and HTML, then trims.
 * Deliberately does NOT force lowercase here: several controllers already
 * lowercase email themselves before querying/storing (see
 * doctor.controller.js), but others do not, and forcing it globally could
 * change which stored document a case-sensitive lookup matches for any
 * account that predates this change — a behavioral change this task
 * explicitly must not introduce. Existing per-controller lowercasing is
 * untouched and keeps working exactly as before.
 */
export function sanitizeEmail(value) {
    if (typeof value !== "string") return value;
    return stripTags(stripControlChars(value)).trim();
}

/**
 * Phone numbers. Keeps only digits and a single leading '+', stripping
 * formatting characters (spaces, dashes, parentheses) a user might type.
 * This only ever narrows the input closer to what the existing per-field
 * format checks (e.g. the 10-digit regex in doctor.controller.js) already
 * require — it cannot turn a previously-valid number invalid.
 */
export function sanitizePhone(value) {
    if (typeof value !== "string") return value;
    const trimmed = stripControlChars(value).trim();
    const plus = trimmed.startsWith("+") ? "+" : "";
    return plus + trimmed.replace(/[^0-9]/g, "");
}

/**
 * Search-box query strings. Strips HTML/control characters, trims, and
 * caps length at 100 characters — mirroring the cap
 * doctor.controller.js's getalldoctorprofiledetails already applies to
 * req.query.search. Does NOT regex-escape the value: that stays exactly
 * where it already lives, immediately before the $regex query is built, so
 * this never duplicates the existing ReDoS protection.
 */
export function sanitizeSearch(value) {
    if (typeof value !== "string") return value;
    return collapseWhitespace(stripTags(stripControlChars(value))).slice(0, 100);
}
