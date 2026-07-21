import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, CheckCircle2, ClipboardCheck, FileText, Loader2, Microscope, Pill, Search, User } from "lucide-react";
import DoctorSidebar from "@/components/custom/DoctorSidebar";
import { getTodayAppointments, getAllAppointments } from "@/services/appointmentApi";
import { getAllPrescriptions } from "@/services/prescriptionApi";
import { getAllLabTests } from "@/services/labtestApi";

const titleCase = (value) =>
  String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const formatStatus = (status) => status || "Pending";

const getLocalDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const todayKey = () => getLocalDateKey(new Date());

const statusClasses = {
  Confirmed: "bg-emerald-50 text-emerald-700",
  Completed: "bg-teal-50 text-teal-700",
  Pending: "bg-amber-50 text-amber-700",
  Cancelled: "bg-red-50 text-red-700",
};

const StatCard = ({ icon: Icon, value, label, tone = "emerald" }) => {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-2xl bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-2xl bg-white/90 p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(16,185,129,0.14)]"
  >
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
      <Icon className="h-5 w-5" />
    </span>
    <span className="mt-4 block text-sm font-bold text-slate-700">{label}</span>
  </button>
);

const DoctorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: doctor, loading: authLoading } = useSelector((state) => state.auth);
  const {
    todayappointments = [],
    appointments = [],
    loading: appointmentsLoading,
    error: appointmentError,
  } = useSelector((state) => state.doctorAppointment);
  const { prescriptions = [] } = useSelector((state) => state.prescription);
  const { labtests = [] } = useSelector((state) => state.labtest);

  useEffect(() => {
    dispatch(getTodayAppointments());
    dispatch(getAllAppointments());
    dispatch(getAllPrescriptions());
    dispatch(getAllLabTests());
  }, [dispatch]);

  const todaySchedule = useMemo(() => {
    const byId = new Map();
    [...todayappointments, ...appointments].forEach((appointment) => {
      if (getLocalDateKey(appointment.appointmentdate) === todayKey()) {
        byId.set(appointment._id, appointment);
      }
    });
    return [...byId.values()].sort((a, b) =>
        String(a.appointmenttime || "").localeCompare(String(b.appointmenttime || ""))
      );
  }, [appointments, todayappointments]);

  const completedToday = useMemo(
    () => todaySchedule.filter((appointment) => appointment.status === "Completed").length,
    [todaySchedule]
  );

  const pendingLabTests = useMemo(
    () => labtests.filter((test) => test.overall_status !== "completed").length,
    [labtests]
  );

  const doctorName = doctor?.doctorname || "Doctor";
  const department = titleCase(doctor?.department || "Department not set");
  // Localized to the schedule section, and only on its own first load (no
  // data yet) — prescriptions/lab tests loading independently shouldn't
  // block the appointment schedule from rendering, and once appointments
  // have loaded once, a background refresh keeps showing the stale list
  // instead of flashing a spinner over it.
  const isScheduleLoading = (authLoading || appointmentsLoading) && todaySchedule.length === 0;

  return (
    <div className="-m-4 flex min-h-screen bg-[#f8f5ff] font-sans text-slate-900">
      <DoctorSidebar doctor={doctor} />

      <main className="min-w-0 flex-1 px-7 py-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              {getGreeting()}, Dr. {doctorName}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              You have {todaySchedule.length} appointment{todaySchedule.length === 1 ? "" : "s"} today
            </p>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            {department}
          </span>
        </header>

        {appointmentError && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {appointmentError?.message || "Could not load doctor dashboard data."}
          </div>
        )}

        <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarCheck} value={todaySchedule.length} label="Today's Appointments" tone="emerald" />
          <StatCard icon={CheckCircle2} value={completedToday} label="Completed Today" tone="sky" />
          <StatCard icon={Pill} value={prescriptions.length} label="Active Prescriptions" tone="amber" />
          <StatCard icon={Microscope} value={pendingLabTests} label="Pending Lab Tests" tone="violet" />
        </section>

        <section className="mt-8 rounded-2xl bg-white/90 p-7 shadow-[0_22px_55px_rgba(15,23,42,0.07)] ring-1 ring-white">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold text-slate-900">Today's Schedule</h2>
            <button
              type="button"
              onClick={() => navigate("/appointments")}
              className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 hover:text-emerald-700"
            >
              View All
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {isScheduleLoading ? (
              <div className="flex items-center justify-center rounded-xl border border-slate-100 py-12 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading real appointments...
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
                <p className="font-bold text-slate-700">No appointments today</p>
                <p className="mt-1 text-sm text-slate-500">New patient bookings will appear here automatically.</p>
              </div>
            ) : (
              todaySchedule.map((appointment) => {
                const patient = appointment.patientdetails;
                const status = formatStatus(appointment.status);
                return (
                  <button
                    type="button"
                    key={appointment._id}
                    onClick={() => navigate(`/appointments/${appointment._id}`)}
                    className="grid w-full grid-cols-1 items-center gap-3 rounded-xl border border-slate-100 px-5 py-4 text-left transition hover:border-emerald-100 hover:bg-emerald-50/30 md:grid-cols-[90px_1fr_auto]"
                  >
                    <span className="font-extrabold text-emerald-600">{appointment.appointmenttime}</span>
                    <span className="border-slate-100 md:border-l md:pl-5">
                      <span className="block font-bold text-slate-800">{patient?.patientname || "Registered patient"}</span>
                      <span className="mt-1 block text-sm text-slate-500">{appointment.symptoms || "No symptoms provided"}</span>
                    </span>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusClasses[status] || statusClasses.Pending}`}>
                      {status}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <QuickAction icon={Search} label="Verify Appointment" onClick={() => navigate("/verify-appointment")} />
          <QuickAction
            icon={FileText}
            label="New Prescription"
            onClick={() => {
              const completed = appointments.find((appointment) => appointment.status === "Completed");
              navigate(completed ? `/prescription/${completed._id}/createprescription` : "/appointments");
            }}
          />
          <QuickAction icon={ClipboardCheck} label="Order Lab Test" onClick={() => navigate("/prescriptions")} />
          <QuickAction icon={User} label="View Profile" onClick={() => navigate("/profile")} />
        </section>
      </main>
    </div>
  );
};

export default DoctorDashboard;
