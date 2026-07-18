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

const PAYMENT_STATUS_MESSAGES = {
  401: "Your session has expired. Please log in again to continue.",
  404: "We couldn't find that appointment or payment record.",
  409: "This appointment has already been paid for.",
  503: "The payment service is temporarily unavailable. Please try again shortly.",
};

export function getPaymentErrorMessage(error) {
  if (!error) return "";
  const friendly = PAYMENT_STATUS_MESSAGES[error.status];
  if (friendly) return friendly;
  return formatErrorMessage(error, "Something went wrong with the payment. Please try again.");
}
