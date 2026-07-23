import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Menu, Home, Stethoscope, Calendar, User, Building2,
  ChevronDown, Pill, FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LogoutBtn from "../components/custom/logoutbutton";
import logo from "../../assets/logo.png";

export default function Navbar() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "HOME", slug: "/", active: true, icon: Home },
    { name: "DEPARTMENTS", slug: "/departments", active: true, icon: Building2 },
    { name: "DOCTORS", slug: "/doctors", active: true, icon: Stethoscope },
    { name: "ABOUT US", slug: "/about", active: true, icon: Calendar },
  ];

  const isActivePath = (slug) => {
    if (slug === "/") return location.pathname === "/";
    return location.pathname.startsWith(slug);
  };

  // "Book Appointment" browses doctors first (Meet Our Specialists on the
  // homepage) rather than jumping straight to registration — actually
  // booking a slot still requires login, enforced later by AuthLayout on
  // the /appointments/book-appointment/:doctorid route itself.
  const goToSpecialists = () => {
    if (location.pathname === "/") {
      document.getElementById("specialists")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#specialists");
    }
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100/50" : "bg-white border-b border-gray-100"
    }`}>
      <nav className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="SMART" className="h-10 w-auto object-contain" />
          </Link>

          <ul className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => item.active ? (
              <li key={item.name}>
                <button onClick={() => navigate(item.slug)}
                  className={`relative rounded-md px-1 py-5 text-sm font-medium tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-4 ${
                    isActivePath(item.slug) ? "text-emerald-600" : "text-gray-500 hover:text-gray-900"
                  }`}>
                  {item.name}
                  {isActivePath(item.slug) && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
                </button>
              </li>
            ) : null)}
          </ul>

          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors">
                    <Avatar className="w-9 h-9 ring-2 ring-emerald-100">
                      <AvatarImage src={user?.profilepicture} alt={user?.patientname || "User"} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-sm">
                        {user?.patientname?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden xl:block">
                      <p className="text-sm font-semibold text-gray-900">{user?.patientname || "User"}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 bg-white/95 backdrop-blur-xl border-gray-100 shadow-xl rounded-xl">
                  <DropdownMenuLabel className="text-gray-500 text-xs uppercase tracking-wider">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer rounded-lg mx-1 hover:bg-emerald-50 focus:bg-emerald-50">
                    <User className="w-4 h-4 mr-2 text-emerald-600" />My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/prescriptions")} className="cursor-pointer rounded-lg mx-1 hover:bg-emerald-50 focus:bg-emerald-50">
                    <Pill className="w-4 h-4 mr-2 text-emerald-600" />My Prescriptions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/labtests")} className="cursor-pointer rounded-lg mx-1 hover:bg-emerald-50 focus:bg-emerald-50">
                    <FlaskConical className="w-4 h-4 mr-2 text-emerald-600" />My Lab Tests
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem asChild className="rounded-lg mx-1"><div className="w-full"><LogoutBtn /></div></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors tracking-wide">LOGIN</button>
                <Button onClick={goToSpecialists} className="bg-[#02B833] hover:bg-[#029E2C] text-white rounded-full px-8 h-11 font-medium tracking-wide shadow-lg shadow-[#02B833]/25 transition-all hover:shadow-xl">BOOK APPOINTMENT</Button>
              </>
            )}
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-full"><Menu className="w-6 h-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] bg-white border-l border-gray-100">
              <SheetHeader className="pb-4 border-b border-gray-100">
                <SheetTitle className="flex items-center gap-3">
                  <img src={logo} alt="SMART" className="h-10 w-auto object-contain" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {navItems.map((item) => item.active ? (
                  <button key={item.name} onClick={() => { navigate(item.slug); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium tracking-wide transition-all ${
                      isActivePath(item.slug) ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50"
                    }`}>
                    <item.icon className={`w-5 h-5 ${isActivePath(item.slug) ? "text-emerald-600" : "text-gray-400"}`} />
                    {item.name}
                  </button>
                ) : null)}
                <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user?.profilepicture} className="object-cover" />
                          <AvatarFallback className="bg-emerald-600 text-white">{user?.patientname?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user?.patientname || "User"}</p>
                          <p className="text-xs text-gray-500">Patient</p>
                        </div>
                      </div>
                      <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all" onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}>
                        <User className="w-5 h-5 text-gray-400" />My Profile
                      </button>
                      <div className="px-4"><LogoutBtn className="w-full" /></div>
                    </>
                  ) : (
                    <>
                      <button className="w-full py-3.5 rounded-xl border border-black bg-white text-sm font-medium text-black hover:bg-gray-50 transition-all" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}>LOGIN</button>
                      <button className="w-full py-3.5 rounded-xl bg-[#02B833] text-white text-sm font-medium hover:bg-[#029E2C] transition-all shadow-lg shadow-[#02B833]/25" onClick={() => { goToSpecialists(); setMobileMenuOpen(false); }}>BOOK APPOINTMENT</button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
