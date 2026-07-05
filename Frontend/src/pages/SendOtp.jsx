import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { sendForgotPasswordOtp, sendOtpForUpdate, getCurrentPatient } from "../services/patientApi";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import  Input  from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowLeft, AlertCircle, Phone } from "lucide-react";
import { formatErrorMessage } from "../utils/formatError";

function SendOtp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user, isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  const [deliveryMethod, setDeliveryMethod] = useState("email");

  // Fetch current user on mount to restore state after refresh
  useEffect(() => {
    if (!isInitialized) {
      dispatch(getCurrentPatient());
    }
  }, [dispatch, isInitialized]);

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: isAuthenticated ? user?.email : ""
    }
  });

  // Show loading while initializing user state
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02B833]/10 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#02B833] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const submitHandler = async (data) => {
    try {
      const email = isAuthenticated ? user?.email : data.email;
      const phonenumber = data.phonenumber;
      const payload = isAuthenticated
        ? { email }
        : deliveryMethod === "phone"
          ? { phonenumber }
          : { email };

      if (!payload.email && !payload.phonenumber) {
        console.error("Email or phone number is required");
        return;
      }

      const action = isAuthenticated 
        ? sendOtpForUpdate(payload) 
        : sendForgotPasswordOtp(payload);
      
      const result = await dispatch(action);
      
      if (result.meta?.requestStatus === "fulfilled") {
        navigate("/verify-otp", { 
          state: { 
            email,
            phonenumber: payload.phonenumber,
            deliveryMethod,
            isUpdate: isAuthenticated,
          },
          replace: true
        });
      }
    } catch (error) {
      console.error("Failed to send OTP:", error);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#eafff0] flex items-center justify-center px-6 py-12">
      <img
        src="/assets/forgot.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover blur-[3px] scale-105 opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-[#02B833]/20 to-white/60" />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#f2fff5]/60 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-[#02B833]/15 p-7 sm:p-9">
        <button
          type="button"
          onClick={() => navigate(isAuthenticated ? "/profile" : "/login")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#02B833] hover:text-[#029E2C]"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAuthenticated ? "Back to Profile" : "Back to Login"}
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {isAuthenticated ? "Update Password" : "Forgot Password?"}
          </h1>
          <p className="mt-3 text-gray-500 leading-relaxed">
            {isAuthenticated
              ? `We'll send an OTP to ${user?.email} to verify it's you.`
              : "No worries! Choose email or phone number and we'll send your reset OTP."}
          </p>
        </div>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          {!isAuthenticated && (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/45 p-1.5 border border-white/65 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod("email");
                    clearErrors(["email", "phonenumber"]);
                  }}
                  className={`h-11 rounded-xl text-sm font-semibold transition-all ${
                    deliveryMethod === "email"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod("phone");
                    clearErrors(["email", "phonenumber"]);
                  }}
                  className={`h-11 rounded-xl text-sm font-semibold transition-all ${
                    deliveryMethod === "phone"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Phone
                </button>
              </div>

              {deliveryMethod === "email" ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="yourmail@gmail.com"
                      className="mx-0 w-full pl-12 pr-4 h-14 rounded-2xl bg-white/65 border-white/80 shadow-sm focus-visible:ring-[#02B833]/25 focus-visible:border-[#02B833]"
                      {...register("email", {
                        required: deliveryMethod === "email" ? "Email is required" : false,
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="+977 98XXXXXXXX"
                      className="mx-0 w-full pl-12 pr-4 h-14 rounded-2xl bg-white/65 border-white/80 shadow-sm focus-visible:ring-[#02B833]/25 focus-visible:border-[#02B833]"
                      {...register("phonenumber", {
                        required: deliveryMethod === "phone" ? "Phone number is required" : false,
                        pattern: {
                          value: /^[0-9+\s-()]{7,20}$/,
                          message: "Invalid phone number",
                        },
                      })}
                    />
                  </div>
                  {errors.phonenumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.phonenumber.message}</p>
                  )}
                </div>
              )}
            </>
          )}

          {isAuthenticated && (
            <div className="p-4 bg-[#02B833]/10 rounded-xl border border-[#02B833]/20">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-[#02B833]" />
                <p className="text-sm text-gray-600">OTP will be sent to:</p>
              </div>
              <p className="font-semibold text-gray-900">{user?.email}</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formatErrorMessage(error, "Failed to send OTP")}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-[#02B833] hover:bg-[#029E2C] text-base font-bold shadow-lg shadow-[#02B833]/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Reset OTP"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default SendOtp;
