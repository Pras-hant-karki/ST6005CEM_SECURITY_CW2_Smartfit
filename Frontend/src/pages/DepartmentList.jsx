import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllDepartments } from "@/services/patientApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  Baby,
  Bone,
  Brain,
  Building2,
  FlaskConical,
  Heart,
  Loader2,
  MessageCircle,
  Search,
  Siren,
  X,
  Venus,
} from "lucide-react";

const iconMap = {
  heart: Heart,
  brain: Brain,
  lab: FlaskConical,
  bone: Bone,
  baby: Baby,
  emergency: Siren,
  stethoscope: Building2,
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

function getDepartmentMeta(name = "") {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("cardio") || lowerName.includes("heart")) {
    return { iconKey: "heart", category: "surgery" };
  }
  if (lowerName.includes("neuro") || lowerName.includes("brain")) {
    return { iconKey: "brain", category: "diagnostics" };
  }
  if (lowerName.includes("pedia") || lowerName.includes("child")) {
    return { iconKey: "baby", category: "pediatrics" };
  }
  if (
    lowerName.includes("ob/gyn") ||
    lowerName.includes("obgyn") ||
    lowerName.includes("obstetric") ||
    lowerName.includes("gyne")
  ) {
    return { iconKey: "obgyn", category: "women-health" };
  }
  if (lowerName.includes("ortho") || lowerName.includes("bone")) {
    return { iconKey: "bone", category: "surgery" };
  }
  if (lowerName.includes("onco") || lowerName.includes("cancer")) {
    return { iconKey: "lab", category: "therapy" };
  }
  if (lowerName.includes("emergency") || lowerName.includes("urgent")) {
    return { iconKey: "emergency", category: "emergency" };
  }

  return { iconKey: "general", category: "diagnostics" };
}

function normalizeDepartment(dept, index) {
  const name = dept.deptname || dept.name || "General Medicine";
  const meta = getDepartmentMeta(name);

  return {
    _id: dept._id || name.toLowerCase(),
    deptname: name,
    description:
      dept.description ||
      "Explore our specialized doctors in this department with expert care and coordinated follow-up.",
    iconKey: dept.iconKey || meta.iconKey,
    color: dept.color || "general-green",
    category: dept.category || meta.category,
  };
}

