import React, {useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentDoctor } from './services/doctorApi.js'
import { Outlet, useLocation } from 'react-router-dom'

const DOCTOR_ACCESS_TOKEN_KEY = "smartfit_doctor_access_token";

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("accessToken");
    if (accessToken) {
      localStorage.setItem(DOCTOR_ACCESS_TOKEN_KEY, accessToken);
      window.history.replaceState(null, "", location.pathname || "/");
    }

    dispatch(getCurrentDoctor());
  }, [dispatch, location.pathname, location.search]);
    
  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-white">
        Skip to main content
      </a>
      <main id="main-content" className="min-h-screen bg-gray-50 p-4">
        <Outlet />
      </main>
    </>
  )
}

export default App
