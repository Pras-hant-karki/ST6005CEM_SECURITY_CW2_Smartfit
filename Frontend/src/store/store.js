import { configureStore } from '@reduxjs/toolkit'
import patientReducer from './slices/patientSlice'
import appointmentReducer from './slices/appointmentSlice'
import authReducer from './slices/authSlice'
import prescriptionReducer from './slices/prescriptionSlice'
import labtestReducer from './slices/labtestSlice'
import paymentReducer from './slices/paymentSlice'
const store = configureStore({
  reducer: {
    patient: patientReducer,
    appointment: appointmentReducer,
    auth:authReducer,
    prescription: prescriptionReducer,
    labtest: labtestReducer,
    payment: paymentReducer,
  },
})

export default store
