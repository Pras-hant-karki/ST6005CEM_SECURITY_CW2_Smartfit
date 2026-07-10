const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;
const MAX_PASSWORD_LENGTH = 128;

export const validatePassword = (password) => {
    if (!password || password.length < 12) {
        return "Password must be at least 12 characters";
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`;
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }
    if (!/\d/.test(password)) {
        return "Password must contain at least one number";
    }
    if (!SPECIAL_CHARS.test(password)) {
        return "Password must contain at least one special character (!@#$%^&* etc.)";
    }
    return null;
};
