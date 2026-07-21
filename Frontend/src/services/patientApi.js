import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "./api";

const getApiError = (err) => {
    if (err.response?.data) return err.response.data;
    if (err.message === "Network Error") {
        return {
            message:
                "Cannot connect to the backend server. Please make sure the backend is running or the deployed API is healthy.",
        };
    }
    return { message: err.message || "Something went wrong" };
};

// When a request uses responseType: "blob" (PDF export), a JSON error
// response from the backend also arrives as a Blob instead of parsed JSON —
// this reads it back out so error messages still surface normally.
const getBlobApiError = async (err) => {
    const data = err.response?.data;
    if (data instanceof Blob && data.type === "application/json") {
        try {
            return JSON.parse(await data.text());
        } catch {
            // fall through to the generic handler below
        }
    }
    return getApiError(err);
};

const getFilenameFromDisposition = (disposition, fallback = "smartfit-data-export.pdf") => {
    const match = disposition?.match(/filename="?([^";]+)"?/);
    return match ? match[1] : fallback;
};

export const registerPatient = createAsyncThunk("patient/register", async (formData, { rejectWithValue }) => {
    try {
        const res = await api.post("/register", formData);
        return res.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const loginPatient = createAsyncThunk(
    "patient/login",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await api.post("/login", payload);
            // If MFA is required the response will be { mfaRequired: true }.
            // Session tokens are NOT issued at this step — return as-is so the
            // login page can show the OTP form.
            return res.data;
        } catch (err) {
            return rejectWithValue(getApiError(err));
        }
    }
);

export const verifyMfaOtp = createAsyncThunk(
    "patient/verifyMfa",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await api.post("/login/verify-mfa", payload);
            return res.data;
        } catch (err) {
            return rejectWithValue(getApiError(err));
        }
    }
);

export const logoutPatient = createAsyncThunk("patient/logout", async (_, { rejectWithValue }) => {
    try {
        const res = await api.post("/logout");
        return res.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const updateProfile = createAsyncThunk("patient/updateProfile", async (payload, { rejectWithValue }) => {
    try {
        const res = await api.patch("/update-profile", payload);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const updateProfilePic = createAsyncThunk("patient/updateProfilePic", async (formData, { rejectWithValue }) => {
    try {
        const res = await api.patch("/update-profilepicture", formData);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const getProfileDetails = createAsyncThunk("patient/getProfile", async (_, { rejectWithValue }) => {
    try {
        const res = await api.get("/get-profile");
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const sendOtpForUpdate = createAsyncThunk("patient/sendOtpForUpdate", async (_, { rejectWithValue }) => {
    try {
        const res = await api.post("/update-password/send-otp");
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const verifyOtpForUpdate = createAsyncThunk("patient/verifyOtpForUpdate", async (payload, { rejectWithValue }) => {
    try {
        const res = await api.post("/update-password/verify-otp", payload);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const updatePassword = createAsyncThunk("patient/updatePassword", async (payload, { rejectWithValue }) => {
    try {
        const res = await api.patch("/update-password", payload);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const sendForgotPasswordOtp = createAsyncThunk("patient/sendForgotPasswordOtp", async (payload, { rejectWithValue }) => {
    try {
        const res = await api.post("/forgot-password/send-otp", payload);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const verifyForgotPasswordOtp = createAsyncThunk("patient/verifyForgotPasswordOtp", async (payload, { rejectWithValue }) => {
    try {
        const res = await api.post("/forgot-password/verify-otp", payload);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const resetForgottenPassword = createAsyncThunk("patient/resetForgottenPassword", async (payload, { rejectWithValue }) => {
    try {
        const res = await api.patch("/forgot-password/update-password", payload);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const getAllDoctors = createAsyncThunk("patient/getAllDoctors", async (search = "", { rejectWithValue }) => {
    try {
        const res = await api.get(`/doctors${search ? `?search=${search}` : ""}`);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const getDoctorProfile = createAsyncThunk("patient/getDoctorProfile", async (doctorid, { rejectWithValue }) => {
    try {
        const res = await api.get(`/doctors/${doctorid}`);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const getAllDepartments = createAsyncThunk("patient/getAllDepartments", async (_, { rejectWithValue }) => {
    try {
        const res = await api.get("/departments");
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const getdoctorbydepartment = createAsyncThunk("patient/getdoctorbydepartmentment", async (deptname, { rejectWithValue }) => {
    try {
        const res = await api.get(`/departments/${deptname}/doctors`);
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

// The backend now streams a PDF, not JSON — responseType: "blob" is required
// so axios hands back raw binary data instead of trying to parse it as text.
export const exportMyData = createAsyncThunk("patient/exportMyData", async (_, { rejectWithValue }) => {
    try {
        const res = await api.get("/export-data", { responseType: "blob" });
        return { blob: res.data, filename: getFilenameFromDisposition(res.headers["content-disposition"]) };
    } catch (err) {
        return rejectWithValue(await getBlobApiError(err));
    }
});

export const sendDeleteAccountOtp = createAsyncThunk("patient/sendDeleteAccountOtp", async (_, { rejectWithValue }) => {
    try {
        const res = await api.post("/delete-account/send-otp");
        return res.data.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const deleteMyAccount = createAsyncThunk("patient/deleteMyAccount", async ({ password, otp }, { rejectWithValue }) => {
    try {
        const res = await api.delete("/delete-account", { data: { password, otp } });
        return res.data;
    } catch (err) {
        return rejectWithValue(getApiError(err));
    }
});

export const getCurrentPatient = createAsyncThunk(
    "auth/getCurrentPatient",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/get-patient");
            return res.data.data;
        } catch {
            return rejectWithValue(null);
        }
    }
);
