import { createSlice } from "@reduxjs/toolkit";
import { isPending, isFulfilled, isRejected } from "@reduxjs/toolkit";
import {
  getAllLabTests,
  getLabTestByPrescription,
  getLabTest,
} from "../../services/labtestApi";

const initialState = {
  labTests: [],
  labTest: null,
  labTestByPrescription: null,
  loading: false,
  error: null,
};

const labtestSlice = createSlice({
  name: "labtest",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllLabTests.fulfilled, (state, action) => {
      state.labTests = action.payload;
    });

    builder.addCase(getLabTestByPrescription.fulfilled, (state, action) => {
      state.labTestByPrescription = action.payload;
    });

    builder.addCase(getLabTest.fulfilled, (state, action) => {
      state.labTest = action.payload;
    });

    const labtestThunks = [getAllLabTests, getLabTestByPrescription, getLabTest];

    builder.addMatcher(isAnyOf(...labtestThunks.map((t) => t.pending)), (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addMatcher(isAnyOf(...labtestThunks.map((t) => t.fulfilled)), (state) => {
      state.loading = false;
    });

    builder.addMatcher(isAnyOf(...labtestThunks.map((t) => t.rejected)), (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // isAnyOf restricts each matcher to only this slice's own thunks,
    // so unrelated slices can no longer affect this state

  },
});

export default labtestSlice.reducer;

