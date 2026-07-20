import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  Loader2,
  ShieldAlert,
  User,
  UserRound,
} from "lucide-react";

import { adminGetSecurityDashboard } from "@/services/adminApi";
import LogoutButton from "@/components/custom/LogoutButton";
import AdminBrand from "@/components/custom/AdminBrand";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  { label: "Appointments", icon: CalendarDays, path: "/appointments" },
  { label: "Doctors", icon: UserRound, path: "/doctors" },
  { label: "Departments", icon: Building2, path: "/departments" },
  { label: "Security", icon: ShieldAlert, path: "/security" },
  { label: "Profile", icon: User, path: "/profile" },
];

// Polling-based summary of the last 24h of audit activity — no WebSocket,
// the admin refreshes or revisits the page to see current data.
const SecurityDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await dispatch(adminGetSecurityDashboard());
    if (res.meta.requestStatus === "fulfilled") {
      setData(res.payload);
      setError(null);
    } else {
      setError(res.payload?.message || "Failed to load security dashboard");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dispatch]);

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
              const active = item.path === "/security";

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
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Security</h1>
              <p className="mt-1 text-sm text-slate-500">Audit activity from the last 24 hours</p>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:text-slate-950"
            >
              Refresh
            </button>
          </header>

          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : (
            <>
              <section className="mb-7 rounded-xl bg-white/90 p-5 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur">
                <h2 className="mb-4 text-lg font-black">Failed Logins by IP</h2>
                {data?.failedLoginsByIp?.length ? (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                        <th className="pb-3">IP Address</th>
                        <th className="pb-3">Failed Attempts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.failedLoginsByIp.map((row) => (
                        <tr key={row.ip}>
                          <td className="py-3 font-mono text-slate-700">{row.ip}</td>
                          <td className="py-3 font-bold text-rose-600">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-slate-500">No failed logins in the last 24 hours.</p>
                )}
              </section>

              <section className="mb-7 rounded-xl bg-white/90 p-5 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur">
                <h2 className="mb-4 text-lg font-black">Event Counts</h2>
                {data?.eventCounts?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {data.eventCounts.map((row) => (
                      <div
                        key={`${row.action}-${row.result}`}
                        className={`rounded-lg border p-4 ${
                          row.result === "failure" ? "border-rose-100 bg-rose-50/60" : "border-emerald-100 bg-emerald-50/60"
                        }`}
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.action}</p>
                        <p className="mt-1 text-2xl font-black">{row.count}</p>
                        <p className="text-xs text-slate-500">{row.result}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No activity recorded in the last 24 hours.</p>
                )}
              </section>

              <section className="rounded-xl bg-white/90 p-5 shadow-[0_18px_55px_rgba(88,80,120,0.09)] backdrop-blur">
                <h2 className="mb-4 text-lg font-black">Recent Failures</h2>
                {data?.recentFailures?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                          <th className="pb-3">Time</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3">Action</th>
                          <th className="pb-3">IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.recentFailures.map((row) => (
                          <tr key={row._id}>
                            <td className="py-3 text-slate-500">{new Date(row.timestamp).toLocaleString()}</td>
                            <td className="py-3 text-slate-700">{row.userRole}</td>
                            <td className="py-3 text-slate-700">{row.action}</td>
                            <td className="py-3 font-mono text-slate-500">{row.ip}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No failures recorded in the last 24 hours.</p>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SecurityDashboard;
