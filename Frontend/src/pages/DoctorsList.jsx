import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getAllDoctors, getdoctorbydepartment } from "@/services/patientApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Briefcase,
  ChevronRight,
  GraduationCap,
  Loader2,
  Search,
  Stethoscope,
  X,
} from "lucide-react";

function formatDoctorName(name = "") {
  if (!name) return "Doctor";
  return name.trim().toLowerCase().startsWith("dr.") ? name : `Dr. ${name}`;
}

function titleCase(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDateKey(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function isDoctorAvailableOn(doctor, offsetDays) {
  const shifts = Array.isArray(doctor.shift) ? doctor.shift : [];
  const targetDay = getDateKey(offsetDays);
  return shifts.some((shift) => shift.day === targetDay);
}

function DoctorsHero({ deptname }) {
  return (
    <section className="pt-8 pb-6 bg-white rounded-3xl">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-gray-400 hover:text-emerald-600 transition-colors">
            SMART Medical Institute
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          {deptname ? (
            <>
              <Link to="/departments" className="text-gray-400 hover:text-emerald-600 transition-colors">
                Departments
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="text-emerald-600 font-medium">{deptname} Doctors</span>
            </>
          ) : (
            <span className="text-emerald-600 font-medium">Our Doctors</span>
          )}
        </div>

        <div className="max-w-2xl">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-3">
            {deptname ? `Find ${deptname} Specialists` : "Find Your Specialist"}
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Connect with trusted doctors across Nepal who are committed to accurate diagnosis,
            compassionate treatment, and long-term recovery.
          </p>
        </div>
      </div>
    </section>
  );
}

function DoctorFilters({
  departments,
  selectedDept,
  setSelectedDept,
  selectedAvailability,
  setSelectedAvailability,
  onClear,
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Department</h3>
        <div className="space-y-2">
          {departments.map((dept) => (
            <button
              key={dept.name}
              onClick={() => setSelectedDept(dept.name === selectedDept ? null : dept.name)}
              className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedDept === dept.name
                  ? "bg-[#02B833]/10 text-[#02B833] font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{dept.name}</span>
              <span className="text-xs text-gray-400">{dept.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Availability</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedAvailability(selectedAvailability === "today" ? null : "today")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedAvailability === "today"
                ? "bg-[#02B833] text-white shadow-lg shadow-[#02B833]/25"
                : "bg-white text-black border border-black hover:bg-gray-50"
            }`}
          >
            TODAY
          </button>
          <button
            onClick={() => setSelectedAvailability(selectedAvailability === "tomorrow" ? null : "tomorrow")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedAvailability === "tomorrow"
                ? "bg-[#02B833] text-white shadow-lg shadow-[#02B833]/25"
                : "bg-white text-black border border-black hover:bg-gray-50"
            }`}
          >
            TOMORROW
          </button>
        </div>
      </div>

      <button
        onClick={onClear}
        className="w-full py-3 rounded-xl bg-white text-black border border-black text-sm font-semibold hover:bg-gray-50 transition-all"
      >
        CLEAR ALL FILTERS
      </button>
    </div>
  );
}

function DoctorImage({ image, name, initial, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!image || imageFailed) {
    return (
      <div className={`flex items-center justify-center bg-emerald-50 font-bold text-emerald-600 ${className}`}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      onError={() => setImageFailed(true)}
      className={className}
    />
  );
}

function DoctorCard({ doctor, deptname, index, selectedAvailability }) {
  const navigate = useNavigate();
  const doctorId = doctor._id;
  const image =
    doctor.verificationdocument?.profilepicture ||
    doctor.profilepicture;
  const name = formatDoctorName(doctor.doctorname || doctor.name);
  const department = titleCase(doctor.department || "General Medicine");
  const specialty = doctor.specialization || doctor.specialty || department;
  const experience = doctor.experience || 0;
  const availableToday = isDoctorAvailableOn(doctor, 0);
  const availabilityLabel = selectedAvailability === "tomorrow" ? "AVAILABLE TOMORROW" : "AVAILABLE TODAY";
  const showAvailabilityBadge =
    selectedAvailability === "tomorrow" ? isDoctorAvailableOn(doctor, 1) : availableToday;

  const viewProfile = () => {
    if (!doctorId) return;
    if (deptname) {
      navigate(`/departments/${deptname}/doctors/${doctorId}`);
      return;
    }
    navigate(`/doctors/${doctorId}`);
  };

  const bookAppointment = () => {
    if (doctorId) {
      navigate(`/appointments/book-appointment/${doctorId}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      <div className="relative aspect-[4/3] overflow-hidden bg-emerald-50">
        <DoctorImage
          image={image}
          name={name}
          initial={(doctor.doctorname || "D").charAt(0).toUpperCase()}
          className="w-full h-full object-cover text-5xl transition-transform duration-500 group-hover:scale-105"
        />

        {showAvailabilityBadge && (
          <div className="absolute bottom-3 left-3 bg-[#02B833] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            {availabilityLabel}
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{name}</h3>
          <p className="text-sm font-semibold text-emerald-600">{specialty}</p>
          <p className="text-xs text-gray-400 mt-1">{department}</p>
        </div>

        <div className="grid gap-2 text-sm text-gray-500">
          {doctor.qualification && (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <span className="truncate">{doctor.qualification}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span>{experience}+ Years Exp.</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={bookAppointment}
            disabled={!doctorId}
            className="flex-1 bg-[#02B833] hover:bg-[#029E2C] text-white rounded-full h-10 text-sm font-semibold shadow-md shadow-[#02B833]/25 transition-all disabled:opacity-60"
          >
            BOOK NOW
          </Button>
          <Button
            onClick={viewProfile}
            disabled={!doctorId}
            variant="outline"
            className="flex-1 rounded-full h-10 text-sm font-semibold bg-white text-black border border-black hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            VIEW PROFILE
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorsList() {
  const dispatch = useDispatch();
  const { deptname } = useParams();
  const { doctors, loading, error } = useSelector((state) => state.patient);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (deptname) {
      dispatch(getdoctorbydepartment(deptname));
      return;
    }
    dispatch(getAllDoctors());
  }, [dispatch, deptname]);

  const sourceDoctors = Array.isArray(doctors) ? doctors : [];

  const departments = useMemo(() => {
    const counts = sourceDoctors.reduce((acc, doctor) => {
      const name = doctor.department || "General Medicine";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [sourceDoctors]);

  const filteredDoctors = useMemo(() => {
    return sourceDoctors.filter((doctor, index) => {
      const name = doctor.doctorname || doctor.name || "";
      const department = doctor.department || "General Medicine";
      const specialty = doctor.specialization || doctor.specialty || "";

      if (selectedDept && department !== selectedDept) return false;
      if (selectedAvailability === "today" && !isDoctorAvailableOn(doctor, 0)) return false;
      if (selectedAvailability === "tomorrow" && !isDoctorAvailableOn(doctor, 1)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return `${name} ${department} ${specialty}`.toLowerCase().includes(query);
      }
      return true;
    });
  }, [sourceDoctors, selectedDept, selectedAvailability, searchQuery]);

  const clearFilters = () => {
    setSelectedDept(null);
    setSelectedAvailability(null);
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] bg-gray-50">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading doctors...</p>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased bg-white">
      <DoctorsHero deptname={deptname} />

      <section className="py-8 bg-gray-50/50 min-h-screen rounded-3xl mt-4">
        <div className="container mx-auto px-6 lg:px-12">
          {error && (
            <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Live doctor data is temporarily unavailable. Please try again after the backend is running.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Filters</h2>
              <DoctorFilters
                departments={departments}
                selectedDept={selectedDept}
                setSelectedDept={setSelectedDept}
                selectedAvailability={selectedAvailability}
                setSelectedAvailability={setSelectedAvailability}
                onClear={clearFilters}
              />
            </aside>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{filteredDoctors.length}</span>{" "}
                    {filteredDoctors.length === 1 ? "doctor" : "doctors"} found
                  </p>
                </div>
                <div className="relative md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search doctor or department..."
                    className="w-full h-11 rounded-full border border-gray-200 bg-white pl-10 pr-10 text-sm outline-none transition-all focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor, index) => (
                  <DoctorCard
                    key={doctor._id || `${doctor.doctorname}-${index}`}
                    doctor={doctor}
                    deptname={deptname}
                    index={index}
                    selectedAvailability={selectedAvailability}
                  />
                ))}
              </div>

              {filteredDoctors.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Stethoscope className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No doctors found matching your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-emerald-600 font-semibold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
