import { CalendarDays, ClipboardCheck, FileText, LayoutDashboard, LogOut, Microscope, Search, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import DoctorBrand from "./DoctorBrand";
import { logoutDoctor } from "@/services/doctorApi";

const PUBLIC_HOME_URL = import.meta.env.VITE_PUBLIC_HOME_URL || "http://localhost:5173/";
const PUBLIC_LOGOUT_URL = `${PUBLIC_HOME_URL.replace(/\/$/, "")}/?clearPatientSession=1`;

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Appointments", path: "/appointments", icon: CalendarDays },
  { label: "Verify Appointment", path: "/verify-appointment", icon: Search },
  { label: "Prescriptions", path: "/prescriptions", icon: FileText },
  { label: "Lab Tests", path: "/labtests", icon: Microscope },
  { label: "Profile", path: "/profile", icon: User },
];

const titleCase = (value) =>
  String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const DoctorSidebar = ({ doctor }) => {
  const dispatch = useDispatch();
  const profileImage = doctor?.profilepicture || doctor?.verificationdocument?.profilepicture;
  const doctorName = doctor?.doctorname || "Doctor";
  const department = titleCase(doctor?.department || "Department not set");

  const handleLogout = async () => {
    await dispatch(logoutDoctor());
    window.location.assign(PUBLIC_LOGOUT_URL);
  };

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <DoctorBrand />

      <div className="mt-5 w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
        Doctor Portal
      </div>

      <div className="mt-6 flex items-center gap-3">
        {profileImage ? (
          <img src={profileImage} alt={doctorName} className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-100" />
        ) : (
          <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 font-bold text-emerald-700 ring-2 ring-emerald-100">
            {doctorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-emerald-700">Dr. {doctorName}</p>
          <p className="truncate text-xs text-slate-500">{department}</p>
        </div>
      </div>

      <nav className="mt-11 space-y-2">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] transition ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                  : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DoctorSidebar;
