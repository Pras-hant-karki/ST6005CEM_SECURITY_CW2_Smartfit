import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <PatientPortalLayout title="Payment" subtitle="Payment cancelled">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60">
        <div className="flex flex-col items-center gap-3 border-b border-slate-100 p-10 text-center">
          <XCircle className="h-16 w-16 text-rose-500" />
          <h2 className="text-3xl font-black text-slate-950">Payment Cancelled</h2>
          <p className="text-slate-500">
            You cancelled the checkout before it completed. No payment was taken and your
            appointment is unaffected.
          </p>
        </div>

        <div className="grid gap-3 p-6 sm:grid-cols-2">
          <button
            onClick={() => navigate("/billing")}
            className="h-12 rounded-xl bg-[#02B833] text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25"
          >
            Retry Payment
          </button>
          <button
            onClick={() => navigate("/appointments")}
            className="h-12 rounded-xl border border-slate-200 text-sm font-black uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-50"
          >
            Back to My Appointments
          </button>
        </div>
      </div>
    </PatientPortalLayout>
  );
}
