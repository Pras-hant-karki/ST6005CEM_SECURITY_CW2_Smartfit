import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Loader2,
  Stethoscope,
  XCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import AppointmentCancelModal from "@/components/custom/AppointmentCancelModal";
import { cancelAppointment, getAppointmentDetails } from "@/services/appointmentApi";
import { formatErrorMessage } from "../utils/formatError";

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const statusStyle = (status = "") => {
  const value = status.toLowerCase();
  if (value.includes("complete")) return "bg-slate-200 text-slate-600";
  if (value.includes("cancel")) return "bg-rose-100 text-rose-700";
  if (value.includes("confirm")) return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
};

export default function AppointmentDetails() {
  const { appointmentid } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const { appointmentDetails, loading, error } = useSelector((state) => state.appointment || {});

  const fetchAppointment = () => {
    dispatch(getAppointmentDetails(appointmentid));
  };

  useEffect(() => {
    fetchAppointment();
  }, [dispatch, appointmentid]);

  const handleCancelConfirm = async () => {
    await dispatch(cancelAppointment(appointmentid));
    setOpenModal(false);
    fetchAppointment();
  };

  const copyCode = async () => {
    const code = appointmentDetails?.uniquecode;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success("Appointment code copied");
  };

  if (loading && !appointmentDetails) {
    return (
      <PatientPortalLayout title="Appointment Details" subtitle="View and manage your appointment">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  if (error) {
    return (
      <PatientPortalLayout title="Appointment Details" subtitle="View and manage your appointment">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <AlertCircle className="mb-2 h-5 w-5" />
          {formatErrorMessage(error, "Failed to load appointment")}
        </div>
      </PatientPortalLayout>
    );
  }

  if (!appointmentDetails) return null;

  const {
    doctordetails = {},
    symptoms,
    medicalhistory,
    appointmentdate,
    appointmenttime,
    status = "Pending",
    uniquecode,
  } = appointmentDetails;
  const canModify = !["cancelled", "completed"].includes(status.toLowerCase());

  return (
    <PatientPortalLayout title="Appointment Details" subtitle="Your visit information and verification code">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/appointments")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </button>

        <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60">
          <div className="flex flex-col gap-5 border-b border-slate-100 p-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-4xl font-black tracking-tight text-slate-950">
                  {doctordetails.specialization || doctordetails.department || "Consultation"}
                </h2>
                <span className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${statusStyle(status)}`}>
                  {status}
                </span>
              </div>
              <p className="mt-4 text-xl text-slate-500">
                With Dr. {doctordetails.doctorname || "Doctor unavailable"}
              </p>
              <p className="mt-2 text-slate-500">SmartFit Clinic</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 px-6 py-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Date</p>
                <p className="mt-2 text-lg font-black text-[#02B833]">{formatDate(appointmentdate)}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-6 py-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Time</p>
                <p className="mt-2 text-lg font-black text-[#02B833]">{appointmenttime || "Time unavailable"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBlock icon={Stethoscope} label="Department" value={doctordetails.department || "Not set"} />
                <InfoBlock icon={CheckCircle2} label="Qualification" value={doctordetails.qualification || "Not set"} />
                <InfoBlock icon={Activity} label="Symptoms" value={symptoms || "Not provided"} />
                <InfoBlock icon={FileText} label="Medical History" value={medicalhistory || "No medical history provided"} />
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <button
                  onClick={() => navigate(`/appointments/updateAppointment/${appointmentid}`)}
                  disabled={!canModify}
                  className="h-13 rounded-xl bg-[#02B833] text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  Reschedule Appointment
                </button>
                <button
                  onClick={() => setOpenModal(true)}
                  disabled={!canModify}
                  className="h-13 rounded-xl border border-red-300 text-sm font-black uppercase tracking-[0.08em] text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  Cancel Appointment
                </button>
              </div>
            </div>

            <aside className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                Doctor Verification Code
              </p>
              <div className="my-6 rounded-2xl border border-emerald-200 bg-white px-6 py-8 shadow-sm">
                <p className="select-all text-5xl font-black tracking-[0.3em] text-slate-950">
                  {uniquecode || "------"}
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Show this code to your doctor at the hospital. Only your logged-in patient account can view it here.
              </p>
              <button
                type="button"
                onClick={copyCode}
                disabled={!uniquecode}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copy Code
              </button>
            </aside>
          </div>

          {!canModify && (
            <div className="border-t border-slate-100 bg-slate-50 px-8 py-4 text-sm font-semibold text-slate-500">
              This appointment cannot be changed because it is {status}.
            </div>
          )}
        </section>
      </div>

      <AppointmentCancelModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onConfirm={handleCancelConfirm}
      />
    </PatientPortalLayout>
  );
}

function InfoBlock({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
      <div className="mb-3 flex items-center gap-2 text-slate-500">
        <Icon className="h-5 w-5 text-emerald-600" />
        <p className="text-xs font-black uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}
