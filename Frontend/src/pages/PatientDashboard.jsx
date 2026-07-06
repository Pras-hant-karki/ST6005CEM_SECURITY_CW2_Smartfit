import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  Droplet,
  Heart,
  Loader2,
  MoreVertical,
  TestTube2,
} from "lucide-react";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import { getProfileDetails } from "@/services/patientApi";
import { getAllAppointments } from "@/services/appointmentApi";
import { getAllLabTests } from "@/services/labtestApi";

const patientCode = (patient) => {
  const raw = patient?._id || patient?.patientusername || patient?.email || "0000";
  return `SF-${raw.toString().slice(-4).toUpperCase()}`;
};

const formatDate = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const daysLeft = (value) => {
  if (!value) return null;
  const today = new Date();
  const date = new Date(value);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.ceil((date - today) / (1000 * 60 * 60 * 24)));
};

const getDoctor = (appointment) => appointment?.doctor || appointment?.doctorid || {};

const getAppointmentFee = (appointment) => {
  const doctor = getDoctor(appointment);
  const fee = Number(doctor?.consultationfee || appointment?.consultationfee || 0);
  return Number.isFinite(fee) ? fee : 0;
};

const getLabName = (lab) => lab?.tests?.[0]?.test_name || lab?.testname || "Lab test";
const getLabStatus = (lab) => lab?.overall_status || lab?.tests?.[0]?.status || "ordered";
const getLabDepartment = (lab) => {
  const test = lab?.tests?.[0]?.test_name || "";
  if (/blood|cbc/i.test(test)) return "Hematology";
  if (/lipid|heart/i.test(test)) return "Cardiology";
  if (/glucose|sugar/i.test(test)) return "Endocrinology";
  return "Diagnostics";
};

