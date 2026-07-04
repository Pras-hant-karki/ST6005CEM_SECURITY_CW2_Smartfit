import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Microscope,
  Pill,
  Plus,
  Settings,
  User,
} from "lucide-react";
import logo from "../../../assets/logo.png";
import { logoutPatient } from "@/services/patientApi";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "Profile", path: "/profile", icon: User },
  { label: "Appointments", path: "/appointments", icon: CalendarDays },
  { label: "Medical Records", path: "/records", icon: FileText },
  { label: "Billing", path: "/billing", icon: CreditCard, end: true },
  { label: "Prescriptions", path: "/prescriptions", icon: Pill },
  { label: "Lab Tests", path: "/labtests", icon: Microscope },
  { label: "Settings", path: "/profile/updateprofile", icon: Settings },
];

const patientCode = (patient) => {
  const raw = patient?._id || patient?.patientusername || patient?.email || "0000";
  return `SF-${raw.toString().slice(-4).toUpperCase()}`;
};

export default function PatientPortalLayout({ children, title, subtitle, action, showHeader = true }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { profile } = useSelector((state) => state.patient || {});
  const patient = profile || user || {};
  const avatar = patient.profilepicture || "/placeholder-user.png";
  const name = patient.patientname || "SmartFit Patient";
  const username = patient.patientusername ? `@${patient.patientusername}` : "Patient";

  const handleLogout = async () => {
    await dispatch(logoutPatient());
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f8f6ff] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white/85 px-5 py-8 shadow-sm backdrop-blur-xl lg:flex lg:flex-col">
        <button onClick={() => navigate("/")} className="mb-10 flex items-center gap-3">
          <img src={logo} alt="SmartFit" className="h-12 w-auto" />
        </button>

        <div className="mb-10 flex items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-3">
          <img src={avatar} alt={name} className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-emerald-600">{name}</p>
            <p className="truncate text-xs text-slate-500">{username}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={path}
              end={end ?? ["/dashboard", "/profile", "/records", "/profile/updateprofile"].includes(path)}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] transition ${
                  isActive
                    ? "bg-[#02B833] text-white shadow-lg shadow-emerald-500/25"
                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 border-t border-slate-200 pt-6 text-sm font-semibold text-slate-500 hover:text-emerald-700"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </aside>

      <main className="min-h-screen px-4 py-8 lg:ml-72 lg:px-8">
        {showHeader && (
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">{title}</h1>
              {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-extrabold text-emerald-700">
                Patient ID: {patientCode(patient)}
              </span>
              {action}
            </div>
          </div>
        )}

        {children}

        <button
          onClick={() => navigate("/doctors")}
          className="fixed bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#02B833] text-white shadow-2xl shadow-emerald-500/30 transition hover:-translate-y-1 hover:bg-[#029E2C]"
          aria-label="Book appointment"
        >
          <Plus className="h-8 w-8" />
        </button>
      </main>
    </div>
  );
}
