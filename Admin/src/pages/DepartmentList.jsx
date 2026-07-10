import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Baby,
  Bone,
  Brain,
  CalendarDays,
  FlaskConical,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  Plus,
  ShieldPlus,
  Siren,
  Stethoscope,
  User,
  UserRound,
  X,
  ChevronDown,
  Venus,
} from "lucide-react";

import {
  adminCreateDepartment,
  adminGetAllDepartments,
  adminGetAllDoctors,
  adminUpdateDepartment,
} from "@/services/adminApi";
import LogoutButton from "@/components/custom/LogoutButton";
import AdminBrand from "@/components/custom/AdminBrand";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  { label: "Appointments", icon: CalendarDays, path: "/appointments" },
  { label: "Doctors", icon: UserRound, path: "/doctors" },
  { label: "Departments", icon: Building2, path: "/departments" },
  { label: "Profile", icon: User, path: "/profile" },
];

const iconOptions = [
  { key: "heart", label: "Heart", icon: HeartPulse },
  { key: "brain", label: "Brain", icon: Brain },
  { key: "baby", label: "Child Care", icon: Baby },
  { key: "bone", label: "Bone", icon: Bone },
  { key: "lab", label: "Lab", icon: FlaskConical },
  { key: "emergency", label: "Emergency", icon: Siren },
  { key: "stethoscope", label: "Clinical", icon: Stethoscope },
  { key: "hospital", label: "Hospital", icon: Hospital },
  { key: "obgyn", label: "OB/GYN", icon: Venus },
];

const colorOptions = [
  { key: "cardiac-red", label: "Cardiac Red", className: "bg-rose-600" },
  { key: "neuro-purple", label: "Neuro Purple", className: "bg-violet-600" },
  { key: "pediatric-blue", label: "Pediatric Blue", className: "bg-sky-500" },
  { key: "ortho-orange", label: "Ortho Orange", className: "bg-orange-500" },
  { key: "oncology-teal", label: "Oncology Teal", className: "bg-teal-600" },
  { key: "emergency-red", label: "Emergency Red", className: "bg-red-600" },
  { key: "diagnostic-indigo", label: "Diagnostic Indigo", className: "bg-indigo-600" },
  { key: "general-green", label: "General Green", className: "bg-emerald-600" },
  { key: "obgyn-pink", label: "OB/GYN Pink", className: "bg-fuchsia-600" },
  { key: "pink", label: "Pink", className: "bg-pink-600" },
  { key: "purple", label: "Purple", className: "bg-purple-600" },
  { key: "blue", label: "Blue", className: "bg-blue-600" },
  { key: "orange", label: "Orange", className: "bg-orange-500" },
  { key: "emerald", label: "Emerald", className: "bg-emerald-600" },
  { key: "rose", label: "Rose", className: "bg-rose-600" },
];

const iconMap = Object.fromEntries(iconOptions.map((item) => [item.key, item.icon]));
const colorMap = Object.fromEntries(colorOptions.map((item) => [item.key, item.className]));
const emptyForm = { deptname: "", description: "", iconKey: "hospital", color: "general-green" };

const getDoctorCountForDepartment = (doctors, departmentName) =>
  doctors.filter((doctor) => doctor.department === departmentName).length;

