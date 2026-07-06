import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, Check, Loader2, Microscope, Printer } from "lucide-react";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import { getAllLabTests } from "@/services/labtestApi";

const formatDate = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const labCode = (lab, index) => `LT-${new Date(lab.createdAt || Date.now()).getFullYear()}-${String(index + 1).padStart(3, "0")}`;
const testName = (lab) => lab?.tests?.[0]?.test_name || "Lab Test";
const testStatus = (lab) => lab?.overall_status || lab?.tests?.[0]?.status || "ordered";
const isCompleted = (lab) => testStatus(lab).toLowerCase() === "completed";
const isVerified = (lab) => Boolean(lab?.verified_by || lab?.verified_at);

const departmentName = (lab) => {
  const name = testName(lab);
  if (/blood|cbc/i.test(name)) return "Hematology";
  if (/lipid|heart/i.test(name)) return "Cardiology";
  if (/glucose|sugar/i.test(name)) return "Endocrinology";
  if (/thyroid/i.test(name)) return "Endocrinology";
  return "Diagnostics";
};

const statusBadgeClass = (status) => {
  const value = status.toLowerCase();
  if (value === "completed" || value === "normal") return "bg-emerald-100 text-[#02B833]";
  if (value === "processing") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
};

const parameterStatusClass = (status) => {
  if (status === "Normal") return "bg-emerald-100 text-teal-700";
  if (["High", "Low", "Abnormal"].includes(status)) return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-600";
};

export default function AllLabTests() {
  const dispatch = useDispatch();
  const { labTests = [], loading, error } = useSelector((state) => state.labtest || {});
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    dispatch(getAllLabTests());
  }, [dispatch]);

  const filteredTests = useMemo(() => {
    if (filter === "completed") return labTests.filter((lab) => isCompleted(lab));
    if (filter === "pending") return labTests.filter((lab) => !isCompleted(lab));
    return labTests;
  }, [labTests, filter]);

  useEffect(() => {
    if (filteredTests.length && !filteredTests.some((lab) => lab._id === selectedId)) {
      setSelectedId(filteredTests[0]._id);
    }
    if (!filteredTests.length) setSelectedId(null);
  }, [filteredTests, selectedId]);

  const selected = filteredTests.find((lab) => lab._id === selectedId);
  const selectedIndex = labTests.findIndex((lab) => lab._id === selectedId);

  if (loading && !labTests.length) {
    return (
      <PatientPortalLayout title="Lab Tests" subtitle="View your diagnostic test orders and results">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  if (error) {
    return (
      <PatientPortalLayout title="Lab Tests" subtitle="View your diagnostic test orders and results">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <AlertCircle className="mb-2 h-5 w-5" />
          Failed to load lab tests.
        </div>
      </PatientPortalLayout>
    );
  }

  return (
    <PatientPortalLayout
      title="Lab Tests"
      subtitle="View your diagnostic test orders and results"
      action={
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {["all", "completed", "pending"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`px-8 py-3 text-sm font-black uppercase tracking-[0.1em] transition ${
                filter === item ? "bg-[#02B833] text-white" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-7 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          {filteredTests.map((lab) => {
            const active = lab._id === selectedId;
            const status = testStatus(lab);
            const globalIndex = labTests.findIndex((item) => item._id === lab._id);

            return (
              <button
                key={lab._id}
                type="button"
                onClick={() => setSelectedId(lab._id)}
                className={`w-full rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 ${
                  active ? "border-emerald-300 bg-emerald-50/50" : "border-slate-100"
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-[#02B833]">{labCode(lab, globalIndex)}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass(status)}`}>
                    {status}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-950">{testName(lab)}</h2>
                <p className="mt-2 font-semibold text-slate-500">{departmentName(lab)}</p>
                <p className="mt-1 font-semibold text-slate-400">{formatDate(lab.report_date || lab.createdAt)}</p>
                {isVerified(lab) && (
                  <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
                    <Check className="h-3 w-3" />
                    Verified
                  </span>
                )}
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
                      {labCode(selected, selectedIndex)}
                    </p>
                    {isVerified(selected) && (
                      <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">{testName(selected)}</h2>
                  <p className="mt-3 text-lg text-slate-500">
                    {departmentName(selected)}
                  </p>
                  <p className="mt-1 text-slate-400">
                    Ordered: {formatDate(selected.createdAt)} • Result: {formatDate(selected.report_date || selected.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  aria-label="Print lab test"
                >
                  <Printer className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <div className="grid grid-cols-[1.25fr_0.8fr_0.9fr_0.65fr] bg-slate-50 px-5 py-4 text-sm font-black uppercase tracking-[0.1em] text-slate-500">
                  <span>Parameter</span>
                  <span>Value</span>
                  <span>Ref Range</span>
                  <span>Status</span>
                </div>
                {(selected.tests?.[0]?.parameters || []).length ? (
                  selected.tests[0].parameters.map((param, index) => (
                    <div key={`${param.name}-${index}`} className="grid grid-cols-[1.25fr_0.8fr_0.9fr_0.65fr] items-center border-t border-slate-100 px-5 py-4">
                      <span className="font-bold text-slate-900">{param.name || "Parameter"}</span>
                      <span className="font-black text-slate-950">
                        {param.value || "-"} <span className="font-semibold text-slate-400">{param.unit}</span>
                      </span>
                      <span className="font-semibold text-slate-500">{param.reference_range || "-"}</span>
                      <span>
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${parameterStatusClass(param.status)}`}>
                          {param.status || "Normal"}
                        </span>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">No parameter results added yet.</div>
                )}
              </div>

              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#02B833]">Lab Notes</p>
                <p className="mt-3 text-lg leading-7 text-slate-600">
                  {selected.tests?.[0]?.remarks || selected.tests?.[0]?.result_summary || "Results will be updated by your doctor or lab team."}
                </p>
              </div>
            </>
          ) : (
            <div className="grid min-h-[250px] place-items-center text-center">
              <div>
                <Microscope className="mx-auto mb-6 h-20 w-20 text-slate-200" />
                <h2 className="text-2xl font-black text-slate-400">Select a lab test</h2>
                <p className="mt-3 text-lg text-slate-400">Click any test to view results and details</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </PatientPortalLayout>
  );
}
