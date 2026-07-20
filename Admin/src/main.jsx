import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import store from './store/store.js'
import { Provider } from 'react-redux'
import AuthLayout from './components/custom/authLayout'
import AdminDashboard from './components/custom/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminAppointmentsPage from './pages/AdminAppointmentPage'
import AppointmentDetails from './pages/AppointmentDetails'
import AdminDoctorProfile from './pages/doctorprofile'
import DoctorList from './pages/DoctorsList'
import AddDoctor from './pages/AddDoctor'
import EditDoctor from './pages/EditDoctor'
import AdminDepartmentList from './pages/DepartmentList'
import AdminUpdateProfile from './pages/UpdateProfile'
import AdminProfile from './pages/AdminProfile'
import SecurityDashboard from './pages/SecurityDashboard'

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
