import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllDoctors } from "@/services/patientApi";

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

function DoctorImage({ image, name, initial }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!image || imageFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-emerald-600">
        {initial}
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      onError={() => setImageFailed(true)}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
}

export default function Specialists() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { doctors = [], loading } = useSelector((state) => state.patient);
  const specialists = Array.isArray(doctors) ? doctors.slice(0, 4) : [];

  useEffect(() => {
    dispatch(getAllDoctors());
  }, [dispatch]);

  return (
    <section id="specialists" className="py-16 lg:py-20 bg-white relative">
      <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-50/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div className="max-w-xl space-y-2">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Meet Our Specialists</h2>
            <p className="text-gray-500 text-sm leading-relaxed">A community of elite practitioners dedicated to pioneering medical excellence and patient-first care.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/doctors")}
            className="rounded-full px-6 bg-white text-black border border-black hover:bg-gray-50 transition-all text-sm"
          >
            View All Doctors <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {loading && specialists.length === 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-2xl bg-emerald-50" />
            ))}
          </div>
        ) : specialists.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {specialists.map((doctor) => {
              const image = doctor.verificationdocument?.profilepicture || doctor.profilepicture;
              const name = formatDoctorName(doctor.doctorname);
              const role = doctor.specialization || titleCase(doctor.department || "General Medicine");

              return (
                <button
                  type="button"
                  key={doctor._id}
                  onClick={() => navigate(`/doctors/${doctor._id}`)}
                  className="group relative overflow-hidden rounded-2xl bg-white text-left border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-emerald-50">
                    <DoctorImage
                      image={image}
                      name={name}
                      initial={(doctor.doctorname || "D").charAt(0).toUpperCase()}
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{name}</h3>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">{role}</p>
                      <p className="mt-1 text-xs text-gray-400">{titleCase(doctor.department || "")}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-emerald-50/40 px-6 py-12 text-center">
            <Stethoscope className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h3 className="text-lg font-bold text-gray-900">No registered doctors yet</h3>
            <p className="mt-2 text-sm text-gray-500">Registered doctors will appear here after their profiles are created.</p>
          </div>
        )}
      </div>
    </section>
  );
}
