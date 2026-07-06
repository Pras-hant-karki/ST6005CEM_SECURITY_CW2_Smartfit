import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Baby, Bone, Brain, Building2, ChevronRight, FlaskConical, HeartPulse, Siren, Stethoscope, Venus } from "lucide-react";
import { getAllDepartments } from "@/services/patientApi";

const iconMap = {
  heart: HeartPulse,
  brain: Brain,
  baby: Baby,
  bone: Bone,
  lab: FlaskConical,
  emergency: Siren,
  stethoscope: Stethoscope,
  hospital: Building2,
  obgyn: Venus,
};

const colorMap = {
  "cardiac-red": "bg-rose-600",
  "neuro-purple": "bg-violet-600",
  "pediatric-blue": "bg-sky-500",
  "ortho-orange": "bg-orange-500",
  "oncology-teal": "bg-teal-600",
  "emergency-red": "bg-red-600",
  "diagnostic-indigo": "bg-indigo-600",
  "general-green": "bg-emerald-600",
  "obgyn-pink": "bg-fuchsia-600",
  pink: "bg-pink-600",
  purple: "bg-purple-600",
  blue: "bg-blue-600",
  orange: "bg-orange-500",
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
};

export default function Departments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { departments = [], loading } = useSelector((state) => state.patient);
  const visibleDepartments = Array.isArray(departments) ? departments.slice(0, 6) : [];

  useEffect(() => {
    dispatch(getAllDepartments());
  }, [dispatch]);

  return (
    <section className="pt-16 lg:pt-20 pb-16 lg:pb-20 bg-white relative">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-50/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-50/30 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="mb-12 flex flex-col items-center justify-between gap-5 text-center lg:flex-row lg:text-left">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">World-Class Specialized Care</h2>
            <p className="text-gray-500 leading-relaxed">Our departments are created and maintained by SmartFit administrators to reflect the services currently available.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/departments")}
            className="inline-flex h-12 items-center gap-3 rounded-full border border-black bg-white px-6 text-sm font-bold text-black transition hover:bg-gray-50"
          >
            View All Departments
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading && visibleDepartments.length === 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-2xl bg-emerald-50" />
            ))}
          </div>
        ) : visibleDepartments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleDepartments.map((dept) => {
              const Icon = iconMap[dept.iconKey] || Building2;
              const colorClass = colorMap[dept.color] || colorMap["general-green"];

              return (
                <button
                  type="button"
                  key={dept._id}
                  onClick={() => navigate(`/departments/${dept.deptname}/doctors`)}
                  className="group relative min-h-64 rounded-2xl bg-white p-8 text-left border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="relative z-10 space-y-5">
                    <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold capitalize text-gray-900">{dept.deptname}</h3>
                    <p className="text-gray-500 text-sm leading-7">{dept.description}</p>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      Learn More <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-emerald-50/40 px-6 py-12 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h3 className="text-lg font-bold text-gray-900">No departments available yet</h3>
            <p className="mt-2 text-sm text-gray-500">Departments created by admin will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
