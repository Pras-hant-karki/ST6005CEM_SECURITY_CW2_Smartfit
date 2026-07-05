import { ArrowRight, Award, Eye, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "15+", label: "Years of Excellence" },
  { value: "50k+", label: "Patients Served" },
  { value: "300+", label: "Expert Physicians" },
  { value: "24/7", label: "Emergency Care" },
];

const milestones = [
  {
    year: "2009",
    title: "Founded in Kathmandu",
    desc: "Started as a patient-first medical initiative focused on accessible specialist care in Nepal.",
  },
  {
    year: "2018",
    title: "Digital Care Platform",
    desc: "Introduced online appointments, digital patient records, and faster department coordination.",
  },
  {
    year: "2026",
    title: "Smarter Healthcare",
    desc: "Expanding integrated care across diagnostics, consultations, prescriptions, and patient follow-up.",
  },
];

const leaders = [
  {
    name: "Dr. Prashant Karki",
    role: "Chief Executive Officer",
    desc: "Provides strategic leadership for SmartFit, driving innovation, patient-centered healthcare, and long-term organizational growth.",
    image: "/assets/ceo.png",
  },
  {
    name: "Dr. Nabin Giri",
    role: "Medical Director",
    desc: "Oversees clinical excellence, healthcare quality standards, and multidisciplinary medical operations across all departments.",
    image: "/assets/doctor2.png",
  },
  {
    name: "Dr. Sanket Sapkota",
    role: "Chief of Patient Care",
    desc: "Leads patient experience initiatives, ensuring compassionate care, safety, and seamless healthcare delivery.",
    image: "/assets/doctor3.png",
  },
  {
    name: "Dr. Sirish Kiran Pradhan",
    role: "Director of Clinical Operations",
    desc: "Manages healthcare services, operational efficiency, and continuous improvement of medical and support systems.",
    image: "/assets/doctor4.png",
  },
];

function AboutHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden rounded-3xl">
      <div className="absolute inset-0">
        <img
          src="/assets/about.png"
          alt="SMART Medical Institute"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
      </div>

      <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-100/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12 py-20 relative z-10">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 shadow-sm">
            <Award className="w-4 h-4" />
            Nepal-focused digital healthcare
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
            Defining the Future of{" "}
            <span className="text-emerald-600">Precision Medicine</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
            At SMART Medical Institute, we combine clinical excellence with modern technology to provide personalized healthcare for patients across Nepal.
          </p>
          <Button
            size="lg"
            className="bg-[#02B833] hover:bg-[#029E2C] text-white rounded-full px-8 h-13 text-base font-semibold shadow-lg shadow-[#02B833]/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            Explore Our Story
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function MissionVision() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50/50 relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Rocket className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            <p className="text-gray-500 leading-relaxed">
              To make advanced healthcare easier to access through transparent appointments, connected departments, accurate records, and compassionate care.
            </p>
          </div>

          <div className="bg-emerald-600 rounded-3xl p-8 lg:p-10 shadow-lg shadow-emerald-200/50 space-y-4 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Our Vision</h2>
            <p className="text-emerald-100 leading-relaxed">
              To become Nepal's most trusted smart medical ecosystem, where technology supports humane and reliable patient care.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutStats() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="bg-emerald-600 rounded-3xl p-8 lg:p-12 shadow-xl shadow-emerald-200/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <p className="text-4xl lg:text-5xl font-bold text-white">{stat.value}</p>
                <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Timeline() {
  return (
    <section className="py-16 lg:py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              A Legacy of <span className="text-emerald-600">Innovation</span>
            </h2>

            <div className="relative space-y-8">
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-200" />
              {milestones.map((milestone) => (
                <div key={milestone.year} className="relative flex gap-6">
                  <div className="relative z-10 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-md flex-shrink-0 mt-1" />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-emerald-600 font-bold text-lg">{milestone.year}:</span>
                      <span className="text-emerald-600 font-semibold">{milestone.title}</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{milestone.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-lg bg-gray-900 aspect-square">
              <img
                src="/assets/department.png"
                alt="SMART medical department"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg aspect-square">
              <img
                src="/assets/hero.png"
                alt="SMART hospital care"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Leadership() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50/50 relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Our Leadership Team
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Guided by clinicians dedicated to transparent, reliable, and patient-first healthcare.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {leaders.map((leader) => (
            <div
              key={leader.name}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 border border-gray-100"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={leader.image}
                  alt={leader.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-lg font-bold text-gray-900">{leader.name}</h3>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">{leader.role}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{leader.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-xl shadow-emerald-200/30">
          <div className="relative z-10 px-8 py-12 lg:px-16 lg:py-16 text-center space-y-5">
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Ready to experience smarter care?
            </h2>
            <p className="text-emerald-100 text-sm max-w-xl mx-auto leading-relaxed">
              Book a consultation with our specialists and start your healthcare journey with SMART.
            </p>
            <Button size="lg" className="bg-[#02B833] text-white hover:bg-[#029E2C] rounded-full px-8 h-12 text-sm font-bold shadow-lg shadow-[#02B833]/25 transition-all hover:-translate-y-0.5">
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <div className="font-sans antialiased bg-white">
      <AboutHero />
      <MissionVision />
      <AboutStats />
      <Timeline />
      <Leadership />
      <CtaBanner />
    </div>
  );
}
