import fs from "fs/promises";
import path from "path";

// Mirrors the two URL shapes uploadLocal() (see localUpload.js) generates,
// so a stored URL can be mapped back to the file it points at on disk:
//   public:  <baseUrl>/uploads/<folder>/<filename>                       -> public/uploads/<folder>/<filename>
//   private: <baseUrl>/api/v1/admin/documents/<folder>/<filename>        -> private/uploads/<folder>/<filename>
export const resolveStoredFilePath = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== "string") return null;

  let pathname;
  try {
    pathname = new URL(fileUrl).pathname;
  } catch {
    return null; // not a URL we recognize (e.g. already a bare path, or empty) — nothing to delete
  }

  let rootDir;
  let relative;
  if (pathname.startsWith("/uploads/")) {
    rootDir = "public";
    relative = pathname.slice("/uploads/".length);
  } else if (pathname.startsWith("/api/v1/admin/documents/")) {
    rootDir = "private";
    relative = path.join("uploads", pathname.slice("/api/v1/admin/documents/".length));
  } else {
    return null;
  }

  const base = path.resolve(process.cwd(), rootDir);
  const resolved = path.resolve(base, relative);
  // Defense in depth: the URL is always one we generated ourselves (read back
  // from the DB, never taken from a request at delete time), but refuse to
  // unlink anything outside the expected upload root regardless.
  if (!resolved.startsWith(base + path.sep)) return null;

  return resolved;
};

// Deletes the on-disk file behind a stored upload URL. Safe to call with
// null/undefined/malformed input and safe to call on a file that's already
// gone — both are no-ops, not errors, since this runs as best-effort cleanup
// during account deletion and must never be the reason deletion fails.
export const deleteUploadedFile = async (fileUrl) => {
  const filepath = resolveStoredFilePath(fileUrl);
  if (!filepath) return;

  try {
    await fs.unlink(filepath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Failed to delete uploaded file at ${filepath}:`, err.message);
    }
  }
};

// Convenience for deleting several URLs (e.g. every document a doctor/admin
// uploaded) without the caller needing Promise.all boilerplate at every
// call site.
export const deleteUploadedFiles = async (fileUrls = []) => {
  await Promise.all(fileUrls.filter(Boolean).map(deleteUploadedFile));
};
