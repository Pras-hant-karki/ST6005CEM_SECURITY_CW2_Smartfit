import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  AlertCircle,
  Download,
  Droplet,
  FileText,
  Heart,
  Loader2,
  Microscope,
  TestTube2,
} from "lucide-react";
import PatientPortalLayout from "@/components/custom/PatientPortalLayout";
import { getAllLabTests } from "@/services/labtestApi";

const formatDate = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const testName = (record) => record?.tests?.[0]?.test_name || "Medical Record";

const departmentName = (record) => {
  const name = testName(record);
  if (/blood|cbc/i.test(name)) return "Hematology";
  if (/lipid|heart/i.test(name)) return "Cardiology";
  if (/glucose|sugar/i.test(name)) return "Endocrinology";
  if (/x-ray|xray|scan|image/i.test(name)) return "Radiology";
  if (/thyroid/i.test(name)) return "Endocrinology";
  return "Diagnostics";
};

const recordStatus = (record) => {
  const parameterStatuses = record?.tests?.flatMap((test) => test.parameters || []).map((param) => param.status);
  if (parameterStatuses?.some((status) => ["Low", "High", "Abnormal"].includes(status))) return "Borderline";
  if (record?.overall_status === "completed") return "Normal";
  return record?.overall_status || "Ordered";
};

const statusClass = (status) => {
  const value = String(status).toLowerCase();
  if (value.includes("border") || value.includes("high") || value.includes("low") || value.includes("abnormal")) {
    return "text-amber-700";
  }
  if (value.includes("normal") || value.includes("completed")) return "text-teal-700";
  return "text-slate-500";
};

const recordIcon = (record, index) => {
  const name = testName(record);
  if (/blood|cbc/i.test(name)) return <Droplet className="h-8 w-8 text-rose-500" />;
  if (/lipid|heart/i.test(name)) return <Heart className="h-8 w-8 text-rose-500" />;
  if (/thyroid|microscope/i.test(name)) return <Microscope className="h-8 w-8 text-cyan-600" />;
  if (/glucose|sugar/i.test(name)) return <TestTube2 className="h-8 w-8 text-cyan-500" />;
  return index % 2 ? <Heart className="h-8 w-8 text-rose-500" /> : <Droplet className="h-8 w-8 text-rose-500" />;
};

const firstAttachment = (record) => record?.attachments?.find((attachment) => attachment.file_url);

export default function MedicalRecords() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { labTests = [], loading, error } = useSelector((state) => state.labtest || {});

  useEffect(() => {
    dispatch(getAllLabTests());
  }, [dispatch]);

  const handleUploadRecord = () => {
    toast("Patient record upload is not available yet. Doctors add lab reports from the doctor portal.");
  };

  const handleDownload = (event, record) => {
    event.stopPropagation();
    const attachment = firstAttachment(record);
    if (!attachment) {
      toast("No uploaded PDF/report file yet. Open the record to view test values.");
      navigate(`/labtests/${record._id}`);
      return;
    }
    window.open(attachment.file_url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <PatientPortalLayout title="Medical Records" subtitle="Access your complete medical history and lab results">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </PatientPortalLayout>
    );
  }

  if (error) {
    return (
      <PatientPortalLayout title="Medical Records" subtitle="Access your complete medical history and lab results">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <AlertCircle className="mb-2 h-5 w-5" />
          Failed to load medical records.
        </div>
      </PatientPortalLayout>
    );
  }

  return (
    <PatientPortalLayout
      title="Medical Records"
      subtitle="Access your complete medical history and lab results"
      action={
        <button
          type="button"
          onClick={handleUploadRecord}
          className="rounded-xl bg-[#02B833] px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25 hover:bg-[#029E2C]"
        >
          Upload Record
        </button>
      }
    >
      <Toaster position="top-right" />

      {labTests.length ? (
        <div className="space-y-5">
          {labTests.map((record, index) => {
            const status = recordStatus(record);
            const attachment = firstAttachment(record);

            return (
              <article
                key={record._id}
                onClick={() => navigate(`/labtests/${record._id}`)}
                className="grid cursor-pointer gap-5 rounded-3xl bg-white p-7 shadow-xl shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-200/80 md:grid-cols-[72px_1fr_auto_auto]"
              >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
                  {recordIcon(record, index)}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-black text-slate-950">{testName(record)}</h2>
                  <p className="mt-2 text-lg text-slate-500">
                    {formatDate(record.report_date || record.createdAt)} • {departmentName(record)}
                  </p>
                </div>

                <div className={`self-center text-sm font-black uppercase tracking-[0.12em] ${statusClass(status)}`}>
                  {status}
                </div>

                <button
                  type="button"
                  onClick={(event) => handleDownload(event, record)}
                  className="inline-flex items-center justify-center gap-2 self-center rounded-xl px-4 py-3 text-base font-black text-[#02B833] hover:bg-emerald-50"
                  title={attachment ? "Open uploaded report file" : "Open report details"}
                >
                  <Download className="h-5 w-5" />
                  {attachment ? "Download PDF" : "View Report"}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xl shadow-slate-200/60">
          <FileText className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h3 className="text-2xl font-black text-slate-950">No medical records yet</h3>
          <p className="mx-auto mt-2 max-w-xl text-slate-500">
            Lab reports will appear here after a doctor orders a lab test and updates the results.
          </p>
          <button
            onClick={() => navigate("/appointments")}
            className="mt-8 rounded-xl bg-[#02B833] px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-500/25"
          >
            View Appointments
          </button>
        </div>
      )}
    </PatientPortalLayout>
  );
}
