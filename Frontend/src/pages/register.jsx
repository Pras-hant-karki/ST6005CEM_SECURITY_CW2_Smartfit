// Register.jsx - Professional Registration Page with shadcn/ui
import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import Input from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HCaptcha from "@/components/ui/HCaptcha";
import { registerPatient } from "@/services/patientApi";
import { formatErrorMessage } from "../utils/formatError";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";
import { 
  Loader2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Calendar,
  Upload,
  UserCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth || {});

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const handleCaptchaVerify = useCallback((token) => setCaptchaToken(token), []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const password = watch("password");

  const makePatientUsername = (name = "", email = "") => {
    const base = (email.split("@")[0] || name || "patient")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 18);
    return `${base || "patient"}_${Date.now().toString(36).slice(-4)}`;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    const patientusername = makePatientUsername(data.patientname, data.email);
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.set("patientusername", patientusername);
    if (file) formData.append("profilepicture", file);
    if (captchaToken) formData.append("h-captcha-response", captchaToken);

    try {
      const res = await dispatch(registerPatient(formData));
      if (res.meta.requestStatus === "fulfilled") {
        if (res.payload?.data?.captchaRequired) {
          setCaptchaRequired(true);
          return;
        }
        toast.success("Registration successful! Welcome to SmartFit");
        navigate("/login");
      } else {
        toast.error(res.payload?.message || "Registration failed!");
      }
    } catch (err) {
      console.error("Registration Error:", err);
      toast.error("Something went wrong! Please try again.");
    }
  };

  return (

    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#eafff0] py-12 px-4">
      <img
        src="/assets/signup.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover blur-[3px] scale-105 opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-[#02B833]/20 to-white/60" />

      <div className="relative z-10 container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/82 shadow-2xl shadow-[#02B833]/15 backdrop-blur-2xl">
          <CardHeader className="space-y-2 border-b border-emerald-100/70 bg-white/55 px-6 py-7 sm:px-10">
            <CardTitle className="text-3xl font-black text-center tracking-tight text-slate-950">
              Patient Registration
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              Create your patient account for appointments, prescriptions, and lab reports.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-8 sm:px-10">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-7 [&_input]:mx-0 [&_input]:h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-4 [&_input]:shadow-sm [&_input]:focus-visible:border-[#02B833] [&_input]:focus-visible:ring-[#02B833]/20"
            >
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {formatErrorMessage(error, "Registration failed")}
                  </AlertDescription>
                </Alert>
              )}

              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center space-y-3 rounded-3xl border border-emerald-100 bg-emerald-50/45 py-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-white/70 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <label 
                    htmlFor="profile-upload"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#02B833] hover:bg-[#029E2C] rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors"
                  >
                    <Upload className="w-4 h-4 text-white" />
                  </label>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Profile Picture</p>
                  <p className="text-xs text-slate-500">Optional, but helpful for your patient profile</p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid gap-5 md:grid-cols-2">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="patientname" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Full Name *
                  </Label>
                  <Input
                    id="patientname"
                    placeholder="Enter your full name"
                    {...register("patientname", { 
                      required: "Full name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters"
                      }
                    })}
                    className={errors.patientname ? "border-red-500" : ""}
                  />
                  {errors.patientname && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.patientname.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-gray-500">
                    Must be a valid email address and contain @ (e.g. name@example.com)
                  </p>
                  {errors.email && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phonenumber" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phonenumber"
                    type="tel"
                    placeholder="+977 98XXXXXXXX"
                    {...register("phonenumber", { 
                      required: "Phone number is required",
                      pattern: {
                        value: /^[0-9+\s-()]+$/,
                        message: "Invalid phone number"
                      }
                    })}
                    className={errors.phonenumber ? "border-red-500" : ""}
                  />
                  {errors.phonenumber && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phonenumber.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      {...register("password", {
                        required: "Password is required",
                        validate: (v) => {
                          if (!v || v.length < 12) return "Password must be at least 12 characters";
                          if (!/[A-Z]/.test(v)) return "Password must contain at least one uppercase letter";
                          if (!/[a-z]/.test(v)) return "Password must contain at least one lowercase letter";
                          if (!/\d/.test(v)) return "Password must contain at least one number";
                          if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(v)) return "Password must contain at least one special character";
                          return true;
                        },
                      })}
                      className={`${errors.password ? "border-red-500" : ""} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    At least 12 characters, with an uppercase letter, a lowercase letter, a number, and a special character (!@#$%^&* etc.)
                  </p>
                  <PasswordStrengthMeter password={password} />
                  {errors.password && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (value) => value === password || "Passwords do not match"
                      })}
                      className={`${errors.confirmPassword ? "border-red-500" : ""} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Age *
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    placeholder="Enter your age"
                    {...register("age", { 
                      required: "Age is required",
                      min: {
                        value: 1,
                        message: "Age must be greater than 0"
                      },
                      max: {
                        value: 120,
                        message: "Please enter a valid age"
                      }
                    })}
                    className={errors.age ? "border-red-500" : ""}
                  />
                  {errors.age && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.age.message}
                    </p>
                  )}
                </div>

                {/* Sex */}
                <div className="space-y-2">
                  <Label htmlFor="sex">Gender *</Label>
                  <Select
                    onValueChange={(value) => setValue("sex", value)}
                  >
                    <SelectTrigger className={`h-12 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-[#02B833]/20 focus:border-[#02B833] ${errors.sex ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="border border-slate-200 bg-white shadow-xl">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("sex", { required: "Gender is required" })}
                  />
                  {errors.sex && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.sex.message}
                    </p>
                  )}
                </div>

                {/* Guardian Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="guardianName" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Guardian Name <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Input
                    id="guardianName"
                    placeholder="Enter guardian name if applicable"
                    {...register("guardianName")}
                  />
                  <p className="text-xs text-gray-500">
                    Required for patients under 18 years of age
                  </p>
                </div>
              </div>

              {captchaRequired && (
                <HCaptcha onVerify={handleCaptchaVerify} />
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl bg-[#02B833] hover:bg-[#029E2C] text-base font-bold shadow-lg shadow-[#02B833]/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Create Account
                  </>
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-[#02B833] hover:text-[#029E2C] font-semibold hover:underline"
                  >
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By registering, you agree to our{" "}
          <Link to="/terms" className="text-[#02B833] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-[#02B833] hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
