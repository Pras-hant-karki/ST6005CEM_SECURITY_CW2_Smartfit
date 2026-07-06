import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Calendar, Loader2, MapPin, XCircle } from "lucide-react";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import { cancelAppointment, getAllAppointments } from "@/services/appointmentApi";
import AppointmentCancelModal from "@/components/custom/AppointmentCancelModal";

const formatDate = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const normalizeStatus = (appointment) => appointment?.status || appointment?.appointmentstatus || "Scheduled";

const statusClass = (status = "") => {
  const value = status.toLowerCase();
  if (value.includes("complete")) return "bg-slate-200 text-slate-600";
  if (value.includes("cancel")) return "bg-rose-100 text-rose-700";
  if (value.includes("confirm") || value.includes("upcoming")) return "bg-emerald-100 text-emerald-700";
  return "bg-teal-100 text-teal-700";
};

const appointmentTitle = (doctor = {}) => doctor?.specialization || doctor?.department || "General Checkup";

export default function AllAppointments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [cancelTarget, setCancelTarget] = useState(null);
  const { appointments = [], loading, error } = useSelector((state) => state.appointment || {});

  useEffect(() => {
    dispatch(getAllAppointments());
  }, [dispatch]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await dispatch(cancelAppointment(cancelTarget._id));
    setCancelTarget(null);
    dispatch(getAllAppointments());
  };

  if (loading && !appointments.length) {
    return (
      <PatientPortalLayout title="My Appointments" subtitle="View and manage all your scheduled appointments">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  if (error) {
    return (
      <PatientPortalLayout title="My Appointments" subtitle="View and manage all your scheduled appointments">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <AlertCircle className="mb-2 h-5 w-5" />
          Failed to load appointments.
        </div>
      </PatientPortalLayout>
    );
  }

  return (
    <PatientPortalLayout title="My Appointments" subtitle="View and manage all your scheduled appointments">
      {appointments.length ? (
        <div className="space-y-5">
          {appointments.map((appointment) => {
            const doctor = appointment.doctordetails || appointment.doctor || {};
            const status = normalizeStatus(appointment);
            const canModify = !["cancelled", "completed"].includes(status.toLowerCase());

            return (
              <article
                key={appointment._id}
                className="grid gap-6 rounded-3xl bg-white p-7 shadow-xl shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-200/80 lg:grid-cols-[1fr_auto]"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/appointments/${appointment._id}`)}
                  className="text-left"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      {appointmentTitle(doctor)}
                    </h2>
                    <span className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${statusClass(status)}`}>
                      {status === "Confirmed" ? "Upcoming" : status}
                    </span>
                  </div>
                  <p className="mt-5 text-xl text-slate-500">With Dr. {doctor?.doctorname || "Doctor unavailable"}</p>
                  <p className="mt-4 flex items-center gap-2 text-base text-slate-500">
                    <MapPin className="h-5 w-5 text-pink-400" />
                    SmartFit Clinic
                  </p>
                </button>

                <div className="flex flex-col gap-5 sm:flex-row lg:items-end">
                  <div className="min-w-36">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Date</p>
                    <p className="mt-2 text-2xl font-black text-[#02B833]">{formatDate(appointment.appointmentdate)}</p>
                  </div>
                  <div className="min-w-32">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Time</p>
                    <p className="mt-2 text-2xl font-black text-[#02B833]">{appointment.appointmenttime || "Time not set"}</p>
                  </div>

                  {canModify && (
                    <div className="flex gap-3 lg:ml-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/appointments/updateAppointment/${appointment._id}`)}
                        className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-50"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(appointment)}
                        className="rounded-xl border border-red-300 px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xl shadow-slate-200/60">
          <Calendar className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h3 className="text-2xl font-black text-slate-950">No appointments yet</h3>
          <p className="mt-2 text-slate-500">Book an appointment with an available SmartFit doctor.</p>
          <button
            onClick={() => navigate("/doctors")}
            className="mt-8 rounded-xl bg-[#02B833] px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25"
          >
            Browse Doctors
          </button>
        </div>
      )}

      <AppointmentCancelModal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </PatientPortalLayout>
  );
}
