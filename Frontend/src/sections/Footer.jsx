import { MapPin, Phone, Share2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

const quickLinks = ["Departments", "Featured Doctors", "Virtual Consultations", "Medical Packages", "Careers"];
const policies = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
  { label: "Emergency Services", to: null },
  { label: "Patient Rights", to: null },
];

export default function Footer() {
  return (
    <footer className="bg-[#eef1f6]">
      <div className="container mx-auto px-6 lg:px-12 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="space-y-5">
            <img src={logo} alt="SMART" className="h-8 w-auto object-contain" />
            <p className="text-gray-500 text-sm leading-relaxed">
              Leading the way in digital healthcare and advanced medical treatments. 
              Compassion meets innovation at SMART Medical Institute.
            </p>
            <div className="flex gap-3">
              <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                <Share2 className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                <Mail className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-500 text-sm hover:text-emerald-600 transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Policies</h3>
            <ul className="space-y-3">
              {policies.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link to={link.to} className="text-gray-500 text-sm hover:text-emerald-600 transition-colors">{link.label}</Link>
                  ) : (
                    <a href="#" className="text-gray-500 text-sm hover:text-emerald-600 transition-colors">{link.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Location */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Location</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-gray-500 text-sm leading-relaxed">
                  Sinamangal, Kathmandu, Nepal
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-600 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-gray-500 text-sm">+977-1-4566742</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200/60">
        <div className="container mx-auto px-6 lg:px-12 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© 2024 SMART Medical Institute. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {["LinkedIn", "Twitter", "Facebook"].map((social) => (
                <a key={social} href="#" className="text-gray-400 text-sm hover:text-emerald-600 transition-colors">{social}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
