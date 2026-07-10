import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function AuthLayout({ authentication = true, children }) {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized) return;

    if (authentication && !isAuthenticated) {
      navigate("/login");
    }

    if (!authentication && isAuthenticated) {
      navigate("/");
    }
  }, [authentication, isAuthenticated, isInitialized, navigate]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] text-sm font-semibold text-slate-500">
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthLayout;
