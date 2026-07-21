import React, {useEffect, Suspense} from 'react'
import { useDispatch } from 'react-redux'
import { getCurrentDoctor } from './services/doctorApi.js'
import { Outlet, useLocation } from 'react-router-dom'

const DOCTOR_ACCESS_TOKEN_KEY = "smartfit_doctor_access_token";

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("accessToken");
    if (accessToken) {
      localStorage.setItem(DOCTOR_ACCESS_TOKEN_KEY, accessToken);
      window.history.replaceState(null, "", location.pathname || "/");
    }

    dispatch(getCurrentDoctor());
  }, [dispatch, location.pathname, location.search]);

  // No app-wide gate on isInitialized: public routes (login, register) don't
  // need it, and protected routes are individually wrapped in <AuthLayout>,
  // which already shows its own localized "Loading session..." state until
  // the auth check resolves. Gating here too would just add a second,
  // redundant full-page loader in front of every route, public or not.
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-white">
        Skip to main content
      </a>
      <main id="main-content" className="min-h-screen bg-gray-50 p-4">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  )
}

export default App
