import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function AuthLayout({ authentication = true, children }) {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  const publicLoginUrl = `${(import.meta.env.VITE_PUBLIC_HOME_URL || "http://localhost:5173").replace(/\/$/, "")}/login`;

  useEffect(() => {
    if (!isInitialized) return;

    if (authentication && !isAuthenticated) {
      window.location.assign(publicLoginUrl);
    }

    if (!authentication && isAuthenticated) {
      navigate("/");
    }
  }, [authentication, isAuthenticated, isInitialized, navigate, publicLoginUrl]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50 text-sm font-semibold text-slate-500">
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthLayout;
