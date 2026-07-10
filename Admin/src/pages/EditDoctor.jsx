import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  ReceiptText,
  Save,
  Stethoscope,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminGetAllDepartments,
  adminGetDoctorDetails,
  adminUpdateDoctor,
} from "@/services/adminApi";

const EditDoctor = () => {
  const { doctorid } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { doctorDetails, departments = [], loading } = useSelector((state) => state.admin);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    dispatch(adminGetDoctorDetails(doctorid));
    dispatch(adminGetAllDepartments());
  }, [dispatch, doctorid]);

  useEffect(() => {
    if (!doctorDetails) return;
    reset({
      doctorname: doctorDetails.doctorname || "",
      email: doctorDetails.email || "",
      password: "",
      consultationfee: doctorDetails.consultationfee ?? 0,
      phonenumber: doctorDetails.phonenumber || "",
      age: doctorDetails.age || "",
      sex: doctorDetails.sex || "",
      department: doctorDetails.department || "",
      qualification: doctorDetails.qualification || "",
      experience: doctorDetails.experience ?? 0,
      specialization: doctorDetails.specialization || "",
    });
  }, [doctorDetails, reset]);

  const departmentOptions = useMemo(
    () => departments.map((department) => department.deptname).filter(Boolean),
    [departments]
  );

  const onSubmit = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "password" && !value) return;
      if (value !== undefined && value !== null) formData.append(key, value);
    });

    setSaving(true);
    try {
      const result = await dispatch(adminUpdateDoctor({ doctorid, formData }));
      if (result.meta.requestStatus === "fulfilled") {
        toast.success("Doctor updated successfully");
        navigate("/doctors");
      } else {
        toast.error(result.payload?.message || "Failed to update doctor");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !doctorDetails) {
    return (
      <div className="-m-4 flex min-h-screen items-center justify-center bg-[#faf8ff] text-sm font-semibold text-slate-500">
        Loading doctor...
      </div>
    );
  }

  return (
    <div className="-m-4 min-h-screen bg-[#faf8ff] px-5 py-7 text-slate-950 sm:px-8 lg:px-10">
      <Toaster position="top-right" />
      <Button variant="ghost" onClick={() => navigate("/doctors")} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Doctors
      </Button>

      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Edit Doctor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Admin can update doctor identity, fee, credentials, and profile basics.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-5xl rounded-2xl bg-white/90 p-6 shadow-[0_18px_55px_rgba(88,80,120,0.09)] sm:p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-emerald-600" />
          <h2 className="text-2xl font-black">Doctor Information</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><User className="h-4 w-4" />Full Name *</Label>
            <Input {...register("doctorname", { required: "Name is required" })} />
            {errors.doctorname && <p className="text-xs font-semibold text-red-600">{errors.doctorname.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Mail className="h-4 w-4" />Email *</Label>
            <Input type="email" {...register("email", { required: "Email is required" })} />
            {errors.email && <p className="text-xs font-semibold text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  minLength: { value: 8, message: "Password must be at least 8 characters" },
                })}
                placeholder="Leave blank to keep current password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs font-semibold text-red-600">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><ReceiptText className="h-4 w-4" />Consultation Fee *</Label>
            <div className="flex h-11 items-center rounded-md border border-slate-200 bg-white px-3">
              <span className="mr-2 text-sm font-black text-emerald-700">NPR</span>
              <input
                type="number"
                min="0"
                step="1"
                {...register("consultationfee", { required: "Consultation fee is required", min: 0 })}
                className="h-full w-full bg-transparent text-sm font-semibold outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Phone className="h-4 w-4" />Phone</Label>
            <Input type="tel" {...register("phonenumber")} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Calendar className="h-4 w-4" />Age</Label>
            <Input type="number" min="0" {...register("age")} />
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <select {...register("sex")} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500">
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Building2 className="h-4 w-4" />Department</Label>
            <select {...register("department")} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500">
              <option value="">Select department</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><GraduationCap className="h-4 w-4" />Qualification</Label>
            <Input {...register("qualification")} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Briefcase className="h-4 w-4" />Experience (Years)</Label>
            <Input type="number" min="0" {...register("experience")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Specialization</Label>
            <Input {...register("specialization")} />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={saving} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Doctor"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/doctors")} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditDoctor;
