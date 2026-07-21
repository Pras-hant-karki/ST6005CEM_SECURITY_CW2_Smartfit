import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import store from './store/store.js'
import { Provider } from 'react-redux'
import AuthLayout from "@/components/custom/authLayout"

// AuthLayout is a thin wrapper mounted on nearly every route, so it stays a
// regular import — everything else is route content and is only fetched
// when its route actually matches, keeping the initial JS payload small.
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'))
const DoctorLogin = lazy(() => import('./pages/DoctorLogin'))
const DoctorRegister = lazy(() => import('./pages/DoctorRegister'))
const SendOtp = lazy(() => import('./pages/SendOtp'))
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const DoctorProfile = lazy(() => import('./pages/doctorprofile'))
const UpdateProfile = lazy(() => import('./pages/UpdateProfile'))
const AllAppointmentsPage = lazy(() => import('./pages/AllAppointmentPage'))
const AppointmentDetails = lazy(() => import('./pages/AppointmentDetails'))
const CreatePrescription = lazy(() => import('./pages/CreatePrescription'))
const AllPrescriptions = lazy(() => import('./pages/AllPrescriptions'))
const PrescriptionDetails = lazy(() => import('./pages/PrescriptionDetails'))
const DoctorLabTests = lazy(() => import('./pages/DoctorLabTests'))
const VerifyAppointment = lazy(() => import('./pages/VerifyAppointment'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: (
          <AuthLayout authentication={true}>
            <DoctorDashboard />
          </AuthLayout>
        )
      },
      {
        path: '/login',
        element: <DoctorLogin />
      },
      {
        path: '/doctor/login',
        element: <DoctorLogin />
      },
      {
        path: '/register',
        element: <DoctorRegister />
      },
      {
        path: '/doctor/register',
        element: <DoctorRegister />
      },
      {
        path: '/appointments/:appointmentid',
        element: (
          <AuthLayout authentication={true}>
            <AppointmentDetails />
          </AuthLayout>
        )
      },
      {
        path: '/todayappointments',
        element: (
          <AuthLayout authentication={true}>
            <AllAppointmentsPage />
          </AuthLayout>
        )
      },
      {
        path: '/verify-appointment',
        element: (
          <AuthLayout authentication={true}>
            <VerifyAppointment />
          </AuthLayout>
        )
      },
      {
        path: '/appointments',
        element: (
          <AuthLayout authentication={true}>
            < AllAppointmentsPage/>
          </AuthLayout>
        )
      },
      {
        path: '/prescriptions',
        element: (
          <AuthLayout authentication={true}>
            < AllPrescriptions/>
          </AuthLayout>
        )
      },
      {
        path: '/labtests',
        element: (
          <AuthLayout authentication={true}>
            <DoctorLabTests />
          </AuthLayout>
        )
      },
      {
        path: '/prescriptions/:prescriptionid',
        element: (
          <AuthLayout authentication={true}>
            < PrescriptionDetails/>
          </AuthLayout>
        )
      },
      {
        path: '/prescription/:appointmentid/createprescription',
        element: (
          <AuthLayout authentication={true}>
            < CreatePrescription/>
          </AuthLayout>
        )
      },
      {
        path: '/prescriptions/:appointmentid/prescriptiondetails',
        element: (
          <AuthLayout authentication={true}>
            <PrescriptionDetails/>
          </AuthLayout>
        )
      },
      {
        path: '/profile/updateprofile',
        element: (
          <AuthLayout authentication={true}>
            <UpdateProfile />
          </AuthLayout>
        )
      },
      {
        path: '/profile',
        element: (
          <AuthLayout authentication={true}>
            <DoctorProfile />
          </AuthLayout>
        )
      },

      {
        path: '/update-password',
        element: <SendOtp />
      },
      {
        path: '/verify-otp',
        element: <VerifyOtp />
      },
      {
        path: '/reset-password',
        element: <ResetPassword />
      },
      {
        path: '/forgot-password',
        element: <SendOtp />
      },

    ],
  },
])


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
