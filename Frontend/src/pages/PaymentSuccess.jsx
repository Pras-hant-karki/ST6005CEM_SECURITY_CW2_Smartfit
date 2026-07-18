import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Receipt } from "lucide-react";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import { verifyPayment } from "@/services/paymentApi";
import { clearPaymentState } from "@/store/slices/paymentSlice";
import { getPaymentErrorMessage } from "../utils/formatError";

const formatAmount = (amount, currency) => {
  if (amount == null || !currency) return "N/A";
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
};

export default function PaymentSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { verifying, verifyError, paymentStatus } = useSelector((state) => state.payment || {});

  useEffect(() => {
    if (sessionId) dispatch(verifyPayment(sessionId));
    return () => dispatch(clearPaymentState());
  }, [dispatch, sessionId]);

  if (!sessionId) {
    return (
      <PatientPortalLayout title="Payment" subtitle="Payment confirmation">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl shadow-slate-200/60">
          <AlertCircle className="mx-auto mb-4 h-14 w-14 text-amber-400" />
          <h2 className="text-2xl font-black text-slate-950">No payment session found</h2>
          <p className="mt-2 text-slate-500">This page should be reached after completing a checkout.</p>
          <button
            onClick={() => navigate("/appointments")}
            className="mt-6 h-12 rounded-xl bg-[#02B833] px-6 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25"
          >
            Back to My Appointments
          </button>
        </div>
      </PatientPortalLayout>
    );
  }

  if (verifying) {
    return (
      <PatientPortalLayout title="Payment" subtitle="Confirming your payment">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  if (verifyError) {
    return (
      <PatientPortalLayout title="Payment" subtitle="Payment confirmation">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl shadow-slate-200/60">
          <AlertCircle className="mx-auto mb-4 h-14 w-14 text-red-400" />
          <h2 className="text-2xl font-black text-slate-950">Couldn't confirm your payment</h2>
          <p className="mt-2 text-slate-500">{getPaymentErrorMessage(verifyError)}</p>
          <button
            onClick={() => navigate("/appointments")}
            className="mt-6 h-12 rounded-xl bg-[#02B833] px-6 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25"
          >
            Back to My Appointments
          </button>
        </div>
      </PatientPortalLayout>
    );
  }

  const isPaid = paymentStatus?.status === "completed";

  return (
    <PatientPortalLayout title="Payment" subtitle="Payment confirmation">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60">
        <div className="flex flex-col items-center gap-3 border-b border-slate-100 p-10 text-center">
          {isPaid ? (
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          ) : (
            <AlertCircle className="h-16 w-16 text-amber-400" />
          )}
          <h2 className="text-3xl font-black text-slate-950">
            {isPaid ? "Payment Successful" : `Payment ${paymentStatus?.status || "Pending"}`}
          </h2>
          <p className="text-slate-500">
            {isPaid
              ? "Your consultation payment has been received."
              : "We're still waiting for confirmation from Stripe. This can take a moment."}
          </p>
        </div>

        <div className="grid gap-4 p-8 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Receipt className="h-5 w-5 text-emerald-600" />
              <p className="text-xs font-black uppercase tracking-[0.14em]">Amount Paid</p>
            </div>
            <p className="font-bold text-slate-900">
              {formatAmount(paymentStatus?.amount, paymentStatus?.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Status</p>
            <p className="font-bold capitalize text-slate-900">{paymentStatus?.status || "Unknown"}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 sm:col-span-2">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Appointment</p>
            <p className="font-bold text-slate-900">{paymentStatus?.appointmentId || "N/A"}</p>
          </div>
        </div>

        <div className="border-t border-slate-100 p-6">
          <button
            onClick={() => navigate("/appointments")}
            className="h-12 w-full rounded-xl bg-[#02B833] text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25"
          >
            Back to My Appointments
          </button>
        </div>
      </div>
    </PatientPortalLayout>
  );
}
