import { createSlice } from "@reduxjs/toolkit";
import { createCheckoutSession, verifyPayment } from "../../services/paymentApi";

const initialState = {
  creatingSession: false,
  createError: null,
  verifying: false,
  verifyError: null,
  paymentStatus: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearPaymentState: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(createCheckoutSession.pending, (state) => {
      state.creatingSession = true;
      state.createError = null;
    });
    builder.addCase(createCheckoutSession.fulfilled, (state) => {
      state.creatingSession = false;
    });
    builder.addCase(createCheckoutSession.rejected, (state, action) => {
      state.creatingSession = false;
      state.createError = action.payload;
    });

    builder.addCase(verifyPayment.pending, (state) => {
      state.verifying = true;
      state.verifyError = null;
    });
    builder.addCase(verifyPayment.fulfilled, (state, action) => {
      state.verifying = false;
      state.paymentStatus = action.payload;
    });
    builder.addCase(verifyPayment.rejected, (state, action) => {
      state.verifying = false;
      state.verifyError = action.payload;
    });
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