function DepartmentModal({ mode, open, initialValues, loading, onClose, onSubmit }) {
  const [form, setForm] = useState(initialValues || emptyForm);

  useEffect(() => {
    setForm(initialValues || emptyForm);
  }, [initialValues, open]);

  if (!open) return null;

  const title = mode === "create" ? "Create Department" : "Edit Department";
  const action = mode === "create" ? "Create Department" : "Save Changes";
  const SelectedIcon = iconMap[form.iconKey] || Hospital;
  const selectedColorClass = colorMap[form.color] || colorMap.emerald;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Keep department names consistent with doctor profiles.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Department Name
            </span>
            <input
              value={form.deptname}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  deptname: event.target.value,
                }))
              }
              required
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Cardiology"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Logo
              </span>
              <div className="relative">
                <select
                  value={form.iconKey}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, iconKey: event.target.value }))
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  {iconOptions.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Color
              </span>
              <div className="relative">
                <select
                  value={form.color}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, color: event.target.value }))
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  {colorOptions.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${selectedColorClass} text-white shadow-sm`}>
                <SelectedIcon className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Preview
              </span>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Heart and cardiovascular care"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : action}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDepartmentList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [modalMode, setModalMode] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const {
    departments = [],
    doctors = [],
    loading,
    error,
  } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(adminGetAllDepartments());
    dispatch(adminGetAllDoctors());
  }, [dispatch]);

  const sortedDepartments = useMemo(
    () =>
      [...departments].sort((a, b) =>
        String(a.deptname || "").localeCompare(String(b.deptname || ""))
      ),
    [departments]
  );

  const openCreate = () => {
    setSelectedDepartment(null);
    setModalMode("create");
  };

  const openEdit = (department) => {
    setSelectedDepartment(department);
    setModalMode("edit");
  };

  const closeModal = () => {
    setSelectedDepartment(null);
    setModalMode(null);
  };

  const handleSubmit = async (form) => {
    if (modalMode === "create") {
      await dispatch(adminCreateDepartment(form)).unwrap();
    } else if (selectedDepartment?._id) {
      await dispatch(
        adminUpdateDepartment({
          id: selectedDepartment._id,
          payload: form,
        })
      ).unwrap();
    }

    closeModal();
  };

  return (
    <div className="-m-4 min-h-screen bg-[#faf8ff] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[214px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white/80 px-3 py-7 shadow-sm backdrop-blur lg:flex lg:flex-col">
          <AdminBrand onClick={() => navigate("/")} />

          <span className="mb-7 ml-3 w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            Admin Panel
          </span>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.path === "/departments";

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-xs font-medium uppercase tracking-[0.12em] transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-5">
            <LogoutButton className="w-full justify-start bg-transparent text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-950" />
          </div>
        </aside>

        <main className="px-5 py-7 sm:px-8 lg:px-10">
          <header className="mb-11 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Departments
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Create and update hospital departments
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex h-11 w-fit items-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Create Department
            </button>
          </header>

          {error && (
            <div className="mb-5 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error?.message || "Failed to load departments."}
            </div>
          )}

          <section className="grid gap-4 xl:grid-cols-2">
            {sortedDepartments.map((department) => {
              const doctorCount = getDoctorCountForDepartment(
                doctors,
                department.deptname
              );
              const Icon = iconMap[department.iconKey] || ShieldPlus;
              const colorClass = colorMap[department.color] || colorMap.emerald;

              return (
                <article
                  key={department._id}
                  className="rounded-2xl border border-slate-100 bg-white/95 p-8 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(88,80,120,0.13)]"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className={`mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClass} text-white shadow-lg`}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <h2 className="text-xl font-black capitalize text-slate-900">
                        {department.deptname}
                      </h2>
                      <p className="mt-4 min-h-12 text-sm leading-7 text-slate-500">
                        {department.description || "No description provided"}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/departments/${department.deptname}/doctors`)
                        }
                        className="mt-5 text-sm font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        {doctorCount} doctors
                      </button>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                      Active
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEdit(department)}
                    className="h-10 w-full rounded-xl border border-slate-200 text-xs font-black uppercase tracking-[0.12em] text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Edit Department
                  </button>
                </article>
              );
            })}
          </section>

          {!loading && sortedDepartments.length === 0 && (
            <div className="rounded-xl bg-white/90 py-14 text-center shadow-[0_18px_55px_rgba(88,80,120,0.09)]">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-700">
                No departments available.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-2 text-sm font-bold text-emerald-600"
              >
                Create your first department
              </button>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center text-sm font-semibold text-slate-500">
              Loading departments...
            </div>
          )}
        </main>
      </div>

      <DepartmentModal
        mode={modalMode}
        open={Boolean(modalMode)}
        initialValues={selectedDepartment || emptyForm}
        loading={loading}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default AdminDepartmentList;
