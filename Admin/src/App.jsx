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
     
      <main className="min-h-screen bg-gray-50 p-4">
        <Outlet />
      </main>
    </>
  )
}

export default App
