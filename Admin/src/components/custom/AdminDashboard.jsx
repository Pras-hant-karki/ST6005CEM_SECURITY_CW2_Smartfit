import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ShieldAlert,
  Stethoscope,
  User,
  UserRound,
} from "lucide-react";

import {
  adminGetAllAppointments,
  adminGetAllDepartments,
  adminGetAllDoctors,
  adminGetTodayAppointments,
} from "@/services/adminApi";
import LogoutButton from "./LogoutButton";
import AdminBrand from "./AdminBrand";

const statusStyles = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-cyan-50 text-cyan-700",
  cancelled: "bg-rose-50 text-rose-700",
};

const formatStatus = (status = "Pending") =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

const formatDate = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const getDoctorCountForDepartment = (doctors, departmentName) =>
  doctors.filter((doctor) => doctor.department === departmentName).length;

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    doctors = [],
    allAppointments = [],
    todayAppointments = [],
    departments = [],
    loading,
  } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(adminGetAllDoctors());
    dispatch(adminGetAllAppointments());
    dispatch(adminGetTodayAppointments());
    dispatch(adminGetAllDepartments());
  }, [dispatch]);

  const completedToday = useMemo(
    () =>
      todayAppointments.filter(
        (appointment) => appointment.status?.toLowerCase() === "completed"
      ).length,
    [todayAppointments]
  );

  const stats = [
    {
      label: "Total Doctors",
      value: doctors.length,
      helper: doctors.length ? `${doctors.length} active` : "No doctors yet",
      icon: UserRound,
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Appointments",
      value: allAppointments.length,
      helper: `${todayAppointments.length} today`,
      icon: CalendarDays,
      tint: "bg-rose-50 text-rose-500",
    },
    {
      label: "Today's Appointments",
      value: todayAppointments.length,
      helper: `${completedToday} completed`,
      icon: ClipboardList,
      tint: "bg-sky-50 text-sky-600",
    },
    {
      label: "Departments",
      value: departments.length,
      helper: departments.length ? "All active" : "Create first department",
      icon: Building2,
      tint: "bg-violet-50 text-violet-600",
    },
  ];

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, path: "/" },
    { label: "Appointments", icon: CalendarDays, path: "/appointments" },
    { label: "Doctors", icon: UserRound, path: "/doctors" },
    { label: "Departments", icon: Building2, path: "/departments" },
    { label: "Security", icon: ShieldAlert, path: "/security" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className="-m-4 min-h-screen bg-[#faf8ff] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[214px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white/80 px-3 py-7 shadow-sm backdrop-blur lg:flex lg:flex-col">
          <AdminBrand onClick={() => navigate("/")} />

          <span className="mb-7 ml-3 w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            Admin Panel
          </span>

          <nav className="space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;

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
                Dashboard Overview
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {formatDate()} — SmartFit Medical Institute
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur hover:text-slate-950"
            >
              <User className="h-4 w-4" />
              Profile
            </button>
          </header>

          <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white bg-white/85 p-5 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tint}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      ▲ Active
                    </span>
                  </div>
                  <p className="text-3xl font-black">
                    {loading ? "..." : stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-xs font-bold text-emerald-600">
                    {stat.helper}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="mb-7 rounded-xl bg-white/90 p-5 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black">Today's Appointments</h2>
              <button
                type="button"
                onClick={() => navigate("/todayappointments")}
                className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600 hover:text-emerald-700"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Doctor</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {todayAppointments.slice(0, 5).map((appointment) => {
                    const status = appointment.status?.toLowerCase() || "pending";

                    return (
                      <tr
                        key={appointment._id}
                        className="cursor-pointer hover:bg-[#faf8ff]"
                        onClick={() => navigate(`/appointments/${appointment._id}`)}
                      >
                        <td className="py-4 font-bold text-slate-800">
                          {appointment.patientdetails?.patientname ||
                            "Unknown Patient"}
                        </td>
                        <td className="py-4 text-slate-500">
                          {appointment.doctordetails?.doctorname
                            ? `Dr. ${appointment.doctordetails.doctorname}`
                            : "Unassigned"}
                        </td>
                        <td className="py-4 text-slate-500">
                          {appointment.appointmenttime || "--"}
                        </td>
                        <td className="py-4 font-mono text-xs font-bold text-emerald-600">
                          {appointment.uniquecode || "SFAP"}
                        </td>
                        <td className="py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              statusStyles[status] || statusStyles.pending
                            }`}
                          >
                            {formatStatus(status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!loading && todayAppointments.length === 0 && (
                <div className="py-10 text-center">
                  <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-semibold text-slate-700">
                    No appointments scheduled for today.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    New bookings will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl bg-white/90 p-5 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black">Departments</h2>
              <button
                type="button"
                onClick={() => navigate("/departments")}
                className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600 hover:text-emerald-700"
              >
                Manage
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {departments.slice(0, 6).map((department) => (
                <button
                  key={department._id}
                  type="button"
                  onClick={() =>
                    navigate(`/departments/${department.deptname}/doctors`)
                  }
                  className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600">
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-bold text-slate-800">
                        {department.deptname}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {getDoctorCountForDepartment(
                          doctors,
                          department.deptname
                        )}{" "}
                        doctors
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {!loading && departments.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-700">
                  No departments yet.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/departments")}
                  className="mt-2 text-sm font-bold text-emerald-600"
                >
                  Create a department
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
