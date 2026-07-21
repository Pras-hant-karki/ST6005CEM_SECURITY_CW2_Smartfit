import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, Edit, Loader2, ShieldAlert, Trash2, Upload, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import {
  getProfileDetails,
  updateProfile,
  updateProfilePic,
  exportMyData,
  sendDeleteAccountOtp,
  deleteMyAccount,
} from "@/services/patientApi";
import { formatErrorMessage } from "../utils/formatError";

const Field = ({ label, error, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
      {label}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs font-semibold text-red-500">
        <AlertCircle className="h-3 w-3" />
        {error.message}
      </p>
    )}
  </div>
);

const inputClass =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#02B833] focus:ring-4 focus:ring-emerald-100";

const UpdateProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, loading, error } = useSelector((state) => state.patient || {});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pictureSaving, setPictureSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const fetchProfile = () => {
    dispatch(getProfileDetails());
  };

  useEffect(() => {
    fetchProfile();
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      reset({
        patientname: profile.patientname || "",
        email: profile.email || "",
        phonenumber: profile.phonenumber || "",
        age: profile.age || "",
        sex: profile.sex || "",
        guardianName: profile.guardianName || "",
      });
      setPreview(profile.profilepicture);
    }
  }, [profile, reset]);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }, [file]);

  const onSubmit = async (data) => {
    setProfileSaving(true);
    try {
      const res = await dispatch(updateProfile(data));
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Profile updated successfully!");
        fetchProfile();
        navigate("/profile");
      } else {
        toast.error(res.payload?.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Something went wrong!");
    } finally {
      setProfileSaving(false);
    }
  };

  const onPictureSubmit = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const pictureFormData = new FormData();
    pictureFormData.append("profilepicture", file);

    setPictureSaving(true);
    try {
      const response = await dispatch(updateProfilePic(pictureFormData));
      if (response.meta.requestStatus === "fulfilled") {
        toast.success("Profile picture updated successfully!");
        fetchProfile();
        setFile(null);
      } else {
        toast.error(response.payload?.message || "Failed to update profile picture");
      }
    } catch (err) {
      toast.error("Something went wrong while updating profile picture!");
    } finally {
      setPictureSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await dispatch(exportMyData());
      if (res.meta.requestStatus === "fulfilled") {
        const { blob, filename } = res.payload;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Your data export PDF has started downloading.");
      } else {
        toast.error(res.payload?.message || "Failed to export data");
      }
    } finally {
      setExporting(false);
    }
  };

  const handleSendDeleteOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await dispatch(sendDeleteAccountOtp());
      if (res.meta.requestStatus === "fulfilled") {
        setOtpSent(true);
        toast.success("A verification code has been emailed to you.");
      } else {
        toast.error(res.payload?.message || "Failed to send verification code");
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Enter your password to confirm account deletion");
      return;
    }
    if (!deleteOtp) {
      toast.error("Enter the verification code emailed to you");
      return;
    }
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      toast.error('Type "DELETE" to confirm this is permanent');
      return;
    }
    setDeleting(true);
    try {
      const res = await dispatch(deleteMyAccount({ password: deletePassword, otp: deleteOtp }));
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Account deleted. Goodbye!");
        window.location.href = "/";
      } else {
        toast.error(res.payload?.message || "Failed to delete account");
      }
    } finally {
      setDeleting(false);
      setDeletePassword("");
      setDeleteOtp("");
    }
  };

  if (loading && !profile) {
    return (
      <PatientPortalLayout title="Edit Profile" subtitle="Update your personal information">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  return (
    <PatientPortalLayout title="Edit Profile" subtitle="Update your personal information and profile photo">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/profile")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </button>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-3xl bg-white p-7 shadow-xl shadow-slate-200/60">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-slate-950">
              <User className="h-5 w-5 text-emerald-600" />
              Profile Picture
            </h2>

            <div className="flex flex-col items-center text-center">
              <img
                src={preview || profile?.profilepicture || "/placeholder-user.png"}
                alt="Profile"
                className="h-36 w-36 rounded-full border-4 border-emerald-100 object-cover shadow-lg"
              />
              <label className="mt-6 block w-full cursor-pointer rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
                Choose Profile Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {file && <p className="mt-3 max-w-full truncate text-sm text-slate-500">{file.name}</p>}
              <Button
                type="button"
                onClick={onPictureSubmit}
                disabled={!file || pictureSaving}
                className="mt-5 h-12 w-full rounded-xl bg-[#02B833] font-bold hover:bg-[#029E2C]"
              >
                {pictureSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload Picture
              </Button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-7 shadow-xl shadow-slate-200/60">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-slate-950">
              <Edit className="h-5 w-5 text-emerald-600" />
              Personal Information
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Full Name" error={errors.patientname}>
                  <input
                    className={inputClass}
                    {...register("patientname", { required: "Full name is required" })}
                  />
                </Field>

                <Field label="Email Address" error={errors.email}>
                  <input
                    type="email"
                    className={inputClass}
                    {...register("email", { required: "Email is required" })}
                  />
                </Field>

                <Field label="Phone Number" error={errors.phonenumber}>
                  <input
                    type="tel"
                    className={inputClass}
                    {...register("phonenumber", { required: "Phone number is required" })}
                  />
                </Field>

                <Field label="Age" error={errors.age}>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    className={inputClass}
                    {...register("age", {
                      required: "Age is required",
                      min: { value: 1, message: "Age must be greater than 0" },
                      max: { value: 120, message: "Please enter a valid age" },
                    })}
                  />
                </Field>

                <Field label="Gender" error={errors.sex}>
                  <select className={inputClass} {...register("sex", { required: "Gender is required" })}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Guardian Name">
                  <input className={inputClass} placeholder="Optional" {...register("guardianName")} />
                </Field>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formatErrorMessage(error, "Error updating profile")}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-3 pt-3 sm:grid-cols-2">
                <Button
                  type="submit"
                  disabled={profileSaving}
                  className="h-12 rounded-xl bg-[#02B833] font-bold hover:bg-[#029E2C]"
                >
                  {profileSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Update Profile
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  className="h-12 rounded-xl font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-7 shadow-xl shadow-slate-200/60">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-black text-slate-950">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Your Data & Privacy
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Download a copy of your profile, appointment, and prescription records, or permanently delete your account.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportData}
                disabled={exporting}
                className="h-12 w-full rounded-xl font-bold"
              >
                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download My Data
              </Button>
            </div>

            <div>
              {!confirmingDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmingDelete(true)}
                  className="h-12 w-full rounded-xl font-bold"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold text-red-700">
                    This permanently deletes your account. Your appointment, prescription, and payment
                    history is retained for medical/financial records but is no longer linked to a login.
                  </p>

                  <input
                    type="password"
                    placeholder="Current password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={inputClass}
                  />

                  {!otpSent ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendDeleteOtp}
                      disabled={sendingOtp}
                      className="h-11 w-full rounded-xl font-bold"
                    >
                      {sendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Email me a verification code
                    </Button>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Verification code from your email"
                      value={deleteOtp}
                      onChange={(e) => setDeleteOtp(e.target.value)}
                      className={inputClass}
                    />
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-red-700">
                      Type DELETE to confirm
                    </label>
                    <input
                      type="text"
                      placeholder="DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleting || !otpSent}
                      className="h-11 flex-1 rounded-xl font-bold"
                    >
                      {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Confirm Delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setConfirmingDelete(false);
                        setDeletePassword("");
                        setDeleteOtp("");
                        setDeleteConfirmText("");
                        setOtpSent(false);
                      }}
                      className="h-11 flex-1 rounded-xl font-bold"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </PatientPortalLayout>
  );
};

export default UpdateProfile;
