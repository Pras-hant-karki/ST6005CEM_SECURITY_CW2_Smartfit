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

  // Block rendering of gated content until we know the auth state AND it
  // matches what this route requires — the redirect in the effect above
  // only fires after render, so without this check protected children
  // would flash on screen for one frame before the redirect happens.
  const authMismatch = authentication ? !isAuthenticated : isAuthenticated;
  if (!isInitialized || authMismatch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] text-sm font-semibold text-slate-500">
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthLayout;
