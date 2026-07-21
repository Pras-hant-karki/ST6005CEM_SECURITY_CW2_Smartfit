import React, {useEffect, Suspense} from 'react'
import { useDispatch } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import { getAdmin } from './services/adminApi.js'

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isLoginRoute = ["/login", "/admin/login", "/register"].includes(location.pathname);

  useEffect(() => {
    if (isLoginRoute) return;
    dispatch(getAdmin());
  }, [dispatch, isLoginRoute]);

  // No app-wide gate on isInitialized — every protected route is wrapped in
  // <AuthLayout>, which already shows its own localized "Loading session..."
  // state until the auth check resolves. Gating here too would just add a
  // second, redundant full-page loader in front of it.
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white">
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
