import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, Check, Loader2, Microscope, Plus, Trash2 } from "lucide-react";
import DoctorSidebar from "@/components/custom/DoctorSidebar";
import { createLabTest, deleteLabTest, getAllLabTests, updateLabTest, verifyLabTest } from "@/services/labtestApi";
import { getAllPrescriptions } from "@/services/prescriptionApi";

const statusClass = {
  ordered: "bg-amber-50 text-amber-700",
  processing: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
};

const formatDate = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return date.toISOString().slice(0, 10);
};

const getLabCode = (labtest, index) => {
  const source = String(labtest?._id || "").slice(-3).toUpperCase();
  return `LT-${source || String(index + 1).padStart(3, "0")}`;
};

const emptyForm = {
  prescription_id: "",
  test_name: "",
  instructions: "",
};

const DoctorLabTests = () => {
  const dispatch = useDispatch();
  const { user: doctor } = useSelector((state) => state.auth);
  const { labtests = [], loading, error } = useSelector((state) => state.labtest);
  const { prescriptions = [] } = useSelector((state) => state.prescription);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(getAllLabTests());
    dispatch(getAllPrescriptions());
  }, [dispatch]);

  const prescriptionsWithoutLab = useMemo(() => {
    const usedPrescriptionIds = new Set(
      labtests.map((test) => {
        const prescription = test.prescription_id;
        return typeof prescription === "string" ? prescription : prescription?._id;
      })
    );

    return prescriptions.filter((prescription) => !usedPrescriptionIds.has(prescription._id));
  }, [labtests, prescriptions]);

  const sortedLabTests = useMemo(
    () => [...labtests].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [labtests]
  );

  const selectedPrescription = prescriptions.find((prescription) => prescription._id === form.prescription_id);

  const resetForm = () => {
    setForm(emptyForm);
    setFormError("");
    setEditingId(null);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.prescription_id || !form.test_name) {
      setFormError("Select a prescription and enter a test name.");
      return;
    }

    const patientId = selectedPrescription?.patientdetails?._id;
    if (!patientId) {
      setFormError("Selected prescription does not have patient details.");
      return;
    }

    setSaving(true);
    const result = await dispatch(
      createLabTest({
        prescription_id: form.prescription_id,
        patient_id: patientId,
        tests: [
          {
            test_name: form.test_name,
            remarks: form.instructions,
            status: "ordered",
          },
        ],
      })
    );
    setSaving(false);

    if (result.meta.requestStatus === "fulfilled") {
      resetForm();
      setShowForm(false);
      dispatch(getAllLabTests());
      dispatch(getAllPrescriptions());
      return;
    }

    setFormError(result.payload?.message || "Could not order lab test.");
  };

  const startUpdate = (labtest) => {
    const firstTest = labtest.tests?.[0];
    setEditingId(labtest._id);
    setShowForm(true);
    setForm({
      prescription_id: typeof labtest.prescription_id === "string" ? labtest.prescription_id : labtest.prescription_id?._id || "",
      test_name: firstTest?.test_name || "",
      instructions: firstTest?.remarks || "",
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!editingId || !form.test_name) {
      setFormError("Test name is required.");
      return;
    }

    setSaving(true);
    const result = await dispatch(
      updateLabTest({
        labTestId: editingId,
        payload: {
          tests: [
            {
              test_name: form.test_name,
              remarks: form.instructions,
              status: "ordered",
            },
          ],
          overall_status: "ordered",
        },
      })
    );
    setSaving(false);

    if (result.meta.requestStatus === "fulfilled") {
      resetForm();
      setShowForm(false);
      dispatch(getAllLabTests());
      return;
    }

    setFormError(result.payload?.message || "Could not update lab test.");
  };

  const handleDelete = async (labtest) => {
    const confirmed = window.confirm("Delete this lab test?");
    if (!confirmed) return;
    await dispatch(deleteLabTest(labtest._id));
    dispatch(getAllLabTests());
    dispatch(getAllPrescriptions());
  };

  const handleVerify = async (labtest) => {
    const updated = await dispatch(
      updateLabTest({
        labTestId: labtest._id,
        payload: {
          overall_status: "completed",
          report_date: new Date().toISOString(),
          tests: (labtest.tests || []).map((test) => ({ ...test, status: "completed" })),
        },
      })
    );

    if (updated.meta.requestStatus === "fulfilled") {
      await dispatch(verifyLabTest(labtest._id));
      dispatch(getAllLabTests());
    }
  };

  return (
    <div className="-m-4 flex min-h-screen bg-[#f8f5ff] font-sans text-slate-900">
      <DoctorSidebar doctor={doctor} />

      <main className="min-w-0 flex-1 px-7 py-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Lab Tests</h1>
            <p className="mt-2 text-sm text-slate-500">Order lab tests and review results.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm((current) => !current);
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Order Lab Test
          </button>
        </header>

        {error && (
          <div className="mt-8 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error?.message || "Could not load lab tests."}
          </div>
        )}

        <section className="mt-12 space-y-5">
          {showForm && (
            <form
              onSubmit={editingId ? handleUpdate : handleCreate}
              className="rounded-2xl bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white"
            >
              <h2 className="text-xl font-extrabold text-slate-900">
                {editingId ? "Update Lab Test" : "Order Lab Test"}
              </h2>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                    Patient / Prescription
                  </span>
                  <select
                    value={form.prescription_id}
                    disabled={Boolean(editingId)}
                    onChange={(event) => setForm((current) => ({ ...current, prescription_id: event.target.value }))}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
                  >
                    <option value="">Select prescription...</option>
                    {(editingId ? prescriptions : prescriptionsWithoutLab).map((prescription) => (
                      <option key={prescription._id} value={prescription._id}>
                        {prescription.patientdetails?.patientname || "Registered patient"} - {prescription.diagonosis || "Prescription"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Test Name</span>
                  <input
                    value={form.test_name}
                    onChange={(event) => setForm((current) => ({ ...current, test_name: event.target.value }))}
                    placeholder="e.g. Complete Blood Count"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Instructions</span>
                  <textarea
                    value={form.instructions}
                    onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))}
                    placeholder="Special instructions for lab..."
                    className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              </div>

              {!editingId && prescriptionsWithoutLab.length === 0 && (
                <p className="mt-4 text-sm font-semibold text-amber-700">
                  No prescription is available for a new lab test.
                </p>
              )}
              {formError && (
                <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {formError}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || (!editingId && prescriptionsWithoutLab.length === 0)}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Test" : "Order Test"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-100 px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl bg-white/85 py-20 text-slate-500 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading lab tests...
            </div>
          ) : sortedLabTests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/85 py-20 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <Microscope className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-4 text-lg font-extrabold text-slate-800">No lab tests yet</p>
              <p className="mt-1 text-sm text-slate-500">Order a lab test from an existing prescription.</p>
            </div>
          ) : (
            sortedLabTests.map((labtest, index) => {
              const patient = labtest.patient_id;
              const testNames = labtest.tests?.map((test) => test.test_name).filter(Boolean).join(", ") || "Lab test";
              const verified = Boolean(labtest.verified_by || labtest.verified_at);

              return (
                <article
                  key={labtest._id}
                  className="rounded-2xl bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(16,185,129,0.11)]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold uppercase tracking-[0.12em] text-emerald-600">
                          {getLabCode(labtest, index)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[labtest.overall_status] || statusClass.ordered}`}>
                          {labtest.overall_status === "completed" ? "Results Received" : labtest.overall_status || "ordered"}
                        </span>
                        {verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                            <Check className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <h2 className="mt-3 text-lg font-extrabold text-slate-900">
                        {patient?.patientname || "Registered patient"}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-slate-600">{testNames}</p>
                      <p className="mt-1 text-sm text-slate-400">Ordered: {formatDate(labtest.createdAt)}</p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3 lg:justify-end">
                      {labtest.overall_status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => handleVerify(labtest)}
                          className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Mark Received
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startUpdate(labtest)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(labtest)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
};

export default DoctorLabTests;
