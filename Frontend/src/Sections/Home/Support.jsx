import { Phone, MapPin, Clock, Mail } from "lucide-react";

export default function Support() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-emerald-50/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-teal-50/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">We're Here to Help</h2>
          <p className="text-gray-500 text-sm leading-relaxed">Reach out to us anytime. Our dedicated support team is available around the clock to assist you.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Phone, title: "Call Us", info: "+977-1-4566742", desc: "24/7 Emergency Line" },
            { icon: Mail, title: "Email Us", info: "support@smarthealth.com.np", desc: "Response within 24h" },
            { icon: MapPin, title: "Visit Us", info: "Sinamangal, Kathmandu, Nepal", desc: "Our Location" },
            { icon: Clock, title: "Working Hours", info: "Mon - Sun", desc: "Open 24 Hours" },
          ].map((item, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all duration-300 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto">
                <item.icon className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="text-emerald-600 font-semibold text-sm mt-1">{item.info}</p>
                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
