import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Edit, FileText, Loader2, ShieldCheck, Upload } from "lucide-react";
import DoctorSidebar from "@/components/custom/DoctorSidebar";
import { getDoctorProfile } from "@/services/doctorApi";

const titleCase = (value) =>
  String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const detailValue = (value) => value || "Not set";

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
      {detailValue(value)}
    </div>
  </div>
);

const DocumentRow = ({ label, href }) => (
  <a
    href={href || "#"}
    target={href ? "_blank" : undefined}
    rel={href ? "noopener noreferrer" : undefined}
    onClick={(event) => {
      if (!href) event.preventDefault();
    }}
    className="flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 transition hover:bg-emerald-100/60"
  >
    <span className="flex min-w-0 items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-slate-500">
        <FileText className="h-4 w-4" />
      </span>
      <span className="truncate text-sm font-extrabold text-slate-800">{label}</span>
    </span>
    <span className="shrink-0 text-xs font-bold text-emerald-700">
      {href ? "Verified" : "Missing"}
    </span>
  </a>
);

const DoctorProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { profile, loading, error } = useSelector((state) => state.doctor);
  const doctor = profile || user;
  const profileImage = doctor?.verificationdocument?.profilepicture || doctor?.profilepicture;
  const department = titleCase(doctor?.department || "Department not set");
  const experience = doctor?.experience ? `${doctor.experience} years experience` : "Experience not set";

  useEffect(() => {
    dispatch(getDoctorProfile());
  }, [dispatch]);

  return (
    <div className="-m-4 flex min-h-screen bg-[#f8f5ff] font-sans text-slate-900">
      <DoctorSidebar doctor={doctor} />

      <main className="min-w-0 flex-1 px-7 py-8 lg:px-10">
        <header>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Doctor Profile</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your professional information.</p>
        </header>

        {error && (
          <div className="mt-8 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error?.message || "Could not load doctor profile."}
          </div>
        )}

        {loading && !doctor ? (
          <div className="mt-12 flex items-center justify-center rounded-2xl bg-white/85 py-20 text-slate-500 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading profile...
          </div>
        ) : (
          <div className="mt-12 max-w-5xl space-y-7">
            <section className="rounded-2xl bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-emerald-50">
                  {profileImage ? (
                    <img src={profileImage} alt={doctor?.doctorname || "Doctor"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-3xl font-extrabold text-emerald-700">
                      {(doctor?.doctorname || "D").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white shadow-lg">
                    <Edit className="h-4 w-4" />
                  </span>
                </div>

                <div className="min-w-0">
                  <h2 className="text-2xl font-extrabold text-slate-900">Dr. {detailValue(doctor?.doctorname)}</h2>
                  <p className="mt-1 font-bold text-emerald-600">{department}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {experience} • SmartFit Medical Institute
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Doctor
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-extrabold text-slate-900">Professional Details</h2>
                <button
                  type="button"
                  onClick={() => navigate("/profile/updateprofile")}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-5 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="Full Name" value={doctor?.doctorname ? `Dr. ${doctor.doctorname}` : ""} />
                <Field label="Email" value={doctor?.email} />
                <Field label="Phone" value={doctor?.phonenumber} />
                <Field label="Specialization" value={doctor?.specialization} />
                <Field label="Qualification" value={doctor?.qualification} />
                <Field label="Experience" value={doctor?.experience ? `${doctor.experience} years` : ""} />
                <Field
                  label="Consultation Fee"
                  value={doctor?.consultationfee !== undefined ? `NPR ${doctor.consultationfee} / session` : ""}
                />
              </div>
            </section>

            <section className="rounded-2xl bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white">
              <h2 className="text-xl font-extrabold text-slate-900">Verification Documents</h2>
              <div className="mt-5 space-y-3">
                <DocumentRow label="Citizenship Card" href={doctor?.verificationdocument?.citizenshipdocument} />
                <DocumentRow label="Medical Degree" href={doctor?.verificationdocument?.medicaldegree} />
                <DocumentRow label="Medical License" href={doctor?.verificationdocument?.medicallicense} />
              </div>
              <button
                type="button"
                onClick={() => navigate("/profile/updateprofile")}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-sm font-bold text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Upload className="h-4 w-4" />
                Upload New Document
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorProfile;
