import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Edit,
  LayoutDashboard,
  Mail,
  Phone,
  User,
  UserRound,
} from "lucide-react";

import { adminGetProfile } from "@/services/adminApi";
import LogoutButton from "@/components/custom/LogoutButton";
import AdminBrand from "@/components/custom/AdminBrand";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  { label: "Appointments", icon: CalendarDays, path: "/appointments" },
  { label: "Doctors", icon: UserRound, path: "/doctors" },
  { label: "Departments", icon: Building2, path: "/departments" },
  { label: "Profile", icon: User, path: "/profile" },
];

const getInitial = (name = "A") => name.trim().charAt(0).toUpperCase() || "A";

const ProfileField = ({ label, value, icon: Icon }) => (
  <div>
    <label className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </label>
    <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-[#f7f8fc] px-4 text-sm text-slate-700">
      {value || "Not available"}
    </div>
  </div>
);

const AdminProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { admin, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(adminGetProfile());
  }, [dispatch]);

  const adminName = admin?.adminname || "Admin User";
  const email = admin?.email || "admin@smartfit.com";
  const profileImage = admin?.verificationdocs?.profilepicture;

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
              const active = item.path === "/profile";

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
              Admin Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your administrator account
            </p>
          </header>

          {error && (
            <div className="mb-5 max-w-3xl rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error?.message || "Failed to load profile."}
            </div>
          )}

          {loading && !admin ? (
            <div className="max-w-3xl rounded-xl bg-white/90 py-14 text-center text-sm font-semibold text-slate-500 shadow-[0_18px_55px_rgba(88,80,120,0.09)]">
              Loading profile...
            </div>
          ) : (
            <div className="max-w-3xl space-y-5">
              <section className="rounded-xl bg-white/90 p-5 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-600 text-3xl font-black text-white">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={adminName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitial(adminName)
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black text-slate-950">
                      {adminName}
                    </h2>
                    <p className="mt-1 truncate text-sm font-bold text-emerald-600">
                      {email}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Hospital Administrator • SmartFit
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl bg-white/90 p-5 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      Account Details
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Core profile information from SmartFit admin records
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/profile/updateprofile")}
                    className="flex h-9 items-center gap-2 rounded-xl bg-slate-100 px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ProfileField label="Name" value={admin?.adminname} icon={User} />
                  <ProfileField label="Email" value={admin?.email} icon={Mail} />
                  <ProfileField
                    label="Phone"
                    value={admin?.phonenumber}
                    icon={Phone}
                  />
                  <ProfileField
                    label="Role"
                    value="Hospital Administrator"
                    icon={Building2}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/profile/updateprofile")}
                    className="h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                  >
                    Update Profile
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminProfile;
