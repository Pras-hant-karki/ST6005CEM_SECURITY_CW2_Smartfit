// src/redux/thunks/doctorThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "./api";

// ✅ Register Doctor
export const registerDoctor = createAsyncThunk(
    "doctor/registerForDoctor",
    async (formData, { rejectWithValue }) => {
        try {
            const res = await api.post("/register", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Registration failed");
        }
    }
);

export const loginDoctor = createAsyncThunk(
    "doctor/loginForDoctor",
    async (credentials, { rejectWithValue }) => {
        try {
            const res = await api.post("/login", credentials);
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Login failed");
        }
    }
);

export const verifyMfaDoctor = createAsyncThunk(
    "doctor/verifyMfaForDoctor",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await api.post("/login/verify-mfa", payload);
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "OTP verification failed");
        }
    }
);

// ✅ Logout Doctor
export const logoutDoctor = createAsyncThunk(
    "doctor/logoutForDoctor",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.post("/logout");
            return res.data.message;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Logout failed");
        }
    }
);

// ✅ Get Doctor Profile (private)
export const getDoctorProfile = createAsyncThunk(
    "doctor/profileForDoctor",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/profile");
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch profile");
        }
    }
);

// ✅ Update Doctor Profile
export const updateDoctorProfile = createAsyncThunk(
    "doctor/updateProfileForDoctor",
    async (updates, { rejectWithValue }) => {
        try {
            const res = await api.patch("/update-profile", updates);
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Profile update failed");
        }
    }
);

// ✅ Update Profile Picture
export const updateDoctorProfilePic = createAsyncThunk(
    "doctor/updateProfilePicForDoctor",
    async (formData, { rejectWithValue }) => {
        try {
            const res = await api.patch("/update-profilepicture", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Profile picture update failed");
        }
    }
);

// ✅ Update Documents (degree/license)
export const updateDoctorDocuments = createAsyncThunk(
    "doctor/updateDocumentsForDoctor",
    async (formData, { rejectWithValue }) => {
        try {
            const res = await api.patch("/update-document", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Document update failed");
        }
    }
);

// ✅ Update Password (logged in)
export const sendUpdatetPasswordOtp = createAsyncThunk(
    "doctor/sendUpdateOtpForDoctor",
    async (data, { rejectWithValue }) => {
        try {
            const res = await api.post("/update-password/send-otp", data);
            return res.data.message;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to send OTP");
        }
    }
);
export const verifyUpdatePasswordOtp = createAsyncThunk(
    "doctor/verifyUpdateOtpForDoctor",
    async (data, { rejectWithValue }) => {
        try {
            const res = await api.post("/update-password/verify-otp", data);
            return res.data.message;
        } catch (error) {
            return rejectWithValue(error.response?.data || "OTP verification failed");
        }
    }
);
export const updateDoctorPassword = createAsyncThunk(
    "doctor/updatePasswordForDoctor",
    async (data, { rejectWithValue }) => {
        try {
            const res = await api.patch("/update-password", data);
            return res.data.message;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Password update failed");
        }
    }
);

// ✅ Forgot Password Flow
export const sendForgotPasswordOtp = createAsyncThunk(
    "doctor/sendForgotOtpForDoctor",
    async (data, { rejectWithValue }) => {
        try {
            const res = await api.post("/forgot-password/send-otp", data);
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to send OTP");
        }
    }
);

export const verifyForgotPasswordOtp = createAsyncThunk(
    "doctor/verifyForgotOtpForDoctor",
    async (data, { rejectWithValue }) => {
        try {
            const res = await api.post("/forgot-password/verify-otp", data);
            return res.data.message;
        } catch (error) {
            return rejectWithValue(error.response?.data || "OTP verification failed");
        }
    }
);

export const resetForgottenPassword = createAsyncThunk(
    "doctor/resetForgottenPasswordForDoctor",
    async (data, { rejectWithValue }) => {
        try {
            const res = await api.patch("/forgot-password/update-password", data);
            return res.data.message;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Password reset failed");
        }
    }
);
export const getCurrentDoctor = createAsyncThunk(
    "doctor/getCurrentDoctorForDoctor",
    async (_, { rejectWithValue }) => {
          try {
      const res = await api.get("/get-doctor");
      return res.data.data;
    } catch (error) {
      return rejectWithValue(null);
    }
    }
);

// When a request uses responseType: "blob" (PDF export), a JSON error
// response from the backend also arrives as a Blob instead of parsed JSON —
// this reads it back out so error messages still surface normally.
const getBlobErrorPayload = async (error) => {
    const data = error.response?.data;
    if (data instanceof Blob && data.type === "application/json") {
        try {
            return JSON.parse(await data.text());
        } catch {
            // fall through
        }
    }
    return error.response?.data || "Export failed";
};

const getFilenameFromDisposition = (disposition, fallback = "smartfit-data-export.pdf") => {
    const match = disposition?.match(/filename="?([^";]+)"?/);
    return match ? match[1] : fallback;
};

// ✅ Export My Data (PDF)
export const exportMyData = createAsyncThunk(
    "doctor/exportMyDataForDoctor",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/export-data", { responseType: "blob" });
            return { blob: res.data, filename: getFilenameFromDisposition(res.headers["content-disposition"]) };
        } catch (error) {
            return rejectWithValue(await getBlobErrorPayload(error));
        }
    }
);

// ✅ Delete My Account — OTP step
export const sendDeleteAccountOtp = createAsyncThunk(
    "doctor/sendDeleteAccountOtpForDoctor",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.post("/delete-account/send-otp");
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to send verification code");
        }
    }
);

// ✅ Delete My Account
export const deleteMyAccount = createAsyncThunk(
    "doctor/deleteMyAccountForDoctor",
    async ({ password, otp }, { rejectWithValue }) => {
        try {
            const res = await api.delete("/delete-account", { data: { password, otp } });
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to delete account");
        }
    }
);
