import { createSlice } from "@reduxjs/toolkit";
import {
  registerPatient,
  loginPatient,
  logoutPatient,
  getCurrentPatient,
  verifyMfaOtp,
} from "../../services/patientApi";
import { isAnyOf } from "@reduxjs/toolkit";


const initialState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {

    clearAuthState: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {

    builder.addCase(registerPatient.fulfilled, (state, action) => {
      state.user = action.payload || null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    })


    builder.addCase(loginPatient.fulfilled, (state, action) => {
      if (action.payload?.data?.mfaRequired || action.payload?.data?.captchaRequired) {
        state.isAuthenticated = false;
      } else {
        state.user = action.payload?.data?.user || null;
        state.isAuthenticated = true;
      }
      state.isInitialized = true;
    })

    builder.addCase(verifyMfaOtp.fulfilled, (state, action) => {
      state.user = action.payload?.data?.user || null;
      state.isAuthenticated = true;
      state.isInitialized = true;
    })


    builder.addCase(logoutPatient.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    })

    builder.addCase(getCurrentPatient.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isInitialized = true;
      state.isAuthenticated = true;
    });

    builder.addCase(getCurrentPatient.rejected, (state) => {
      state.user = null;
      state.isInitialized = true;
      state.isAuthenticated = false;
      state.error = null;
    });

    const authThunks = [registerPatient, loginPatient, logoutPatient, getCurrentPatient, 
      verifyMfaOtp];

    builder.addMatcher(isAnyOf(...authThunks.map((t) => t.pending)), (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addMatcher(isAnyOf(...authThunks.map((t) => t.fulfilled)), (state) => {
      state.loading = false;
    });

    builder.addMatcher(isAnyOf(...authThunks.map((t) => t.rejected)), (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

  },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;
