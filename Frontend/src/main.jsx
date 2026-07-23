import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Video, Package, Briefcase, Siren, ScrollText } from 'lucide-react'
import './index.css'
import App from './App.jsx'
import store from './store/store.js'
import { Provider } from 'react-redux'

// AuthLayout is a thin wrapper mounted on nearly every route, so it stays a
// regular import — everything else is route content and is only fetched
// when its route actually matches, keeping the initial JS payload small.
import AuthLayout from './components/custom/authLayout'

const BookAppointment = lazy(() => import("./pages/BookAppointment"))
const DepartmentList = lazy(() => import("./pages/DepartmentList"))
const DoctorsList = lazy(() => import("./pages/DoctorsList"))
const Home = lazy(() => import("./pages/Home"))
const About = lazy(() => import("./pages/About"))
const Login = lazy(() => import('./pages/login'))
const DoctorProfile = lazy(() => import('./pages/doctorProfile'))
const AllAppointments = lazy(() => import('./pages/AllAppointments'))
const AppointmentDetails = lazy(() => import('./pages/AppointmentDetails'))
const UpdateAppointment = lazy(() => import('./pages/UpdateAppointment'))
const Register = lazy(() => import('./pages/register'))
const UpdateProfile = lazy(() => import('./pages/UpdateProfile'))
const PatientProfile = lazy(() => import('./pages/patientprofile'))
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'))
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const SendOtp = lazy(() => import('./pages/SendOtp'))
const AllPrescriptions = lazy(() => import('./pages/AllPrescriptions'))
const PrescriptionDetails = lazy(() => import('./pages/PrescriptionDetails'))
const AllLabTests = lazy(() => import('./pages/AllLabTests'))
const LabTestDetails = lazy(() => import('./pages/LabTestDetails'))
const MedicalRecords = lazy(() => import('./pages/MedicalRecords'))
const BillingHistory = lazy(() => import('./pages/BillingHistory'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const ComingSoon = lazy(() => import('./pages/ComingSoon'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/departments',
        element: <DepartmentList />,
      },
      {
        path: "/departments/:deptname/doctors",
        element: <DoctorsList />,
      },
      {
        path: "/departments/:deptname/doctors/:doctorid",
        element: <DoctorProfile />,
      },
      {
        path: "/doctors/:doctorid",
        element: <DoctorProfile />,
      },
      {
        path: '/doctors',
        element: <DoctorsList />
      },
      {
        path: '/about',
        element: <About />
      },
      {
        path: '/privacy',
        element: <Privacy />
      },
      {
        path: '/terms',
        element: <Terms />
      },
      {
        path: '/virtual-consultations',
        element: <ComingSoon icon={Video} title="Virtual Consultations" description="Video appointments with our specialists, from wherever you are. We're putting the finishing touches on this — check back soon." />
      },
      {
        path: '/medical-packages',
        element: <ComingSoon icon={Package} title="Medical Packages" description="Bundled health checkup and treatment packages tailored to your needs. This page is on its way." />
      },
      {
        path: '/careers',
        element: <ComingSoon icon={Briefcase} title="Careers at SmartFit" description="Join our team of healthcare professionals. Open positions will be listed here soon." />
      },
      {
        path: '/emergency-services',
        element: <ComingSoon icon={Siren} title="Emergency Services" description="24/7 emergency care information and rapid-response contact details are being finalized." />
      },
      {
        path: '/patient-rights',
        element: <ComingSoon icon={ScrollText} title="Patient Rights" description="A full statement of your rights and responsibilities as a SmartFit patient is coming soon." />
      },
      {
        path: '/appointments/book-appointment/:doctorid',
        element: (
          <AuthLayout authentication={true}>
            <BookAppointment />
          </AuthLayout>
        )
      },
      {
        path: '/appointments/updateAppointment/:appointmentid',
        element: (
          <AuthLayout authentication={true}>
            <UpdateAppointment />
          </AuthLayout>
        )
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
        path: '/appointments',
        element: (
          <AuthLayout authentication={true}>
            <AllAppointments />
          </AuthLayout>
        )
      },
      {
        path: '/dashboard',
        element: (
          <AuthLayout authentication={true}>
            <PatientDashboard />
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
            <PatientProfile />
          </AuthLayout>
        )
      },
      {
        path: '/billing',
        element: (
          <AuthLayout authentication={true}>
            <BillingHistory />
          </AuthLayout>
        )
      },
      {
        path: '/records',
        element: (
          <AuthLayout authentication={true}>
            <MedicalRecords />
          </AuthLayout>
        )
      },
      {
        path: '/payment/success',
        element: (
          <AuthLayout authentication={true}>
            <PaymentSuccess />
          </AuthLayout>
        )
      },
      {
        path: '/payment/cancel',
        element: (
          <AuthLayout authentication={true}>
            <PaymentCancel />
          </AuthLayout>
        )
      },
      {
        path: '/prescriptions',
        element: (
          <AuthLayout authentication={true}>
            <AllPrescriptions />
          </AuthLayout>
        )
      },
      {
        path: '/prescriptions/:prescriptionid',
        element: (
          <AuthLayout authentication={true}>
            <PrescriptionDetails />
          </AuthLayout>
        )
      },
      {
        path: '/labtests',
        element: (
          <AuthLayout authentication={true}>
            <AllLabTests />
          </AuthLayout>
        )
      },
      {
        path: '/labtests/:labtestid',
        element: (
          <AuthLayout authentication={true}>
            <LabTestDetails />
          </AuthLayout>
        )
      },

      {
        path: '/login',
        element: (
          <AuthLayout authentication={false}>
            <Login />
          </AuthLayout>
        )
      },
      {
        path: '/register',
        element: (
          <AuthLayout authentication={false}>
            <Register />
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
