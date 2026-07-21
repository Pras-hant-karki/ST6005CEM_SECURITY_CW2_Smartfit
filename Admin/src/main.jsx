import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import store from './store/store.js'
import { Provider } from 'react-redux'
import AuthLayout from './components/custom/authLayout'

// AuthLayout is a thin wrapper mounted on nearly every route, so it stays a
// regular import — everything else is route content and is only fetched
// when its route actually matches, keeping the initial JS payload small.
const AdminDashboard = lazy(() => import('./components/custom/AdminDashboard'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminAppointmentsPage = lazy(() => import('./pages/AdminAppointmentPage'))
const AppointmentDetails = lazy(() => import('./pages/AppointmentDetails'))
const AdminDoctorProfile = lazy(() => import('./pages/doctorprofile'))
const DoctorList = lazy(() => import('./pages/DoctorsList'))
const AddDoctor = lazy(() => import('./pages/AddDoctor'))
const EditDoctor = lazy(() => import('./pages/EditDoctor'))
const AdminDepartmentList = lazy(() => import('./pages/DepartmentList'))
const AdminUpdateProfile = lazy(() => import('./pages/UpdateProfile'))
const AdminProfile = lazy(() => import('./pages/AdminProfile'))
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: (
          <AuthLayout authentication={true}>
            <AdminDashboard />
          </AuthLayout>
        )
      },
      {
        path: '/login',
        element: <AdminLogin />
      },
      {
        path: '/admin/login',
        element: <AdminLogin />
      },
      {
        path: '/register',
        element: <AdminLogin />
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
            <AdminAppointmentsPage />
          </AuthLayout>
        )
      },
      {
        path: '/appointments',
        element: (
          <AuthLayout authentication={true}>
            < AdminAppointmentsPage />
          </AuthLayout>
        )
      },

      {
        path: '/departments',
        element:
          (<AuthLayout authentication={true}>
            <AdminDepartmentList />
          </AuthLayout>
          ),
      },
      {
        path: "/departments/:deptname/doctors",
        element: (
          <AuthLayout authentication={true}>
            <DoctorList />
          </AuthLayout>
        ),
      },
      {
        path: '/doctors',
        element:
          (<AuthLayout authentication={true}>
            <DoctorList />
          </AuthLayout>
          )
      },
      {
        path: '/doctors/create',
        element:
          (<AuthLayout authentication={true}>
            <AddDoctor />
          </AuthLayout>
          )
      },
      {
        path: '/doctors/:doctorid/edit',
        element:
          (<AuthLayout authentication={true}>
            <EditDoctor />
          </AuthLayout>
          )
      },
      {
        path: "/departments/:deptname/doctors/:doctorid",
        element: (
          <AuthLayout authentication={true}>
            <AdminDoctorProfile />
          </AuthLayout>
        ),
      },
      {
        path: "/doctors/:doctorid",
        element: (
          <AuthLayout authentication={true}>
            <AdminDoctorProfile />
          </AuthLayout>
        ),
      },
      {
        path: '/profile/updateprofile',
        element: (
          <AuthLayout authentication={true}>
            <AdminUpdateProfile />
          </AuthLayout>
        )
      },
      {
        path: '/profile',
        element: (
          <AuthLayout authentication={true}>
            <AdminProfile />
          </AuthLayout>
        )
      },
      {
        path: '/security',
        element: (
          <AuthLayout authentication={true}>
            <SecurityDashboard />
          </AuthLayout>
        )
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
