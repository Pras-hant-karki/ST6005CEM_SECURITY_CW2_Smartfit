import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutDoctor } from "@/services/doctorApi";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { clearAuthState } from "@/store/slices/authSlice";

const PUBLIC_HOME_URL = import.meta.env.VITE_PUBLIC_HOME_URL || "http://localhost:5173/";
const PUBLIC_LOGOUT_URL = `${PUBLIC_HOME_URL.replace(/\/$/, "")}/?clearPatientSession=1`;

const LogoutButton = ({ variant = "ghost", className = "" }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleLogout = async () => {
   try { 
      await dispatch(logoutDoctor()).unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(clearAuthState());
      window.location.assign(PUBLIC_LOGOUT_URL);
    }
  };
  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      disabled={loading}
      className={`gap-2 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Logging out...
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4" />
          Logout
        </>
      )}
    </Button>
  );
};

export default LogoutButton;
