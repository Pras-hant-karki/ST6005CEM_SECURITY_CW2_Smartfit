export function formatErrorMessage(error, fallback = "Something went wrong") {
  if (!error) return "";
  if (typeof error === "string") return error;

  if (typeof error.message === "string") return error.message;
  if (typeof error.error === "string") return error.error;

  if (error.message && typeof error.message === "object") {
    return formatErrorMessage(error.message, fallback);
  }

  if (error.error && typeof error.error === "object") {
    return formatErrorMessage(error.error, fallback);
  }

  return fallback;
}
