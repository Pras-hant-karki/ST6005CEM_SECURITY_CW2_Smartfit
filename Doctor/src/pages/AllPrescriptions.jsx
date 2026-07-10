import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AlertCircle, FileText, Loader2, Pill, Plus, Trash2 } from "lucide-react";
import DoctorSidebar from "@/components/custom/DoctorSidebar";
import { createPrescription, deletePrescription, getAllPrescriptions, updatePrescription } from "@/services/prescriptionApi";
import { getAllAppointments } from "@/services/appointmentApi";
import UpdatePrescriptionModal from "@/components/custom/UpdatePrescriptionModal";

const formatDate = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return date.toISOString().slice(0, 10);
};

const getMedicineSummary = (medicines = []) => {
  if (!medicines.length) return "No medicines added";
  return medicines
    .slice(0, 3)
    .map((medicine) => {
      const name = medicine.medicinename || "Medicine";
      return medicine.dosage ? `${name} ${medicine.dosage}` : name;
    })
    .join(", ");
};

const getPrescriptionCode = (prescription, index) => {
  if (prescription?.prescriptioncode) return prescription.prescriptioncode;
  const source = String(prescription?._id || "").slice(-3).toUpperCase();
  return `RX-${source || String(index + 1).padStart(3, "0")}`;
};

