import { Button } from "@/components/ui/button";

export default function CtaBanner() {
  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-xl shadow-emerald-200/30">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 px-8 py-12 lg:px-16 lg:py-16 text-center space-y-5">
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Ready to prioritize your health?</h2>
            <p className="text-emerald-100 text-sm max-w-xl mx-auto leading-relaxed">Schedule a consultation with our world-class specialists today and start your journey to a healthier, smarter future.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" className="bg-[#02B833] text-white hover:bg-[#029E2C] rounded-full px-8 h-12 text-sm font-bold shadow-lg shadow-[#02B833]/25 transition-all hover:-translate-y-0.5">Book Appointment Now</Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-sm font-bold bg-white text-black border border-black hover:bg-gray-50 backdrop-blur-sm transition-all hover:-translate-y-0.5">Contact Our Team</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
