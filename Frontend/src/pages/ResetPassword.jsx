import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { resetForgottenPassword, updatePassword } from "../services/patientApi";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import  Input  from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, ArrowLeft, AlertCircle, Shield } from "lucide-react";
import { formatErrorMessage } from "../utils/formatError";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";

function ResetPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isUpdate = location.state?.isUpdate || false;
  
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("newPassword");

  // Redirect if trying to access update flow without authentication
  useEffect(() => {
    if (isUpdate && !isAuthenticated) {
      navigate("/login");
    }
  }, [isUpdate, isAuthenticated, navigate]);

  const submitHandler = async (data) => {
    try {
      // Prepare payload based on flow type
      const payload = isUpdate 
        ? { 
            oldpassword: data.oldPassword, 
            newpassword: data.newPassword 
          }
        : { 
            newpassword: data.newPassword 
          };

      // Use different API based on flow type
      const action = isUpdate 
        ? updatePassword(payload) 
        : resetForgottenPassword(payload);
      
      const result = await dispatch(action);
      
      if (result.meta?.requestStatus === "fulfilled") {
        const message = isUpdate 
          ? "Password updated successfully!"
          : "Password reset successful! Please login with your new password.";
        
        const destination = isUpdate ? "/profile" : "/login";
        
        navigate(destination, { 
          state: { message }
        });
      }
    } catch (error) {
      console.error("Password operation failed:", error);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#eafff0] py-12">
      <img
        src="/assets/forgot.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover blur-[3px] scale-105 opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-[#02B833]/20 to-white/60" />

      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-[#f2fff5]/60 backdrop-blur-2xl shadow-2xl shadow-[#02B833]/15 border border-white/60">
            <CardHeader className="space-y-4 text-center">
              <div className="flex justify-center mb-2">
                <Badge variant="secondary" className="gap-2 bg-white/65 text-gray-800 border border-white/80">
                  <Shield className="w-4 h-4" />
                  {isUpdate ? "Update Password" : "Reset Password"}
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {isUpdate ? "Update Password" : "Reset Password"}
              </CardTitle>
              <p className="text-gray-600">
                {isUpdate 
                  ? "Change your current password"
                  : "Create a new password for your account"
                }
              </p>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit(submitHandler)}
                className="space-y-6 [&_input]:mx-0 [&_input]:w-full"
              >
                {/* Show old password field only for update flow */}
                {isUpdate && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Enter current password"
                        className="pl-10 bg-white/65 border-white/80 shadow-sm focus-visible:ring-[#02B833]/25 focus-visible:border-[#02B833]"
                        {...register("oldPassword", {
                          required: "Current password is required",
                        })}
                      />
                    </div>
                    {errors.oldPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.oldPassword.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        className="pl-10 bg-white/65 border-white/80 shadow-sm focus-visible:ring-[#02B833]/25 focus-visible:border-[#02B833]"
                      {...register("newPassword", {
                        required: "New password is required",
                        validate: (v) => {
                          if (!v || v.length < 12) return "Password must be at least 12 characters";
                          if (!/[A-Z]/.test(v)) return "Password must contain at least one uppercase letter";
                          if (!/[a-z]/.test(v)) return "Password must contain at least one lowercase letter";
                          if (!/\d/.test(v)) return "Password must contain at least one number";
                          if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(v)) return "Password must contain at least one special character";
                          return true;
                        },
                      })}
                    />
                  </div>
                  <PasswordStrengthMeter password={password} />
                  {errors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                      className="pl-10 bg-white/65 border-white/80 shadow-sm focus-visible:ring-[#02B833]/25 focus-visible:border-[#02B833]"
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (value) =>
                          value === password || "Passwords do not match",
                      })}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {formatErrorMessage(error, `Failed to ${isUpdate ? "update" : "reset"} password`)}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#02B833] hover:bg-[#029E2C] text-white rounded-full h-12 font-semibold shadow-lg shadow-[#02B833]/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isUpdate ? "Updating" : "Resetting"} Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      {isUpdate ? "Update" : "Reset"} Password
                    </>
                  )}
                </Button>

                {isUpdate && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate("/profile")}
                      className="gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