const AllPrescriptions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: doctor } = useSelector((state) => state.auth);
  const { prescriptions = [], loading, error } = useSelector((state) => state.prescription);
  const { appointments = [] } = useSelector((state) => state.doctorAppointment);
  const [deletingId, setDeletingId] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    appointmentid: "",
    diagnoses: [""],
    medicines: [{ medicinename: "", dosage: "", frequency: "", duration: "" }],
  });

  useEffect(() => {
    dispatch(getAllPrescriptions());
    dispatch(getAllAppointments());
  }, [dispatch]);

  const sortedPrescriptions = useMemo(
    () => [...prescriptions].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [prescriptions]
  );

  const completedAppointmentsWithoutPrescription = useMemo(() => {
    const usedAppointmentIds = new Set(
      prescriptions
        .map((prescription) => {
          const appointment = prescription.appointmentid;
          return typeof appointment === "string" ? appointment : appointment?._id;
        })
        .filter(Boolean)
    );

    return appointments.filter(
      (appointment) => appointment.status === "Completed" && !usedAppointmentIds.has(appointment._id)
    );
  }, [appointments, prescriptions]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      appointmentid: "",
      diagnoses: [""],
      medicines: [{ medicinename: "", dosage: "", frequency: "", duration: "" }],
    });
    setFormError("");
  };

  const handleDiagnosisChange = (index, value) => {
    setForm((current) => ({
      ...current,
      diagnoses: current.diagnoses.map((diagnosis, diagnosisIndex) =>
        diagnosisIndex === index ? value : diagnosis
      ),
    }));
  };

  const addDiagnosis = () => {
    setForm((current) => ({ ...current, diagnoses: [...current.diagnoses, ""] }));
  };

  const removeDiagnosis = (index) => {
    setForm((current) => ({
      ...current,
      diagnoses: current.diagnoses.filter((_, diagnosisIndex) => diagnosisIndex !== index),
    }));
  };

  const handleMedicineChange = (index, event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      medicines: current.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [name]: value } : medicine
      ),
    }));
  };

  const addMedicine = () => {
    setForm((current) => ({
      ...current,
      medicines: [...current.medicines, { medicinename: "", dosage: "", frequency: "", duration: "" }],
    }));
  };

  const removeMedicine = (index) => {
    setForm((current) => ({
      ...current,
      medicines: current.medicines.filter((_, medicineIndex) => medicineIndex !== index),
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError("");

    const validDiagnoses = form.diagnoses.map((diagnosis) => diagnosis.trim()).filter(Boolean);
    const validMedicines = form.medicines.filter(
      (medicine) => medicine.medicinename && medicine.dosage && medicine.frequency && medicine.duration
    );

    if (!form.appointmentid || validDiagnoses.length !== form.diagnoses.length || validDiagnoses.length === 0 || validMedicines.length !== form.medicines.length || validMedicines.length === 0) {
      setFormError("Select an appointment and complete all prescription fields.");
      return;
    }

    setCreating(true);
    const result = await dispatch(
      createPrescription({
        appointmentid: form.appointmentid,
        payload: {
          diagonosis: validDiagnoses.join("\n"),
          medicines: form.medicines,
        },
      })
    );
    setCreating(false);

    if (result.meta.requestStatus === "fulfilled") {
      resetForm();
      setShowForm(false);
      dispatch(getAllPrescriptions());
      return;
    }

    setFormError(result.payload?.message || "Could not create prescription.");
  };

  const handleUpdatePrescription = async (payload) => {
    if (!editingPrescription?._id) return;
    setSavingEdit(true);
    const result = await dispatch(
      updatePrescription({
        prescriptionId: editingPrescription._id,
        payload,
      })
    );
    setSavingEdit(false);

    if (result.meta.requestStatus === "fulfilled") {
      setEditingPrescription(null);
      dispatch(getAllPrescriptions());
    }
  };

  const handleDelete = async (prescription) => {
    const patientName = prescription?.patientdetails?.patientname || "this patient";
    const confirmed = window.confirm(`Delete prescription for ${patientName}?`);
    if (!confirmed) return;

    setDeletingId(prescription._id);
    const result = await dispatch(deletePrescription(prescription._id));
    setDeletingId(null);

    if (result.meta.requestStatus === "fulfilled") {
      dispatch(getAllPrescriptions());
    }
  };

  return (
    <div className="-m-4 flex min-h-screen bg-[#f8f5ff] font-sans text-slate-900">
      <DoctorSidebar doctor={doctor} />

      <main className="min-w-0 flex-1 px-7 py-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Prescriptions</h1>
            <p className="mt-2 text-sm text-slate-500">Create and manage patient prescriptions.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Prescription
          </button>
        </header>

        {error && (
          <div className="mt-8 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error?.message || "Failed to load prescriptions."}
          </div>
        )}

        <section className="mt-12 space-y-5">
          {showForm && (
            <form
              onSubmit={handleCreate}
              className="rounded-2xl bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white"
            >
              <h2 className="text-xl font-extrabold text-slate-900">Create Prescription</h2>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                    Patient / Appointment
                  </span>
                  <select
                    name="appointmentid"
                    value={form.appointmentid}
                    onChange={handleChange}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Select completed appointment...</option>
                    {completedAppointmentsWithoutPrescription.map((appointment) => (
                      <option key={appointment._id} value={appointment._id}>
                        {appointment.patientdetails?.patientname || "Registered patient"} - {appointment.appointmenttime}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Diagnosis</span>
                  <div className="mt-2 space-y-3">
                    {form.diagnoses.map((diagnosis, index) => (
                      <div key={index} className="flex gap-3">
                        <input
                          value={diagnosis}
                          onChange={(event) => handleDiagnosisChange(index, event.target.value)}
                          placeholder={`Diagnosis ${index + 1}`}
                          className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        />
                        {form.diagnoses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDiagnosis(index)}
                            className="grid h-12 w-12 place-items-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50"
                            aria-label={`Remove diagnosis ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addDiagnosis}
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Diagnosis
                  </button>
                </div>

              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">Medicines</h3>
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Medicine
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {form.medicines.map((medicine, index) => (
                    <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-extrabold text-slate-700">Medicine {index + 1}</p>
                        {form.medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicine(index)}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 px-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 lg:grid-cols-4">
                        <input
                          name="medicinename"
                          value={medicine.medicinename}
                          onChange={(event) => handleMedicineChange(index, event)}
                          placeholder="Medication name"
                          className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        />
                        <input
                          name="dosage"
                          value={medicine.dosage}
                          onChange={(event) => handleMedicineChange(index, event)}
                          placeholder="Dosage"
                          className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        />
                        <input
                          name="frequency"
                          value={medicine.frequency}
                          onChange={(event) => handleMedicineChange(index, event)}
                          placeholder="Frequency"
                          className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        />
                        <input
                          name="duration"
                          value={medicine.duration}
                          onChange={(event) => handleMedicineChange(index, event)}
                          placeholder="Duration"
                          className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {completedAppointmentsWithoutPrescription.length === 0 && (
                <p className="mt-4 text-sm font-semibold text-amber-700">
                  No completed appointment is available. Verify an appointment first.
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
                  disabled={creating || completedAppointmentsWithoutPrescription.length === 0}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Prescription"}
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
              Loading prescriptions...
            </div>
          ) : sortedPrescriptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/85 py-20 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <FileText className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-4 text-lg font-extrabold text-slate-800">No prescriptions yet</p>
              <p className="mt-1 text-sm text-slate-500">Verify a completed appointment first, then write a prescription.</p>
            </div>
          ) : (
            sortedPrescriptions.map((prescription, index) => {
              const patientName = prescription.patientdetails?.patientname || "Registered patient";
              return (
                <article
                  key={prescription._id}
                  className="rounded-2xl bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-white transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(16,185,129,0.11)]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/prescriptions/${prescription._id}`)}
                      className="min-w-0 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold uppercase tracking-[0.12em] text-emerald-600">
                          {getPrescriptionCode(prescription, index)}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          Active
                        </span>
                      </div>
                      <h2 className="mt-3 text-lg font-extrabold text-slate-900">{patientName}</h2>
                      <p className="mt-1 text-sm font-medium text-slate-600">{prescription.diagonosis || "No diagnosis added"}</p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                        <Pill className="h-4 w-4" />
                        {getMedicineSummary(prescription.medicines)}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">{formatDate(prescription.createdAt)}</p>
                    </button>

                    <div className="flex shrink-0 flex-wrap gap-3 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingPrescription(prescription)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(prescription)}
                        disabled={deletingId === prescription._id}
                        className="rounded-xl border border-red-100 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === prescription._id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <UpdatePrescriptionModal
          open={Boolean(editingPrescription)}
          setOpen={(open) => {
            if (!open) setEditingPrescription(null);
          }}
          prescriptionDetails={editingPrescription}
          onSubmitUpdate={handleUpdatePrescription}
          saving={savingEdit}
        />
      </main>
    </div>
  );
};

export default AllPrescriptions;
