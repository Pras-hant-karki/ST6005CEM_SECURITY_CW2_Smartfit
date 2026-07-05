import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginPatient, logoutPatient } from "@/services/patientApi";
import { clearAuthState } from "@/store/slices/authSlice";
import { formatErrorMessage } from "../utils/formatError";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);

    const email = formData.email.trim();
    const password = formData.password;
    const doctorApi = axios.create({
      baseURL: import.meta.env.VITE_DOCTOR_API_BASE_URL || "http://localhost:8000/api/v1/doctor",
      withCredentials: true,
      timeout: 10000,
    });

    setRoleLoading(true);

    try {
      const doctorLogin = await doctorApi.post("/login", { email, doctorusername: email, password });
      const doctorAccessToken = doctorLogin.data?.data?.accesstoken;
      await dispatch(logoutPatient()).catch(() => null);
      dispatch(clearAuthState());
      const doctorPortalUrl = new URL(import.meta.env.VITE_DOCTOR_PORTAL_URL || "http://localhost:5175/");
      if (doctorAccessToken) {
        doctorPortalUrl.searchParams.set("accessToken", doctorAccessToken);
      }
      window.location.assign(doctorPortalUrl.toString());
      return;
    } catch {
      // Try patient login last so public users still use the same form.
    }

    const result = await dispatch(
      loginPatient({
        email,
        password,
      })
    );
    setRoleLoading(false);

    if (result.meta?.requestStatus === "fulfilled") {
      navigate("/dashboard");
      return;
    }

    setLoginError(result.payload || "No SmartFit account matched those credentials.");
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#eafff0] flex flex-col">
      <img
        src="/assets/login.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover blur-[3px] scale-105 opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-[#02B833]/20 to-white/55" />

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#f2fff5]/60 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-[#02B833]/15 border border-white/60 p-7 sm:p-9">
            <div className="text-center space-y-3 mb-10">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
              <p className="text-gray-500 text-sm">Please enter your details to access SmartFit</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="yourmail@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/65 border border-white/80 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#02B833]/25 focus:border-[#02B833] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/65 border border-white/80 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#02B833]/25 focus:border-[#02B833] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-[#02B833] focus:ring-[#02B833]"
                  />
                  <span className="text-sm text-gray-600">Remember Me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-[#02B833] hover:text-[#029E2C] transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading || roleLoading}
                className="w-full h-14 rounded-xl bg-[#02B833] hover:bg-[#029E2C] text-white text-base font-bold shadow-lg shadow-[#02B833]/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                {loading || roleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            {loginError && (
              <p className="mt-4 text-center text-sm font-medium text-red-600">
                {formatErrorMessage(loginError, "Login failed")}
              </p>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                New to SmartFit?{" "}
                <Link to="/register" className="font-semibold text-[#02B833] hover:text-[#029E2C] transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
