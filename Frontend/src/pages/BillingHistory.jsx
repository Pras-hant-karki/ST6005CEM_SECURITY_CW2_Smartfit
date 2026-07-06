import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Landmark,
  Loader2,
  LockKeyhole,
  Smartphone,
  WalletCards,
  X,
} from "lucide-react";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import { getAllAppointments } from "@/services/appointmentApi";

const formatDate = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const invoiceCode = (appointment) =>
  `INV-${new Date(appointment.createdAt || Date.now()).getFullYear()}-${String(appointment._id || "")
    .slice(-4)
    .toUpperCase()}`;

const invoiceTitle = (appointment) => {
  const doctor = appointment.doctordetails || appointment.doctor || {};
  return doctor.specialization || doctor.department || "Doctor Consultation";
};

const getDoctorName = (appointment) => {
  const doctor = appointment.doctordetails || appointment.doctor || {};
  return doctor.doctorname || "SmartFit Doctor";
};

const amount = (appointment) => {
  const doctor = appointment.doctordetails || appointment.doctor || {};
  const fee = Number(doctor.consultationfee || appointment.consultationfee || 0);
  return Number.isFinite(fee) ? fee : 0;
};

const getPaymentStatus = (appointment) => {
  if (String(appointment.status || "").toLowerCase().includes("cancel")) return "Cancelled";
  return appointment.paymentstatus || appointment.paymentStatus || "Unpaid";
};

const statusClass = (status) => {
  if (status === "Paid") return "bg-emerald-100 text-teal-700";
  if (status === "Cancelled") return "bg-slate-200 text-slate-600";
  return "bg-amber-100 text-amber-800";
};

const paymentMethods = [
  {
    id: "card",
    title: "Card Payment",
    subtitle: "Visa, Mastercard, debit or credit card",
    icon: CreditCard,
  },
  {
    id: "stripe",
    title: "Stripe Checkout",
    subtitle: "Secure hosted payment page",
    icon: WalletCards,
  },
  {
    id: "wallet",
    title: "Digital Wallet",
    subtitle: "Connect Khalti/eSewa later",
    icon: Smartphone,
  },
];

const DetailRow = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <p className="mt-2 text-base font-bold text-slate-900">{value}</p>
  </div>
);

