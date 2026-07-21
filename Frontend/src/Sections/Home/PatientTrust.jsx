import { CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Amar Sigdel",
    role: "Cardiac Patient",
    quote: "The level of care and technological integration at SMART is unlike anything I've experienced. From booking to my post-surgery recovery, everything was seamless and incredibly professional.",
    image: "/assets/patient1.png"
  },
  {
    name: "Miraj Jung Thapa",
    role: "Sports Orthopedic Patient",
    quote: "As a professional athlete, I need the best orthopedics care. Dr. Vance and the team at SMART got me back on the field faster than I ever thought possible. Truly elite service.",
    image: "/assets/patient2.png"
  },
];

export default function PatientTrust() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50/50 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-50/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-50/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Patient Trust is Our Foundation</h2>
            </div>

            <div className="space-y-6">
              {testimonials.map((t, i) => (
                <div key={i} className="space-y-3">
                  <p className="text-gray-600 leading-relaxed text-sm italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-emerald-100">
                      <AvatarImage src={t.image} className="object-cover" />
                      <AvatarFallback className="bg-emerald-600 text-white text-xs">{t.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img src="/assets/testimonial.png" alt="Medical Team" className="w-full h-[420px] object-cover" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-emerald-600/95 backdrop-blur-xl rounded-xl p-6 text-white shadow-xl">
                  <h3 className="text-xl font-bold mb-1">Join over 50k+ patients</h3>
                  <p className="text-emerald-100 text-xs leading-relaxed mb-4">Experience healthcare designed for your life, your schedule, and your future.</p>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> <span>Trusted by leading medical institutions worldwide</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
