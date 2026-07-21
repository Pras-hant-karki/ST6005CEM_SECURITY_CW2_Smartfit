import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import HCaptcha from "@/components/ui/HCaptcha";
import { loginPatient, verifyMfaOtp } from "@/services/patientApi";
import { formatErrorMessage } from "../utils/formatError";

export default function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state) => state.auth);

    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState(null);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [captchaRequired, setCaptchaRequired] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const handleCaptchaVerify = useCallback((token) => setCaptchaToken(token), []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);

        const email = formData.email.trim();
        const password = formData.password;
        const captchaPayload = captchaToken ? { "h-captcha-response": captchaToken } : {};

        const result = await dispatch(loginPatient({ email, password, ...captchaPayload }));

        if (result.meta?.requestStatus === "fulfilled") {
            const data = result.payload?.data;
            if (data?.captchaRequired) {
                setCaptchaRequired(true);
                return;
            }
            if (data?.mfaRequired) {
                setMfaRequired(true);
                setCaptchaRequired(false);
                setCaptchaToken("");
                return;
            }
            navigate("/dashboard");
            return;
        }

        setLoginError(result.payload || "No SmartFit account matched those credentials.");
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);
        setOtpLoading(true);

        try {
            const result = await dispatch(verifyMfaOtp({ otp: otp.trim() }));
            if (result.meta?.requestStatus === "fulfilled") {
                navigate("/dashboard");
                return;
            }
            setLoginError(result.payload || "OTP verification failed. Please try again.");
        } finally {
            setOtpLoading(false);
        }
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

                        {!mfaRequired ? (
                            <>
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

                                    <div className="flex justify-end">
                                        <Link to="/forgot-password" className="text-sm font-semibold text-[#02B833] hover:text-[#029E2C] transition-colors">
                                            Forgot Password?
                                        </Link>
                                    </div>

                                    {captchaRequired && (
                                        <HCaptcha onVerify={handleCaptchaVerify} />
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 rounded-xl bg-[#02B833] hover:bg-[#029E2C] text-white text-base font-bold shadow-lg shadow-[#02B833]/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Logging in...
                                            </>
                                        ) : (
                                            "Login"
                                        )}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <>
                                <div className="text-center space-y-3 mb-10">
                                    <div className="flex justify-center mb-3">
                                        <ShieldCheck className="w-12 h-12 text-[#02B833]" />
                                    </div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Verify Your Identity</h1>
                                    <p className="text-gray-500 text-sm">
                                        A 6-digit code has been sent to your registered email address. Enter it below to complete login.
                                    </p>
                                </div>

                                <form onSubmit={handleMfaSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Verification Code</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]{6}"
                                            maxLength={6}
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            className="w-full h-14 px-4 text-center text-2xl font-mono tracking-widest rounded-2xl bg-white/65 border border-white/80 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#02B833]/25 focus:border-[#02B833] transition-all"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={otpLoading || otp.length < 6}
                                        className="w-full h-14 rounded-xl bg-[#02B833] hover:bg-[#029E2C] text-white text-base font-bold shadow-lg shadow-[#02B833]/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        {otpLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            "Verify & Sign In"
                                        )}
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => { setMfaRequired(false); setOtp(""); setLoginError(null); setCaptchaRequired(false); setCaptchaToken(""); }}
                                        className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        ← Back to login
                                    </button>
                                </form>
                            </>
                        )}

                        {loginError && (
                            <p className="mt-4 text-center text-sm font-medium text-red-600">
                                {formatErrorMessage(loginError, "Login failed")}
                            </p>
                        )}

                        {!mfaRequired && (
                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-500">
                                    New to SmartFit?{" "}
                                    <Link to="/register" className="font-semibold text-[#02B833] hover:text-[#029E2C] transition-colors">
                                        Create Account
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
