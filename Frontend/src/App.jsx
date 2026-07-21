import React, {useEffect, Suspense} from 'react'
import { useDispatch } from 'react-redux'
import { getCurrentPatient, logoutPatient } from './services/patientApi.js'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Sections/Navbar.jsx'
import Footer from './Sections/Footer.jsx'
import { clearAuthState } from './store/slices/authSlice.js'

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const authRoutes = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password", "/update-password"];
  const isAuthRoute = authRoutes.includes(location.pathname);
  const patientPortalRoutes = ["/dashboard", "/profile", "/appointments", "/records", "/billing", "/prescriptions", "/labtests"];
  const isPatientPortalRoute = patientPortalRoutes.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("clearPatientSession") === "1") {
      dispatch(logoutPatient()).finally(() => {
        dispatch(clearAuthState());
        window.history.replaceState(null, "", "/");
      });
      return;
    }

    dispatch(getCurrentPatient());
  }, [dispatch, location.search]);

  // Deliberately no app-wide gate on isInitialized: the auth check runs in
  // the background and public routes (Home, Departments, Doctors, login,
  // register...) don't need it at all. Routes that DO require a known auth
  // state are individually wrapped in <AuthLayout>, which already shows its
  // own localized "Loading session..." state until isInitialized flips true
  // — gating here too would just block every public page behind the same
  // network round-trip for no reason.
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-white">
        Skip to main content
      </a>
      {!isPatientPortalRoute && <Navbar />}
      <main id="main-content" className={isAuthRoute ? "bg-[#eafff0]" : isPatientPortalRoute ? "min-h-screen bg-[#f8f6ff]" : "min-h-screen bg-gray-50 p-4"}>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      {/* <Department /> */}

      {!isPatientPortalRoute && <Footer />}
    </>
  )
}

export default App
