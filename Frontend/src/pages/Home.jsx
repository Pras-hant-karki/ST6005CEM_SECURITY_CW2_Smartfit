import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import HomeContent from "@/Sections/Home/HomeContent.jsx";

export default function Home() {
  const location = useLocation();

  // Lets the navbar/hero "Book Appointment" buttons link straight to the
  // Specialists section, from any page — React Router doesn't scroll to a
  // hash on its own, so this does it once the section has actually mounted.
  useEffect(() => {
    if (location.hash === "#specialists") {
      document.getElementById("specialists")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  return (
    <div className="font-sans antialiased bg-white">
      <HomeContent />
    </div>
  );
}
