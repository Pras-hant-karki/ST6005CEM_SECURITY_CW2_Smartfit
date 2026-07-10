import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Plus,
  ReceiptText,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Upload,
  User,
} from "lucide-react";

import AdminBrand from "@/components/custom/AdminBrand";
import LogoutButton from "@/components/custom/LogoutButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminCreateDoctor, adminGetAllDepartments } from "@/services/adminApi";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const navItems = [
  { label: "Overview", icon: ShieldCheck, path: "/" },
  { label: "Appointments", icon: Calendar, path: "/appointments" },
  { label: "Doctors", icon: User, path: "/doctors" },
  { label: "Departments", icon: Building2, path: "/departments" },
  { label: "Profile", icon: User, path: "/profile" },
];

const emptySchedule = {
  day: "",
  starttime: "",
  endtime: "",
  patientslot: 30,
};

const AddDoctor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { departments = [] } = useSelector((state) => state.admin);
  const [showPassword, setShowPassword] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [citizenshipDocument, setCitizenshipDocument] = useState(null);
  const [medicalDegree, setMedicalDegree] = useState(null);
  const [medicalLicense, setMedicalLicense] = useState(null);
  const [scheduleDraft, setScheduleDraft] = useState(emptySchedule);
  const [shifts, setShifts] = useState([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      consultationfee: "",
      experience: 0,
      age: "",
    },
  });

  useEffect(() => {
    dispatch(adminGetAllDepartments());
  }, [dispatch]);

  const departmentOptions = useMemo(
    () => departments.map((department) => department.deptname).filter(Boolean),
    [departments]
  );

  const addSchedule = () => {
    if (!scheduleDraft.day || !scheduleDraft.starttime || !scheduleDraft.endtime || !scheduleDraft.patientslot) {
      toast.error("Complete day, time, and patient slots before adding a schedule");
      return;
    }

    setShifts((current) => [
      ...current,
      {
        ...scheduleDraft,
        patientslot: Number(scheduleDraft.patientslot),
      },
    ]);
    setScheduleDraft(emptySchedule);
  };

  const removeSchedule = (index) => {
    setShifts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const onSubmit = async (data) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        formData.append(key, value);
      }
    });

    if (shifts.length > 0) formData.append("shift", JSON.stringify(shifts));
    if (profilePic) formData.append("profilepicture", profilePic);
    if (citizenshipDocument) formData.append("citizenshipdocument", citizenshipDocument);
    if (medicalDegree) formData.append("medicaldegree", medicalDegree);
    if (medicalLicense) formData.append("medicallicense", medicalLicense);

    setSaving(true);
    try {
      const result = await dispatch(adminCreateDoctor(formData));
      if (result.meta.requestStatus === "fulfilled") {
        toast.success("Doctor created successfully. Credentials were emailed if mail is configured.");
        reset();
        setProfilePic(null);
        setCitizenshipDocument(null);
        setMedicalDegree(null);
        setMedicalLicense(null);
        setShifts([]);
        navigate("/doctors");
      } else {
        toast.error(result.payload?.message || "Failed to create doctor");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="-m-4 min-h-screen bg-[#faf8ff] text-slate-950">
      <Toaster position="top-right" />
      <div className="grid min-h-screen lg:grid-cols-[214px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white/80 px-3 py-7 shadow-sm backdrop-blur lg:flex lg:flex-col">
          <AdminBrand onClick={() => navigate("/")} />
          <span className="mb-7 ml-3 w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            Admin Panel
          </span>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.path === "/doctors";
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-xs font-medium uppercase tracking-[0.12em] transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-slate-100 pt-5">
            <LogoutButton className="w-full justify-start bg-transparent text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-950" />
          </div>
        </aside>

        <main className="px-5 py-7 sm:px-8 lg:px-10">
          <Button variant="ghost" onClick={() => navigate("/doctors")} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Doctors
          </Button>

          <header className="mb-8">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Add New Doctor</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create login credentials now. The doctor can complete optional profile details later.
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 xl:grid-cols-[360px_1fr]">
            <div className="space-y-6">
              <section className="rounded-2xl bg-white/90 p-6 shadow-[0_18px_55px_rgba(88,80,120,0.09)]">
                <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
                  <Upload className="h-5 w-5 text-emerald-600" />
                  Profile Picture
                </h2>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setProfilePic(event.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {profilePic && <p className="mt-3 text-xs font-semibold text-emerald-700">{profilePic.name}</p>}
              </section>

              <section className="rounded-2xl bg-white/90 p-6 shadow-[0_18px_55px_rgba(88,80,120,0.09)]">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-black">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Verification Documents
                </h2>
                <p className="mb-5 text-sm text-slate-500">Optional for admin creation. Doctor can upload later.</p>

                {[
                  ["Citizenship Card", citizenshipDocument, setCitizenshipDocument],
                  ["Medical Degree", medicalDegree, setMedicalDegree],
                  ["Medical License", medicalLicense, setMedicalLicense],
                ].map(([label, file, setter]) => (
                  <div key={label} className="mb-5 last:mb-0">
                    <Label className="text-sm font-bold">{label}</Label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => setter(event.target.files?.[0] || null)}
                      className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    {file && <p className="mt-2 text-xs font-semibold text-emerald-700">{file.name}</p>}
                  </div>
                ))}
              </section>
            </div>

            <section className="rounded-2xl bg-white/90 p-6 shadow-[0_18px_55px_rgba(88,80,120,0.09)] sm:p-8">
              <div className="mb-6 flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-emerald-600" />
                <h2 className="text-2xl font-black">Doctor Information</h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input {...register("doctorname", { required: "Name is required" })} placeholder="Dr. Full Name" />
                  {errors.doctorname && <p className="text-xs font-semibold text-red-600">{errors.doctorname.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Mail className="h-4 w-4" />Email *</Label>
                  <Input type="email" {...register("email", { required: "Email is required" })} placeholder="doctor@smartfit.com" />
                  {errors.email && <p className="text-xs font-semibold text-red-600">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...register("password", {
                        required: "Password is required",
                        minLength: { value: 8, message: "Password must be at least 8 characters" },
                      })}
                      placeholder="At least 8 characters"
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
                      placeholder="800"
                      className="h-full w-full bg-transparent text-sm font-semibold outline-none"
                    />
                  </div>
                  {errors.consultationfee && <p className="text-xs font-semibold text-red-600">{errors.consultationfee.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Phone className="h-4 w-4" />Phone</Label>
                  <Input type="tel" {...register("phonenumber")} placeholder="98XXXXXXXX" />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Calendar className="h-4 w-4" />Age</Label>
                  <Input type="number" min="0" {...register("age")} placeholder="35" />
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
                  <Input {...register("qualification")} placeholder="MBBS, MD" />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Briefcase className="h-4 w-4" />Experience (Years)</Label>
                  <Input type="number" min="0" {...register("experience")} placeholder="0" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Specialization</Label>
                  <Input {...register("specialization")} placeholder="e.g. Pediatric Surgery" />
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-black">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Availability Schedule
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <select
                    value={scheduleDraft.day}
                    onChange={(event) => setScheduleDraft((current) => ({ ...current, day: event.target.value }))}
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none"
                  >
                    <option value="">Select day</option>
                    {days.map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                  <Input type="time" value={scheduleDraft.starttime} onChange={(event) => setScheduleDraft((current) => ({ ...current, starttime: event.target.value }))} />
                  <Input type="time" value={scheduleDraft.endtime} onChange={(event) => setScheduleDraft((current) => ({ ...current, endtime: event.target.value }))} />
                  <Input type="number" min="1" value={scheduleDraft.patientslot} onChange={(event) => setScheduleDraft((current) => ({ ...current, patientslot: event.target.value }))} />
                </div>
                <Button type="button" onClick={addSchedule} className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" />
                  Add Schedule
                </Button>

                {shifts.length > 0 ? (
                  <div className="mt-5 space-y-2">
                    {shifts.map((shift, index) => (
                      <div key={`${shift.day}-${shift.starttime}-${index}`} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm">
                        <span className="font-semibold">{shift.day}: {shift.starttime} - {shift.endtime} ({shift.patientslot} slots)</span>
                        <button type="button" onClick={() => removeSchedule(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">No schedules added yet. Doctor can add this later.</p>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={saving} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {saving ? "Creating..." : "Add New Doctor"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/doctors")} className="flex-1">
                  Cancel
                </Button>
              </div>
            </section>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddDoctor;