export default function PatientDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useSelector((state) => state.patient || {});
  const { appointments = [], loading: appointmentLoading } = useSelector((state) => state.appointment || {});
  const { labTests = [], loading: labLoading } = useSelector((state) => state.labtest || {});

  useEffect(() => {
    dispatch(getProfileDetails());
    dispatch(getAllAppointments());
    dispatch(getAllLabTests());
  }, [dispatch]);

  const visibleAppointments = [...appointments].filter((appointment) => {
    const status = String(appointment?.status || appointment?.appointmentstatus || "").toLowerCase();
    return !status.includes("cancel");
  });

  const nextAppointment = visibleAppointments
    .sort((a, b) => new Date(a.appointmentdate || 0) - new Date(b.appointmentdate || 0))[0];

  const doctor = getDoctor(nextAppointment);
  const fee = getAppointmentFee(nextAppointment);
  const left = daysLeft(nextAppointment?.appointmentdate);
  const recentLabs = labTests.slice(0, 3);

  if ((profileLoading && !profile) || appointmentLoading || labLoading) {
    return (
      <PatientPortalLayout title="Dashboard" subtitle="Your health status at a glance">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  return (
    <PatientPortalLayout showHeader={false}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-16 flex flex-col gap-8 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-slate-950 lg:text-6xl">
              Welcome back, {profile?.patientname?.split(" ")?.[0] || "Patient"}
            </h1>
            <p className="mt-4 text-xl text-slate-500">Your health status is looking optimal today.</p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-lg font-black text-slate-950">{profile?.patientname || "SmartFit Patient"}</p>
              <p className="text-sm font-semibold text-emerald-700">Patient ID: {patientCode(profile)}</p>
            </div>
            <div className="relative">
              <img
                src={profile?.profilepicture || "/placeholder-user.png"}
                alt={profile?.patientname || "Patient"}
                className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
              />
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-[#02B833]" />
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70">
            {nextAppointment ? (
              <div className="grid gap-8 lg:grid-cols-[1fr_240px] lg:items-center">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
                    <CalendarDays className="h-5 w-5" />
                    Upcoming Session
                  </span>
                  <h2 className="mt-8 text-4xl font-black tracking-tight text-slate-950">
                    {doctor?.department || doctor?.specialization || "Consultation"}
                  </h2>
                  <p className="mt-3 text-xl text-slate-500">
                    With Dr. {doctor?.doctorname || "Doctor"} • SmartFit Medical Center
                  </p>

                  <div className="mt-10 grid max-w-md grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Date</p>
                      <p className="mt-2 text-2xl font-black text-[#02B833]">{formatDate(nextAppointment.appointmentdate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Time</p>
                      <p className="mt-2 text-2xl font-black text-[#02B833]">{nextAppointment.appointmenttime || "Time not set"}</p>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <button className="rounded-xl bg-[#02B833] px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25">
                      Add to Calendar
                    </button>
                    <button
                      onClick={() => navigate(`/appointments/updateAppointment/${nextAppointment._id}`)}
                      className="rounded-xl border border-slate-200 px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-50"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>

                <div className="grid h-60 w-60 place-items-center rounded-full bg-emerald-50/70">
                  <div className="text-center">
                    <p className="text-6xl font-black text-[#02B833]">{String(left ?? 0).padStart(2, "0")}</p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Days Left</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-80 flex-col justify-center">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
                  <CalendarDays className="h-5 w-5" />
                  No Upcoming Session
                </span>
                <h2 className="mt-8 text-4xl font-black text-slate-950">Book your next consultation</h2>
                <p className="mt-3 text-xl text-slate-500">Choose an available doctor and schedule your visit.</p>
                <button
                  onClick={() => navigate("/doctors")}
                  className="mt-10 w-fit rounded-xl bg-[#02B833] px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25"
                >
                  Book Appointment
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-950">Billing Status</h2>
              <MoreVertical className="h-5 w-5 text-slate-500" />
            </div>
            <div className="mt-12 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Outstanding Balance</p>
              <p className="mt-4 text-6xl font-black text-slate-950">NPR {fee.toLocaleString("en-US")}</p>
              <span className="mt-8 inline-flex rounded-full bg-emerald-100 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-emerald-700">
                {fee ? "Due at visit" : "No pending bill"}
              </span>
              <button
                disabled={!fee}
                className="mt-12 h-14 w-full rounded-xl bg-teal-700 text-sm font-black uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                Pay Now
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-950">Recent Lab Results</h2>
              <button onClick={() => navigate("/labtests")} className="text-sm font-black uppercase tracking-[0.12em] text-[#02B833]">
                View All
              </button>
            </div>

            {recentLabs.length ? (
              <div className="space-y-5">
                {recentLabs.map((lab, index) => {
                  const status = getLabStatus(lab);
                  const normal = /completed|normal/i.test(status);
                  return (
                    <button
                      key={lab._id || index}
                      onClick={() => navigate(`/labtests/${lab._id}`)}
                      className="grid w-full grid-cols-[72px_1fr_auto_auto] items-center gap-4 rounded-2xl border border-slate-100 p-5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/30"
                    >
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">
                        {index === 0 ? <Droplet className="h-8 w-8 text-rose-500" /> : index === 1 ? <Heart className="h-8 w-8 text-rose-500" /> : <TestTube2 className="h-8 w-8 text-cyan-500" />}
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-950">{getLabName(lab)}</p>
                        <p className="mt-1 text-slate-500">Uploaded recently • {getLabDepartment(lab)}</p>
                      </div>
                      <span className={`text-sm font-black uppercase tracking-[0.1em] ${normal ? "text-teal-700" : "text-amber-700"}`}>
                        {normal ? "Normal" : status}
                      </span>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                <TestTube2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-bold text-slate-700">No lab results yet</p>
                <p className="mt-1 text-sm text-slate-500">Results ordered by your doctor will appear here.</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70">
            <h2 className="text-2xl font-black text-slate-950">Health Snapshot</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-6">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Heart Rate</p>
                <p className="mt-4 text-3xl font-black text-[#02B833]">-- <span className="text-base font-semibold text-slate-500">BPM</span></p>
                <div className="mt-6 h-2 rounded-full bg-emerald-100">
                  <div className="h-2 w-1/2 rounded-full bg-[#02B833]" />
                </div>
              </div>
              <div className="rounded-2xl bg-teal-50 p-6">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Blood Pressure</p>
                <p className="mt-4 text-3xl font-black text-teal-700">--/-- <span className="text-base font-semibold text-slate-500">MMHG</span></p>
                <div className="mt-6 h-2 rounded-full bg-teal-100">
                  <div className="h-2 w-1/2 rounded-full bg-teal-700" />
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-100 p-6">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Daily Activity</p>
              <p className="mt-2 text-2xl font-black text-slate-950">Not connected</p>
              <p className="mt-2 text-sm text-slate-500">Vitals and activity need backend/device support.</p>
            </div>
          </div>
        </section>
      </div>
    </PatientPortalLayout>
  );
}
