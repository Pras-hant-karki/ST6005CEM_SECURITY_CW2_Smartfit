import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, FlaskConical, Loader2, Search } from "lucide-react";
import DoctorSidebar from "@/components/custom/DoctorSidebar";
import { getAllAppointments, getTodayAppointments, verifyappointment } from "@/services/appointmentApi";

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const formatDate = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const VerifyAppointment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: doctor } = useSelector((state) => state.auth);
  const { appointments = [], todayappointments = [], loading } = useSelector((state) => state.doctorAppointment);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [verifiedAppointment, setVerifiedAppointment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(getTodayAppointments());
    dispatch(getAllAppointments());
  }, [dispatch]);

  const searchableAppointments = useMemo(() => {
    const merged = [...todayappointments, ...appointments];
    return merged.filter(
      (appointment, index, all) => appointment?._id && all.findIndex((item) => item?._id === appointment._id) === index
    );
  }, [appointments, todayappointments]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setMessage("");
    setVerifiedAppointment(null);

    const enteredCode = normalizeCode(code);
    if (!enteredCode) {
      setMessage("Appointment code is required.");
      return;
    }

    const matchingAppointment = searchableAppointments.find(
      (appointment) => normalizeCode(appointment.uniquecode) === enteredCode
    );

    if (!matchingAppointment) {
      setMessage("No appointment for this doctor matches that code.");
      return;
    }

    if (matchingAppointment.status === "Cancelled") {
      setMessage("Cancelled appointments cannot be verified.");
      return;
    }

    if (matchingAppointment.status === "Completed") {
      setVerifiedAppointment(matchingAppointment);
      setMessage("");
      return;
    }

    setSubmitting(true);
    const result = await dispatch(
      verifyappointment({
        appointmentid: matchingAppointment._id,
        code: enteredCode,
      })
    );
    setSubmitting(false);

    if (result.meta.requestStatus === "fulfilled") {
      setVerifiedAppointment(result.payload || { ...matchingAppointment, status: "Completed" });
      setCode("");
      dispatch(getTodayAppointments());
      dispatch(getAllAppointments());
      return;
    }

    setMessage(result.payload?.message || "Could not verify appointment.");
  };

  const patient = verifiedAppointment?.patientdetails;

  return (
    <div className="-m-4 flex min-h-screen bg-[#f8f5ff] font-sans text-slate-900">
      <DoctorSidebar doctor={doctor} />

      <main className="min-w-0 flex-1 px-7 py-8 lg:px-10">
        <header>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Verify Appointment</h1>
          <p className="mt-2 text-sm text-slate-500">Confirm patient appointments using their unique appointment code.</p>
        </header>

        <section className="mt-12 max-w-xl rounded-2xl bg-white/90 p-8 shadow-[0_22px_55px_rgba(15,23,42,0.07)] ring-1 ring-white">
          <div className="grid h-16 w-16 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <Search className="h-8 w-8" />
          </div>

          <form onSubmit={handleVerify} className="mt-6 space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Appointment Code Verification</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter the code provided by the patient after booking.
              </p>
            </div>

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Appointment Code</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Enter appointment code"
                className="mt-2 h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-lg font-semibold uppercase tracking-[0.28em] text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {message && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || submitting}
              className="flex h-14 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-extrabold uppercase tracking-[0.14em] text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading || submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying
                </>
              ) : (
                "Verify Appointment"
              )}
            </button>
          </form>
        </section>

        {verifiedAppointment && (
          <section className="mt-6 max-w-xl rounded-2xl bg-white/90 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.07)] ring-1 ring-white">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Appointment Verified</h2>
                <p className="mt-1 text-sm font-semibold text-emerald-600">Code: {verifiedAppointment.uniquecode}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-4">
                <dt className="text-slate-500">Patient</dt>
                <dd className="text-right font-bold text-slate-900">{patient?.patientname || "Registered patient"}</dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-4">
                <dt className="text-slate-500">Date & Time</dt>
                <dd className="text-right font-bold text-slate-900">
                  {formatDate(verifiedAppointment.appointmentdate)} · {verifiedAppointment.appointmenttime}
                </dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-4">
                <dt className="text-slate-500">Symptoms</dt>
                <dd className="text-right font-bold text-slate-900">{verifiedAppointment.symptoms || "No symptoms provided"}</dd>
              </div>
            </dl>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate(`/prescription/${verifiedAppointment._id}/createprescription`)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-700"
              >
                <FileText className="h-4 w-4" />
                Write Prescription
              </button>
              <button
                type="button"
                onClick={() => navigate("/prescriptions")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50"
              >
                <FlaskConical className="h-4 w-4" />
                Order Lab Test
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default VerifyAppointment;
