const steps = [
  { step: "1", title: "Choose Specialist", desc: "Browse our network of certified doctors and select the best match for your needs." },
  { step: "2", title: "Book Instantly", desc: "Pick a convenient time slot and book through our secure, glass-smooth interface." },
  { step: "3", title: "Get Care", desc: "Arrive at your appointment or join a virtual session for expert consultation." },
];

export default function Journey() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.03)_0%,transparent_60%)]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-teal-50/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Seamless Healthcare Journey</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200" />
          {steps.map((s, i) => (
            <div key={i} className="relative text-center space-y-4">
              <div className="relative inline-flex">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200/50 text-white text-2xl font-bold relative z-10">
                  {s.step}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}