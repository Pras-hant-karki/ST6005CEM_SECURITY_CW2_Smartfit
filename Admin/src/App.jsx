import React, {useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import { getAdmin } from './services/adminApi.js'

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isInitialized } = useSelector((state) => state.auth);
  const isLoginRoute = ["/login", "/admin/login", "/register"].includes(location.pathname);

  useEffect(() => {
    if (isLoginRoute) return;
    dispatch(getAdmin());
  }, [dispatch, isLoginRoute]);
    
  if (!isLoginRoute && !isInitialized) {
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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white">
        Skip to main content
      </a>
      <main id="main-content" className="min-h-screen bg-gray-50 p-4">
        <Outlet />
      </main>
    </>
  )
}

export default App
