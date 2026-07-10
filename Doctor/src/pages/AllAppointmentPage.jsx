import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, CalendarDays, FileText, FlaskConical, Loader2 } from "lucide-react";
import DoctorSidebar from "@/components/custom/DoctorSidebar";
import { getAllAppointments, getTodayAppointments } from "@/services/appointmentApi";

const statusClasses = {
  Confirmed: "bg-emerald-50 text-emerald-700",
  Completed: "bg-teal-50 text-teal-700",
  Pending: "bg-amber-50 text-amber-700",
  Cancelled: "bg-red-50 text-red-700",
};

const getInitials = (name) =>
  String(name || "Patient")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "P";

const formatAgeTime = (appointment) => {
  const age = appointment?.patientdetails?.age;
  const time = appointment?.appointmenttime || "Time not set";
  return `${age ? `Age ${age} · ` : ""}${time}`;
};

const getPatientName = (appointment) =>
  appointment?.patientdetails?.patientname || appointment?.patientdetails?.patientusername || "Registered patient";

const AppointmentRow = ({ appointment, onDetails, onPrescription, onLabTest }) => {
  const patientName = getPatientName(appointment);
  const status = appointment.status || "Pending";

  return (
    <article className="grid gap-4 rounded-2xl bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(16,185,129,0.11)] lg:grid-cols-[56px_1fr_auto] lg:items-center">
      <button
        type="button"
        onClick={onDetails}
        className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-50 text-lg font-extrabold text-emerald-700"
        aria-label={`View appointment for ${patientName}`}
      >
        {getInitials(patientName)}
      </button>

      <button type="button" onClick={onDetails} className="min-w-0 text-left">
        <h2 className="truncate text-lg font-extrabold text-slate-900">{patientName}</h2>
        <p className="mt-1 text-sm text-slate-400">{formatAgeTime(appointment)}</p>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
          {appointment.symptoms || "No symptoms provided"}
        </p>
      </button>

      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <span className={`rounded-full px-3 py-2 text-xs font-bold ${statusClasses[status] || statusClasses.Pending}`}>
          {status}
        </span>
        <button
          type="button"
          onClick={onPrescription}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          <FileText className="h-4 w-4" />
          Write Rx
        </button>
        <button
          type="button"
          onClick={onLabTest}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <FlaskConical className="h-4 w-4" />
          Lab Test
        </button>
      </div>
    </article>
  );
};

const AllAppointmentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: doctor } = useSelector((state) => state.auth);
  const { appointments = [], todayappointments = [], loading, error } = useSelector(
    (state) => state.doctorAppointment
  );

  const isTodayPage = location.pathname === "/todayappointments";

  useEffect(() => {
    dispatch(getTodayAppointments());
    dispatch(getAllAppointments());
  }, [dispatch]);

  const visibleAppointments = useMemo(() => {
    const data = isTodayPage ? todayappointments : appointments;
    return [...data].sort((a, b) => {
      if (isTodayPage) {
        return String(a.appointmenttime || "").localeCompare(String(b.appointmenttime || ""));
      }
      return new Date(b.appointmentdate || b.createdAt || 0) - new Date(a.appointmentdate || a.createdAt || 0);
    });
  }, [appointments, todayappointments, isTodayPage]);

  return (
    <div className="-m-4 flex min-h-screen bg-[#f8f5ff] font-sans text-slate-900">
      <DoctorSidebar doctor={doctor} />

      <main className="min-w-0 flex-1 px-7 py-8 lg:px-10">
        <header>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Appointments</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage real appointments booked by registered patients.
          </p>
        </header>

        <div className="mt-12 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/todayappointments")}
            className={`rounded-xl px-7 py-3 text-sm font-extrabold uppercase tracking-[0.14em] transition ${
              isTodayPage
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            Today's
          </button>
          <button
            type="button"
            onClick={() => navigate("/appointments")}
            className={`rounded-xl px-7 py-3 text-sm font-extrabold uppercase tracking-[0.14em] transition ${
              !isTodayPage
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            All Appointments
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error?.message || "Could not load appointments."}
          </div>
        )}

        <section className="mt-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl bg-white/80 py-20 text-slate-500 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading appointments...
            </div>
          ) : visibleAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 py-20 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <CalendarDays className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-4 text-lg font-extrabold text-slate-800">
                {isTodayPage ? "No appointments today" : "No appointments found"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Patient bookings assigned to this doctor will appear here automatically.
              </p>
            </div>
          ) : (
            visibleAppointments.map((appointment) => (
              <AppointmentRow
                key={appointment._id}
                appointment={appointment}
                onDetails={() => navigate(`/appointments/${appointment._id}`)}
                onPrescription={() => navigate(`/prescription/${appointment._id}/createprescription`)}
                onLabTest={() => navigate("/labtests")}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default AllAppointmentsPage;