const Gateway = ({ invoice, onClose }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("card");
  const fee = amount(invoice);
  const platformFee = fee ? Math.round(fee * 0.02) : 0;
  const total = fee + platformFee;

  const finishPayment = () => {
    toast("Payment processing is not connected yet. Backend payment intent/webhook support is needed next.");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm sm:py-8">
      <div className="relative mx-auto my-2 w-full max-w-4xl overflow-hidden rounded-3xl bg-[#fbfaff] shadow-2xl shadow-slate-950/20 sm:my-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
          aria-label="Close payment gateway"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">SmartFit Checkout</h2>
                <p className="text-sm text-slate-500">Step {step} of 2 - payment is collected by SmartFit</p>
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
            <aside className="border-b border-slate-200 bg-emerald-50/70 p-6 lg:border-b-0 lg:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Amount due</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">NPR {total.toLocaleString("en-US")}</p>

              <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm">
                  <span className="font-semibold text-slate-500">Consultation</span>
                  <span className="font-bold text-slate-900">NPR {fee.toLocaleString("en-US")}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm">
                  <span className="font-semibold text-slate-500">SmartFit fee</span>
                  <span className="font-bold text-slate-900">NPR {platformFee.toLocaleString("en-US")}</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="font-black text-slate-950">Total</span>
                  <span className="font-black text-emerald-700">NPR {total.toLocaleString("en-US")}</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                Card details should be handled by a payment provider. SmartFit should only store the confirmed payment result.
              </div>
            </aside>

            <section className="p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4 pr-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">{step === 1 ? "Review invoice" : "Choose payment method"}</h3>
                  <p className="mt-1 text-sm text-slate-500">{step === 1 ? "Confirm the visit and amount before continuing." : "This form is UI-only until backend payment support is added."}</p>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2].map((item) => (
                    <span
                      key={item}
                      className={`h-2 w-10 rounded-full transition ${step >= item ? "bg-emerald-600" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
              </div>

              {step === 1 ? (
                <div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Invoice Details</p>
                    <h4 className="mt-3 text-2xl font-black text-slate-950">{invoiceTitle(invoice)}</h4>
                    <p className="mt-2 text-slate-600">
                      With {getDoctorName(invoice)} at SmartFit Medical Institute.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailRow label="Invoice" value={invoiceCode(invoice)} />
                    <DetailRow label="Issued" value={formatDate(invoice.createdAt || invoice.appointmentdate)} />
                    <DetailRow label="Appointment Date" value={formatDate(invoice.appointmentdate)} />
                    <DetailRow label="Appointment Time" value={invoice.appointmenttime || "Time not set"} />
                  </div>

                  <div className="sticky bottom-0 -mx-6 mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 bg-[#fbfaff]/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:flex-row sm:px-8">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 hover:bg-emerald-700"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to invoice
                  </button>

                  <div className="grid gap-3">
                    {paymentMethods.map((item) => {
                      const Icon = item.icon;
                      const selected = method === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMethod(item.id)}
                          className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-slate-200 bg-white hover:border-emerald-200"
                          }`}
                        >
                          <span className={`grid h-11 w-11 place-items-center rounded-xl ${selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-black text-slate-950">{item.title}</span>
                            <span className="mt-1 block text-sm text-slate-500">{item.subtitle}</span>
                          </span>
                          <span className={`h-4 w-4 rounded-full border-2 ${selected ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`} />
                        </button>
                      );
                    })}
                  </div>

                  {method === "card" && (
                    <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                      <input className="h-12 rounded-xl border border-slate-200 px-4 font-semibold outline-none focus:border-emerald-400 sm:col-span-2" placeholder="Card number" />
                      <input className="h-12 rounded-xl border border-slate-200 px-4 font-semibold outline-none focus:border-emerald-400" placeholder="MM / YY" />
                      <input className="h-12 rounded-xl border border-slate-200 px-4 font-semibold outline-none focus:border-emerald-400" placeholder="CVC" />
                      <input className="h-12 rounded-xl border border-slate-200 px-4 font-semibold outline-none focus:border-emerald-400 sm:col-span-2" placeholder="Name on card" />
                    </div>
                  )}

                  {method === "stripe" && (
                    <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                      <p className="flex items-center gap-2 font-black text-indigo-900">
                        <Landmark className="h-5 w-5" />
                        Stripe checkout will open here after backend support is added.
                      </p>
                      <p className="mt-2 text-sm text-indigo-700">
                        The server should create a payment intent and confirm invoice status from a webhook.
                      </p>
                    </div>
                  )}

                  {method === "wallet" && (
                    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="font-black text-amber-900">Wallet providers can be connected later.</p>
                      <p className="mt-2 text-sm text-amber-700">
                        This UI is ready for Nepal payment options, but no real wallet API is connected yet.
                      </p>
                    </div>
                  )}

                  <div className="sticky bottom-0 -mx-6 mt-6 border-t border-slate-100 bg-[#fbfaff]/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
                    <button
                      type="button"
                      onClick={finishPayment}
                      className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 hover:bg-emerald-700"
                    >
                      <LockKeyhole className="h-5 w-5" />
                      Pay NPR {total.toLocaleString("en-US")}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BillingHistory() {
  const dispatch = useDispatch();
  const { appointments = [], loading } = useSelector((state) => state.appointment || {});
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);

  useEffect(() => {
    dispatch(getAllAppointments());
  }, [dispatch]);

  const invoices = useMemo(
    () => appointments.filter((appointment) => getPaymentStatus(appointment) !== "Cancelled"),
    [appointments]
  );

  const handleDownload = () => {
    toast("Invoice PDF download needs a backend invoice/PDF endpoint.");
  };

  if (loading && !appointments.length) {
    return (
      <PatientPortalLayout title="Billing History" subtitle="View all your invoices and payment history">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  return (
    <PatientPortalLayout title="Billing History" subtitle="View consultation invoices payable to SmartFit">
      <Toaster position="top-right" />

      {checkoutInvoice && <Gateway invoice={checkoutInvoice} onClose={() => setCheckoutInvoice(null)} />}

      {invoices.length ? (
        <div className="space-y-6">
          {invoices.map((appointment) => {
            const status = getPaymentStatus(appointment);
            const fee = amount(appointment);
            const issueDate = formatDate(appointment.createdAt || appointment.appointmentdate);
            const isPaid = status === "Paid";

            return (
              <article
                key={appointment._id}
                className="grid gap-6 rounded-3xl bg-white p-7 shadow-xl shadow-slate-200/60 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-950">{invoiceTitle(appointment)}</h2>
                    <span className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${statusClass(status)}`}>
                      {status}
                    </span>
                  </div>

                  <p className="mt-4 text-lg text-slate-500">
                    Invoice {invoiceCode(appointment)} - Issued {issueDate}
                  </p>

                  <p className="mt-3 flex items-center gap-2 text-lg text-slate-600">
                    <CalendarDays className="h-5 w-5 text-emerald-600" />
                    Appointment {formatDate(appointment.appointmentdate)} at {appointment.appointmenttime || "time not set"}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-500">
                    Payment receiver: <span className="text-emerald-700">SmartFit</span>
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:min-w-72">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Amount due</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">
                      {fee ? `NPR ${fee.toLocaleString("en-US")}` : "N/A"}
                    </p>
                  </div>
                  {isPaid ? (
                    <button
                      onClick={handleDownload}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <FileText className="h-5 w-5" />
                      Download
                    </button>
                  ) : (
                    <button
                      onClick={() => setCheckoutInvoice(appointment)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-md shadow-emerald-600/15 hover:bg-emerald-700"
                    >
                      <CreditCard className="h-5 w-5" />
                      Pay SmartFit
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xl shadow-slate-200/60">
          <CreditCard className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h3 className="text-2xl font-black text-slate-950">No billing records yet</h3>
          <p className="mx-auto mt-2 max-w-xl text-slate-500">
            Consultation invoices will appear here after you book appointments with doctors.
          </p>
        </div>
      )}
    </PatientPortalLayout>
  );
}
