import { createSlice } from "@reduxjs/toolkit";
import {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  getCurrentDoctor,
  verifyMfaDoctor,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgottenPassword,
  sendUpdatetPasswordOtp,
  verifyUpdatePasswordOtp,
  updateDoctorPassword,
} from "../../services/doctorApi";

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
      state.error = null;
      state.loading = false;
      state.isInitialized = true;
    },
  },

  extraReducers: (builder) => {
   
    builder.addCase(registerDoctor.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(registerDoctor.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload?.user || null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    });

    builder.addCase(registerDoctor.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

  
    builder.addCase(loginDoctor.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(loginDoctor.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload?.mfaRequired || action.payload?.captchaRequired) {
        state.isAuthenticated = false;
      } else {
        state.user = action.payload?.user || null;
        state.isAuthenticated = true;
      }
      state.isInitialized = true;
    });

    builder.addCase(verifyMfaDoctor.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyMfaDoctor.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload?.user || null;
      state.isAuthenticated = true;
      state.isInitialized = true;
    });
    builder.addCase(verifyMfaDoctor.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(loginDoctor.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(logoutDoctor.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(logoutDoctor.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    });

    builder.addCase(logoutDoctor.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getCurrentDoctor.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(getCurrentDoctor.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload || null;
      state.isAuthenticated = true;
      state.isInitialized = true;
    });

    builder.addCase(getCurrentDoctor.rejected, (state) => {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.error = null;
    });

    builder.addCase(sendForgotPasswordOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(sendForgotPasswordOtp.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(sendForgotPasswordOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(sendUpdatetPasswordOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(sendUpdatetPasswordOtp.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(sendUpdatetPasswordOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(verifyForgotPasswordOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyForgotPasswordOtp.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(verifyForgotPasswordOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(verifyUpdatePasswordOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyUpdatePasswordOtp.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(verifyUpdatePasswordOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(resetForgottenPassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(resetForgottenPassword.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(resetForgottenPassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(updateDoctorPassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateDoctorPassword.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(updateDoctorPassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;
