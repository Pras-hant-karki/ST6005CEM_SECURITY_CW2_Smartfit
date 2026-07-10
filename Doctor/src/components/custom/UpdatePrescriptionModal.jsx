import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const emptyMedicine = { medicinename: "", dosage: "", frequency: "", duration: "" };

const splitDiagnosis = (value) => {
  const parts = String(value || "")
    .split(/\n|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length ? parts : [""];
};

const UpdatePrescriptionModal = ({ open, setOpen, prescriptionDetails, onSubmitUpdate, saving = false }) => {
  const [diagnoses, setDiagnoses] = useState([""]);
  const [medicines, setMedicines] = useState([{ ...emptyMedicine }]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!prescriptionDetails || !open) return;
    setDiagnoses(splitDiagnosis(prescriptionDetails.diagonosis));
    setMedicines(
      prescriptionDetails.medicines?.length
        ? prescriptionDetails.medicines.map((medicine) => ({
            medicinename: medicine.medicinename || "",
            dosage: medicine.dosage || "",
            frequency: medicine.frequency || "",
            duration: medicine.duration || "",
          }))
        : [{ ...emptyMedicine }]
    );
    setError("");
  }, [prescriptionDetails, open]);

  const updateDiagnosis = (index, value) => {
    setDiagnoses((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const addDiagnosis = () => {
    setDiagnoses((current) => [...current, ""]);
  };

  const removeDiagnosis = (index) => {
    setDiagnoses((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateMedicine = (index, field, value) => {
    setMedicines((current) =>
      current.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      )
    );
  };

  const addMedicine = () => {
    setMedicines((current) => [...current, { ...emptyMedicine }]);
  };

  const removeMedicine = (index) => {
    setMedicines((current) => current.filter((_, medicineIndex) => medicineIndex !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanedDiagnoses = diagnoses.map((item) => item.trim()).filter(Boolean);
    const cleanedMedicines = medicines.map((medicine) => ({
      medicinename: medicine.medicinename.trim(),
      dosage: medicine.dosage.trim(),
      frequency: medicine.frequency.trim(),
      duration: medicine.duration.trim(),
    }));

    const hasInvalidMedicine = cleanedMedicines.some(
      (medicine) => !medicine.medicinename || !medicine.dosage || !medicine.frequency || !medicine.duration
    );

    if (!cleanedDiagnoses.length) {
      setError("Add at least one diagnosis.");
      return;
    }

    if (!cleanedMedicines.length || hasInvalidMedicine) {
      setError("Every medicine needs name, dosage, frequency, and duration.");
      return;
    }

    setError("");
    onSubmitUpdate({
      diagonosis: cleanedDiagnoses.join("\n"),
      medicines: cleanedMedicines,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl border border-slate-100 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-2xl font-extrabold text-slate-900">Edit Prescription</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Update diagnoses and medicines for this patient prescription.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-7 px-6 py-6">
          <section>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">Diagnoses</h3>
              <button
                type="button"
                onClick={addDiagnosis}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4" />
                Add Diagnosis
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {diagnoses.map((diagnosis, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    value={diagnosis}
                    onChange={(event) => updateDiagnosis(index, event.target.value)}
                    placeholder={`Diagnosis ${index + 1}`}
                    className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                  {diagnoses.length > 1 && (
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
          </section>

          <section>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">Medicines</h3>
              <button
                type="button"
                onClick={addMedicine}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4" />
                Add Medicine
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {medicines.map((medicine, index) => (
                <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-sm font-extrabold text-slate-700">Medicine {index + 1}</p>
                    {medicines.length > 1 && (
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
                      value={medicine.medicinename}
                      onChange={(event) => updateMedicine(index, "medicinename", event.target.value)}
                      placeholder="Medication name"
                      className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                    <input
                      value={medicine.dosage}
                      onChange={(event) => updateMedicine(index, "dosage", event.target.value)}
                      placeholder="Dosage"
                      className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                    <input
                      value={medicine.frequency}
                      onChange={(event) => updateMedicine(index, "frequency", event.target.value)}
                      placeholder="Frequency"
                      className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                    <input
                      value={medicine.duration}
                      onChange={(event) => updateMedicine(index, "duration", event.target.value)}
                      placeholder="Duration"
                      className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-100 px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePrescriptionModal;
