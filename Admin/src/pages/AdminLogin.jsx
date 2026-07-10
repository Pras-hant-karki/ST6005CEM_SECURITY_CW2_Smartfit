import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import HCaptcha from "@/components/ui/HCaptcha";
import { adminLogin, verifyMfaAdmin } from "@/services/adminApi";
import { clearAuthState } from "@/store/slices/authSlice";
import {
  Loader2,
  Shield,
  Mail,
  Lock,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [mfaRequired, setMfaRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [mfaError, setMfaError] = useState(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const handleCaptchaVerify = useCallback((token) => setCaptchaToken(token), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    dispatch(clearAuthState());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    const identifier = data.email?.trim();
    const payload = {
      email: identifier,
      adminusername: identifier,
      password: data.password,
    };
    if (captchaToken) payload["h-captcha-response"] = captchaToken;
    const res = await dispatch(adminLogin(payload));

    if (res.meta.requestStatus === "fulfilled") {
      if (res.payload?.captchaRequired) {
        setCaptchaRequired(true);
        return;
      }
      if (res.payload?.mfaRequired) {
        setMfaRequired(true);
        setCaptchaRequired(false);
        setCaptchaToken("");
        return;
      }
      toast.success("Login Successful!");
      navigate("/");
    } else {
      toast.error(res.payload?.message || "Login failed!");
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setMfaError(null);
    setOtpLoading(true);
    const res = await dispatch(verifyMfaAdmin({ otp: otp.trim() }));
    setOtpLoading(false);
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Login Successful!");
      navigate("/");
    } else {
      setMfaError(res.payload?.message || "OTP verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">

      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-indigo-700 hover:text-indigo-900"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-600">Secure Login</p>
        </div>

        <Card className="border-0 shadow-xl">
          {!mfaRequired ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
                <CardDescription className="text-center">
                  Access the administration dashboard
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error?.message || "Login failed. Try again."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      Username / Email
                    </Label>
                    <Input
                      placeholder="admin@example.com"
                      {...register("email", { required: "Email or username required" })}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      {...register("password", { required: "Password is required" })}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.password.message}
                      </p>
                    )}
                  </div>

                  {captchaRequired && (
                    <HCaptcha onVerify={handleCaptchaVerify} />
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-base bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Logging in...</>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-2">
                  <ShieldCheck className="w-12 h-12 text-indigo-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">Verify Your Identity</CardTitle>
                <CardDescription className="text-center">
                  A 6-digit code has been sent to your registered email. Enter it below to complete login.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleMfaSubmit} className="space-y-5">
                  {mfaError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{mfaError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-center text-2xl font-mono tracking-widest"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={otpLoading || otp.length < 6}
                    className="w-full h-11 text-base bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90"
                  >
                    {otpLoading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Verifying...</>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setMfaRequired(false); setOtp(""); setMfaError(null); setCaptchaRequired(false); setCaptchaToken(""); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Back to login
                  </button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          Authorized Access Only. All actions are monitored.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
