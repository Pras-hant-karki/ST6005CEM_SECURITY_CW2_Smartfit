import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Edit, Lock, Loader2, User } from "lucide-react";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import { getProfileDetails } from "@/services/patientApi";

const InfoField = ({ label, value, muted = false }) => (
  <div className="space-y-2">
    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <div className={`min-h-14 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-base ${muted ? "text-slate-400" : "text-slate-800"}`}>
      {value || "Not set"}
    </div>
  </div>
);

const PatientProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, loading } = useSelector((state) => state.patient || {});
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    dispatch(getProfileDetails());
  }, [dispatch]);

  if (loading || !profile) {
    return (
      <PatientPortalLayout title="My Profile" subtitle="Manage your personal information and security">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  return (
    <PatientPortalLayout title="My Profile" subtitle="Manage your personal information and security">
      <section className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 shrink-0">
            <img
              src={profile.profilepicture || "/placeholder-user.png"}
              alt={profile.patientname}
              className="h-28 w-28 rounded-2xl border-2 border-emerald-100 object-cover shadow-sm"
            />
            <button
              onClick={() => navigate("/profile/updateprofile")}
              className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#02B833] text-white shadow-lg shadow-emerald-500/30"
              aria-label="Edit profile picture"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-950">{profile.patientname}</h2>
            <p className="mt-1 text-lg font-extrabold text-[#02B833]">@{profile.patientusername}</p>
            <p className="mt-1 text-slate-400">Patient • SmartFit Medical Institute</p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex h-14 items-center justify-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] ${
            activeTab === "info" ? "bg-[#02B833] text-white" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <User className="h-4 w-4" />
          Personal Info
        </button>
        <button
          onClick={() => navigate("/update-password")}
          className="flex h-14 items-center justify-center gap-2 border-t border-slate-200 text-sm font-extrabold uppercase tracking-[0.08em] text-slate-500 hover:bg-slate-50 sm:border-l sm:border-t-0"
        >
          <Lock className="h-4 w-4" />
          Change Password
        </button>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-950">Personal Information</h3>
          <button
            onClick={() => navigate("/profile/updateprofile")}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InfoField label="Full Name" value={profile.patientname} />
          <InfoField label="Username" value={profile.patientusername} />
          <InfoField label="Email Address" value={profile.email} />
          <InfoField label="Phone Number" value={profile.phonenumber} />
          <InfoField label="Age" value={profile.age} />
          <InfoField label="Guardian Name (Optional)" value={profile.guardianName} muted={!profile.guardianName} />
          <InfoField label="Sex" value={profile.sex} />
        </div>
      </section>
    </PatientPortalLayout>
  );
};

export default PatientProfile;