function DepartmentsHero({ query, onQueryChange, onSearch }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(query);
  };

  return (
    <section className="py-16 lg:py-24 bg-gray-50/50 relative overflow-hidden rounded-3xl">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-50/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xs font-bold text-[#02B833] uppercase tracking-[0.2em]">
              Medical Excellence
            </p>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              Comprehensive Care
              <br />
              Across Every Specialty
            </h1>
            <p className="text-gray-500 leading-relaxed max-w-lg">
              Discover SMART medical departments staffed with trusted specialists and equipped for accurate diagnosis, treatment, and follow-up.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search departments, conditions..."
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#02B833]/20 focus:border-[#02B833] transition-all"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      onQueryChange("");
                      onSearch("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-8 py-3.5 bg-[#02B833] hover:bg-[#029E2C] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#02B833]/25 transition-all hover:-translate-y-0.5"
              >
                SEARCH
              </button>
            </form>
          </div>

          <div className="relative lg:-mr-6">
            <div className="relative min-h-[460px] lg:min-h-[560px] rounded-3xl overflow-hidden shadow-2xl bg-gray-900">
              <div
                className="absolute inset-0 bg-cover bg-center scale-105"
                style={{ backgroundImage: "url('/assets/department.png')" }}
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getCategoryLabel(value = "") {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function DepartmentFilters({ categories, activeFilter, setActiveFilter }) {
  const filters = [
    { name: "ALL SPECIALTIES", value: "all" },
    ...categories.map((category) => ({
      name: getCategoryLabel(category).toUpperCase(),
      value: category,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((spec) => (
        <button
          key={spec.value}
          onClick={() => setActiveFilter(spec.value)}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
            activeFilter === spec.value
              ? "bg-[#02B833] text-white shadow-lg shadow-[#02B833]/25"
              : "bg-white text-black border border-black hover:bg-gray-50"
          }`}
        >
          {spec.name}
        </button>
      ))}
    </div>
  );
}

function DepartmentCard({ dept }) {
  const navigate = useNavigate();
  const Icon = iconMap[dept.iconKey] || Building2;
  const colorClass = colorMap[dept.color] || colorMap["general-green"];

  return (
    <div className="bg-white rounded-2xl p-8 min-h-64 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center mb-6 shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      <h3 className="text-xl font-bold capitalize text-gray-900 mb-5">{dept.deptname}</h3>
      <p className="text-gray-500 text-sm leading-7 mb-6">{dept.description}</p>

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => navigate(`/departments/${dept.deptname.toLowerCase()}/doctors`)}
          className="flex items-center gap-1 text-sm font-semibold text-[#02B833] hover:text-[#029E2C] transition-colors"
        >
          VIEW SPECIALISTS
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function DepartmentsList({ departments, searchQuery }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const categories = useMemo(() => {
    return Array.from(
      new Set(departments.map((dept) => dept.category).filter(Boolean))
    ).sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b)));
  }, [departments]);

  useEffect(() => {
    if (activeFilter !== "all" && !categories.includes(activeFilter)) {
      setActiveFilter("all");
    }
  }, [activeFilter, categories]);

  const filtered = useMemo(() => {
    return departments.filter((dept) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        dept.deptname.toLowerCase().includes(query) ||
        dept.description.toLowerCase().includes(query);
      const matchesFilter = activeFilter === "all" || dept.category === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [departments, searchQuery, activeFilter]);

  return (
    <section className="py-12 bg-gray-50/50 rounded-3xl mt-4">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <DepartmentFilters
            categories={categories}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dept) => (
            <DepartmentCard key={dept._id} dept={dept} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No departments found matching your search.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function DepartmentsCta() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50/50 rounded-3xl mt-4">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="bg-white rounded-3xl p-8 lg:p-12 border border-gray-100 shadow-sm">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                Need assistance choosing
                <br />
                the right department?
              </h2>
              <p className="text-gray-500 leading-relaxed">
                Our medical advisors are available 24/7 to help guide you to the appropriate specialist based on your symptoms or medical history.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-[#02B833] hover:bg-[#029E2C] text-white rounded-full px-8 h-12 text-sm font-bold shadow-lg shadow-[#02B833]/25 transition-all hover:-translate-y-0.5">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  SPEAK WITH AN ADVISOR
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-8 h-12 text-sm font-bold bg-white text-black border border-black hover:bg-gray-50 transition-all"
                >
                  <Siren className="w-4 h-4 mr-2" />
                  EMERGENCY SERVICES
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="relative min-h-[360px] rounded-2xl overflow-hidden shadow-xl bg-gray-900">
                <div
                  className="absolute inset-0 bg-cover bg-center scale-105"
                  style={{ backgroundImage: "url('/assets/department.png')" }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DepartmentList() {
  const dispatch = useDispatch();
  const { departments, loading, error } = useSelector((state) => state.patient);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(getAllDepartments());
  }, [dispatch]);

  const visibleDepartments = useMemo(() => {
    const source = Array.isArray(departments) ? departments : [];
    return source.map(normalizeDepartment);
  }, [departments]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] bg-gray-50">
        <Loader2 className="w-12 h-12 text-[#02B833] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading departments...</p>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased bg-white">
      <DepartmentsHero query={query} onQueryChange={setQuery} onSearch={setSearchQuery} />

      {error && (
        <div className="container mx-auto px-6 lg:px-12 mt-4">
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4" />
              <AlertDescription>
              Live department data is temporarily unavailable. Please try again after the backend is running.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <DepartmentsList departments={visibleDepartments} searchQuery={searchQuery} />
      <DepartmentsCta />
    </div>
  );
}
