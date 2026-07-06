import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, Info, Loader2, Pill, Printer } from "lucide-react";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import { getAllPrescriptions } from "@/services/prescriptionApi";

const formatDate = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const rxCode = (prescription, index) => `RX-${String(index + 1).padStart(3, "0")}`;
const diagnosisTitle = (prescription) => prescription?.diagonosis || "Prescription";
const prescriptionStatus = (prescription, index) => (index === 0 ? "Active" : "Completed");

export default function AllPrescriptions() {
  const dispatch = useDispatch();
  const { prescriptions = [], loading, error } = useSelector((state) => state.prescription || {});
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    dispatch(getAllPrescriptions());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedId && prescriptions.length) {
      setSelectedId(prescriptions[0]._id);
    }
  }, [prescriptions, selectedId]);

  const selected = useMemo(
    () => prescriptions.find((prescription) => prescription._id === selectedId),
    [prescriptions, selectedId]
  );
  const selectedIndex = prescriptions.findIndex((prescription) => prescription._id === selectedId);
  const activeCount = prescriptions.length ? 1 : 0;

  if (loading && !prescriptions.length) {
    return (
      <PatientPortalLayout title="Prescriptions" subtitle="Your medication history from SmartFit doctors">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  if (error) {
    return (
      <PatientPortalLayout title="Prescriptions" subtitle="Your medication history from SmartFit doctors">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <AlertCircle className="mb-2 h-5 w-5" />
          Failed to load prescriptions.
        </div>
      </PatientPortalLayout>
    );
  }

  return (
    <PatientPortalLayout
      title="Prescriptions"
      subtitle="Your medication history from SmartFit doctors"
      action={
        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-[#02B833]">
          {activeCount} Active
        </span>
      }
    >
      {prescriptions.length ? (
        <div className="grid gap-7 xl:grid-cols-[360px_1fr]">
          <div className="space-y-5">
            {prescriptions.map((prescription, index) => {
              const status = prescriptionStatus(prescription, index);
              const active = prescription._id === selectedId;
              return (
                <button
                  key={prescription._id}
                  type="button"
                  onClick={() => setSelectedId(prescription._id)}
                  className={`w-full rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 ${
                    active ? "border-emerald-300 bg-emerald-50/50" : "border-slate-100"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#02B833]">{rxCode(prescription, index)}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status === "Active" ? "bg-emerald-100 text-[#02B833]" : "bg-slate-200 text-slate-600"}`}>
                      {status}
                    </span>
                  </div>
                  <h2 className="line-clamp-2 text-lg font-black text-slate-950">{diagnosisTitle(prescription)}</h2>
                  <p className="mt-2 font-semibold text-slate-500">Dr. {prescription.doctordetails?.doctorname || "Doctor"}</p>
                  <p className="mt-1 font-semibold text-slate-400">{formatDate(prescription.createdAt)}</p>
                </button>
              );
            })}
          </div>

          <section className="min-h-[280px] rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
            {selected ? (
              <>
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <p className="text-sm font-black uppercase tracking-[0.12em] text-[#02B833]">
                        {rxCode(selected, selectedIndex)}
                      </p>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${prescriptionStatus(selected, selectedIndex) === "Active" ? "bg-emerald-100 text-[#02B833]" : "bg-slate-200 text-slate-600"}`}>
                        {prescriptionStatus(selected, selectedIndex)}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">{diagnosisTitle(selected)}</h2>
                    <p className="mt-3 text-lg text-slate-500">
                      Dr. {selected.doctordetails?.doctorname || "Doctor"} • {selected.doctordetails?.department || "SmartFit"}
                    </p>
                    <p className="mt-1 text-slate-400">{formatDate(selected.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label="Print prescription"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                </div>

                <div>
                  <p className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-slate-500">Medications</p>
                  <div className="space-y-4">
                    {(selected.medicines || []).map((medicine, index) => (
                      <div key={`${medicine.medicinename}-${index}`} className="rounded-2xl border border-slate-100 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-2xl font-black text-slate-950">{medicine.medicinename}</h3>
                            <p className="mt-1 text-lg font-black text-[#02B833]">{medicine.dosage}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-bold text-slate-700">{medicine.frequency}</p>
                            <p className="text-slate-400">{medicine.duration}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[#02B833]">Doctor's Notes</p>
                  <p className="mt-3 text-lg leading-7 text-slate-600">
                    {selected.doctordetails?.notes || selected.notes || "Follow the medication schedule provided by your doctor."}
                  </p>
                </div>
              </>
            ) : (
              <div className="grid min-h-[250px] place-items-center text-center">
                <div>
                  <Pill className="mx-auto mb-6 h-20 w-20 rotate-45 text-rose-200" />
                  <h2 className="text-2xl font-black text-slate-400">Select a prescription</h2>
                  <p className="mt-3 text-lg text-slate-400">Click any prescription to view details</p>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xl shadow-slate-200/60">
          <Pill className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h3 className="text-2xl font-black text-slate-950">No prescriptions yet</h3>
          <p className="mt-2 text-slate-500">Prescriptions will appear here after a doctor writes them for your appointment.</p>
        </div>
      )}
    </PatientPortalLayout>
  );
}
