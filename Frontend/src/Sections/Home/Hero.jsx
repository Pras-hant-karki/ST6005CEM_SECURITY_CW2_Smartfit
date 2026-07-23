import { ArrowRight, Play, Award } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Hero() {
  const navigate = useNavigate();
  const location = useLocation();

  // Same destination as the navbar's "Book Appointment" button — browse
  // doctors first; actually booking a slot still requires login, enforced
  // later by AuthLayout on the /appointments/book-appointment/:doctorid route.
  const goToSpecialists = () => {
    if (location.pathname === "/") {
      document.getElementById("specialists")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#specialists");
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="/assets/hero.png" alt="Hospital Interior" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent" />
      </div>

      <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl" />
      <div className="absolute bottom-40 -left-20 w-[400px] h-[400px] bg-teal-100/30 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-100/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12 py-20 relative z-10">
        <div className="max-w-2xl space-y-6">
          <Badge variant="secondary" className="bg-emerald-50/90 backdrop-blur-sm text-emerald-700 border border-emerald-200/50 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
            <Award className="w-3 h-3 mr-1.5" />
            Excellence in Modern Medicine
          </Badge>

          <div className="space-y-3">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              Smart Healthcare for a{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Smarter Future</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Experience the next generation of healthcare where advanced technology meets compassionate care. Integrated systems for seamless patient experiences.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Button onClick={goToSpecialists} size="lg" className="bg-[#02B833] hover:bg-[#029E2C] text-white rounded-full px-8 h-13 text-base font-semibold shadow-lg shadow-[#02B833]/25 transition-all hover:shadow-xl hover:-translate-y-0.5">
              Book Your Consultation <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-13 text-base font-semibold bg-white text-black border border-black hover:bg-gray-50 backdrop-blur-sm transition-all hover:-translate-y-0.5">
              <Play className="w-5 h-5 mr-2 fill-emerald-600 text-emerald-600" /> Watch Our Story
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
