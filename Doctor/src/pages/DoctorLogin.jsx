import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HCaptcha from "@/components/ui/HCaptcha";
import { loginDoctor, verifyMfaDoctor } from "@/services/doctorApi";
import { Loader2, Mail, Lock, Stethoscope, AlertCircle, ShieldCheck } from "lucide-react";

const DoctorLogin = () => {
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
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    const payload = { ...data };
    if (captchaToken) payload["h-captcha-response"] = captchaToken;
    const res = await dispatch(loginDoctor(payload));
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
      toast.success("Login successful!");
      navigate("/");
    } else {
      toast.error(res.payload?.message || "Login failed!");
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setMfaError(null);
    setOtpLoading(true);
    const res = await dispatch(verifyMfaDoctor({ otp: otp.trim() }));
    setOtpLoading(false);
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Login successful!");
      navigate("/");
    } else {
      setMfaError(res.payload?.message || "OTP verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-linear-to-br from-teal-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">SmartFit</h1>
          </div>
          <p className="text-gray-600">Doctor Portal</p>
        </div>

        <Card className="shadow-xl border-0">
          {!mfaRequired ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Doctor Login</CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error.message || "Login failed. Please try again."}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@example.com"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      {...register("password", { required: "Password is required" })}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      Forgot Password?
                    </Button>
                  </div>

                  {captchaRequired && (
                    <HCaptcha onVerify={handleCaptchaVerify} />
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-base font-medium bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Logging in...</>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>

                <div className="text-center pt-6 border-t mt-6">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate("/register")}
                      className="text-teal-600 hover:text-teal-700 font-semibold hover:underline"
                    >
                      Register here
                    </Button>
                  </p>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-2">
                  <ShieldCheck className="w-12 h-12 text-teal-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">Verify Your Identity</CardTitle>
                <CardDescription className="text-center">
                  A 6-digit code has been sent to your registered email. Enter it below to complete login.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMfaSubmit} className="space-y-4">
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
                    className="w-full h-11 text-base font-medium bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                  >
                    {otpLoading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Verifying...</>
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
          For medical professionals only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
};

export default DoctorLogin;
