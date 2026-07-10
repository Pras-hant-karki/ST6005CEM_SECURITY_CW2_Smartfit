import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Edit,
  LayoutDashboard,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  User,
  UserRound,
} from "lucide-react";

import { adminDeleteDoctor, adminGetAllDoctors } from "@/services/adminApi";
import LogoutButton from "@/components/custom/LogoutButton";
import AdminBrand from "@/components/custom/AdminBrand";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  { label: "Appointments", icon: CalendarDays, path: "/appointments" },
  { label: "Doctors", icon: UserRound, path: "/doctors" },
  { label: "Departments", icon: Building2, path: "/departments" },
  { label: "Profile", icon: User, path: "/profile" },
];

const getInitials = (name = "DR") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const normalizeDoctorName = (name = "Doctor") =>
  name.toLowerCase().startsWith("dr.") ? name : `Dr. ${name}`;

const DoctorList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { deptname } = useParams();
  const [search, setSearch] = useState("");
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);

  const { doctors = [], loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(adminGetAllDoctors());
  }, [dispatch]);

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesDepartment =
        !deptname || doctor.department?.toLowerCase() === deptname.toLowerCase();
      const searchableText = [
        doctor.doctorname,
        doctor.department,
        doctor.specialization,
        doctor.qualification,
        doctor.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesDepartment && (!query || searchableText.includes(query));
    });
  }, [deptname, doctors, search]);

  const handleDoctorClick = (doctorId) => {
    if (deptname) {
      navigate(`/departments/${deptname}/doctors/${doctorId}`);
      return;
    }

    navigate(`/doctors/${doctorId}`);
  };

  const handleDeleteDoctor = async (event, doctor) => {
    event.stopPropagation();
    const confirmed = window.confirm(`Delete ${normalizeDoctorName(doctor.doctorname)}? This removes the doctor account.`);
    if (!confirmed) return;

    setDeletingDoctorId(doctor._id);
    const result = await dispatch(adminDeleteDoctor(doctor._id));
    setDeletingDoctorId(null);

    if (result.meta.requestStatus !== "fulfilled") {
      alert(result.payload?.message || "Failed to delete doctor.");
    }
  };

  const handleEditDoctor = (event, doctorId) => {
    event.stopPropagation();
    navigate(`/doctors/${doctorId}/edit`);
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
              const active = item.path === "/doctors";

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
          <header className="mb-11 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Doctors Directory
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                View, create, and manage registered doctor accounts.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => navigate("/doctors/create")}
              className="h-12 w-fit gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-black uppercase tracking-[0.12em] shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Doctor
            </Button>
          </header>

          <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative block w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search doctor, department, or specialty..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <div className="text-sm font-semibold text-slate-500">
              {loading ? "Loading..." : `${filteredDoctors.length} doctors found`}
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error?.message || "Failed to load doctors."}
            </div>
          )}

          <section className="grid gap-4 xl:grid-cols-2">
            {filteredDoctors.map((doctor) => {
              const profileImage =
                doctor.verificationdocument?.profilepicture ||
                doctor.profilepicture ||
                "";

              return (
                <article
                  key={doctor._id}
                  onClick={() => handleDoctorClick(doctor._id)}
                  className="group cursor-pointer rounded-xl bg-white/90 p-4 text-left shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(88,80,120,0.13)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={doctor.doctorname}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-sm font-black text-emerald-600">
                          {getInitials(doctor.doctorname)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-black text-slate-900">
                            {normalizeDoctorName(doctor.doctorname)}
                          </h2>
                          <p className="mt-0.5 text-xs font-bold text-emerald-600">
                            {doctor.department || "Department not set"}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                            Active
                          </span>
                          <button
                            type="button"
                            onClick={(event) => handleEditDoctor(event, doctor._id)}
                            className="rounded-full border border-emerald-100 bg-white p-2 text-emerald-600 transition hover:bg-emerald-50"
                            title="Edit doctor"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => handleDeleteDoctor(event, doctor)}
                            disabled={deletingDoctorId === doctor._id}
                            className="rounded-full border border-red-100 bg-white p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-60"
                            title="Delete doctor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span>{doctor.experience || "0 years"} exp</span>
                        <span>•</span>
                        <span className="truncate">
                          {doctor.specialization || "General Practice"}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <Stethoscope className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {doctor.qualification || "Qualification unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {!loading && filteredDoctors.length === 0 && (
            <div className="rounded-xl bg-white/90 py-14 text-center shadow-[0_18px_55px_rgba(88,80,120,0.09)]">
              <UserRound className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-700">No doctors found.</p>
              <p className="mt-1 text-sm text-slate-500">
                Registered doctors from the backend will appear here.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorList;
