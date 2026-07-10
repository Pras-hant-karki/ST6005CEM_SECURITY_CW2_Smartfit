import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Search,
  User,
  UserRound,
} from "lucide-react";

import {
  adminGetAllAppointments,
  adminGetTodayAppointments,
} from "@/services/adminApi";
import LogoutButton from "@/components/custom/LogoutButton";
import AdminBrand from "@/components/custom/AdminBrand";

const statusOptions = ["All", "Confirmed", "Pending", "Completed", "Cancelled"];

const statusStyles = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-cyan-50 text-cyan-700",
  cancelled: "bg-rose-50 text-rose-700",
};

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  { label: "Appointments", icon: CalendarDays, path: "/appointments" },
  { label: "Doctors", icon: UserRound, path: "/doctors" },
  { label: "Departments", icon: Building2, path: "/departments" },
  { label: "Profile", icon: User, path: "/profile" },
];

const formatStatus = (status = "Pending") =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

const formatDate = (date) => {
  if (!date) return "--";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "--";
  return parsedDate.toISOString().slice(0, 10);
};

const getPatientName = (appointment) =>
  appointment?.patientdetails?.patientname ||
  appointment?.patientdetails?.patientusername ||
  "Unknown Patient";

const getDoctorName = (appointment) =>
  appointment?.doctordetails?.doctorname
    ? `Dr. ${appointment.doctordetails.doctorname}`
    : "Unassigned";

const getAppointmentCode = (appointment, index) =>
  appointment?.uniquecode || `APT-${String(index + 1).padStart(4, "0")}`;

const AdminAppointmentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isTodayPage = location.pathname === "/todayappointments";

  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");

  const {
    allAppointments = [],
    todayAppointments = [],
    loading,
    error,
  } = useSelector((state) => state.admin);

  useEffect(() => {
    if (isTodayPage) {
      dispatch(adminGetTodayAppointments());
      return;
    }

    dispatch(adminGetAllAppointments());
  }, [dispatch, isTodayPage]);

  const appointments = isTodayPage ? todayAppointments : allAppointments;

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const status = appointment.status?.toLowerCase() || "pending";
      const matchesStatus =
        activeStatus === "All" || status === activeStatus.toLowerCase();
      const patientName = getPatientName(appointment).toLowerCase();
      const doctorName = getDoctorName(appointment).toLowerCase();
      const code = String(appointment.uniquecode || "").toLowerCase();
      const matchesSearch =
        !query ||
        patientName.includes(query) ||
        doctorName.includes(query) ||
        code.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, appointments, search]);

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
              const active = item.path === "/appointments";

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
          <header className="mb-11">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {isTodayPage ? "Today's Appointments" : "Appointments"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor and manage all hospital appointments
            </p>
          </header>

          <section className="rounded-xl bg-white/90 p-5 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
              <label className="relative block flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search patient, doctor, or code..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>

              <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
                {statusOptions.map((status) => {
                  const active = activeStatus === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setActiveStatus(status)}
                      className={`h-11 shrink-0 rounded-xl px-4 text-xs font-black uppercase tracking-[0.12em] transition ${
                        active
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error?.message || "Failed to load appointments."}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Doctor</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredAppointments.map((appointment, index) => {
                    const status = appointment.status?.toLowerCase() || "pending";

                    return (
                      <tr
                        key={appointment._id}
                        className="cursor-pointer transition hover:bg-[#faf8ff]"
                        onClick={() => navigate(`/appointments/${appointment._id}`)}
                      >
                        <td className="py-4 font-mono text-xs font-semibold text-slate-500">
                          APT-{String(index + 1).padStart(4, "0")}
                        </td>
                        <td className="py-4 font-bold text-slate-800">
                          {getPatientName(appointment)}
                        </td>
                        <td className="py-4 text-slate-500">
                          {getDoctorName(appointment)}
                        </td>
                        <td className="py-4 text-slate-500">
                          {formatDate(appointment.appointmentdate)}
                        </td>
                        <td className="py-4 text-slate-500">
                          {appointment.appointmenttime || "--"}
                        </td>
                        <td className="py-4 font-mono text-xs font-bold text-emerald-600">
                          {getAppointmentCode(appointment, index)}
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
            </div>

            {!loading && filteredAppointments.length === 0 && (
              <div className="py-12 text-center">
                <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-700">
                  No appointments found.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Patient bookings will appear here automatically.
                </p>
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-sm font-semibold text-slate-500">
                Loading appointments...
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminAppointmentsPage;
