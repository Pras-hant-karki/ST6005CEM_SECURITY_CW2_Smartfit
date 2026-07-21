import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import {
  getAllPrescriptions,
  getPrescriptionByAppointment,
  getPrescription,
} from "../../services/prescriptionApi";

const initialState = {
  prescriptions: [],
  prescription: null,
  prescriptionByAppointment: null,
  loading: false,
  error: null,
};

const prescriptionSlice = createSlice({
  name: "prescription",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllPrescriptions.fulfilled, (state, action) => {
      state.prescriptions = action.payload;
    });

    builder.addCase(getPrescriptionByAppointment.fulfilled, (state, action) => {
      state.prescriptionByAppointment = action.payload;
    });

    builder.addCase(getPrescription.fulfilled, (state, action) => {
      state.prescription = action.payload;
    });

    const prescriptionThunks = [getAllPrescriptions, getPrescriptionByAppointment, getPrescription];

    builder.addMatcher(isAnyOf(...prescriptionThunks.map((t) => t.pending)), (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addMatcher(isAnyOf(...prescriptionThunks.map((t) => t.fulfilled)), (state) => {
      state.loading = false;
    });

    builder.addMatcher(isAnyOf(...prescriptionThunks.map((t) => t.rejected)), (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default prescriptionSlice.reducer;

