import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "./api";

// Payment routes are mounted at /api/v1/payment (sibling to /api/v1/patient),
// so we derive an absolute URL from the existing patient base URL and pass it
// straight to the shared `api` instance — axios uses an absolute URL as-is,
// ignoring its configured baseURL, while still running the same interceptors.
const PAYMENT_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://192.168.1.67:8000/api/v1/patient"
).replace(/\/patient\/?$/, "/payment");

const getApiError = (err) => {
  const status = err.response?.status ?? null;
  if (err.response?.data) return { ...err.response.data, status };
  if (err.message === "Network Error") {
    return {
      message:
        "Cannot connect to the backend server. Please make sure the backend is running or the deployed API is healthy.",
      status,
    };
  }
  return { message: err.message || "Something went wrong", status };
};

export const createCheckoutSession = createAsyncThunk(
  "payment/createCheckoutSession",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const res = await api.post(`${PAYMENT_BASE_URL}/create-checkout-session`, { appointmentId });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "payment/verifyPayment",
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${PAYMENT_BASE_URL}/verify`, { params: { session_id: sessionId } });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);
