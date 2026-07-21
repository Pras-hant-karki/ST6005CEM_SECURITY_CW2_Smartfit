const stats = [
  { value: "300+", label: "SPECIALIST DOCTORS" },
  { value: "24/7", label: "EMERGENCY CARE" },
  { value: "50k+", label: "HAPPY PATIENTS" },
];

export default function Stats() {
  return (
    <section className="relative z-20 -mt-10">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {stats.map((stat, i) => (
              <div key={i} className="text-center py-6 md:py-0">
                <p className="text-4xl lg:text-5xl font-bold text-emerald-600">{stat.value}</p>
                <p className="text-xs font-semibold text-gray-400 tracking-[0.2em] uppercase mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}