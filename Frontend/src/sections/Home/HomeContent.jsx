import Hero from "./Hero";
import Stats from "./Stats";
import Departments from "./Department";
import Journey from "./Journey";
import Specialists from "./Specialists";
import PatientTrust from "./PatientTrust";
import Testimonials from "./Testimonials";
import FAQ from "./FAQs";
import Support from "./Support";
import CtaBanner from "./Ctabanner";

export default function HomeContent() {
  return (
    <div className="font-sans antialiased">
      <Hero />
      <Stats />
      <Departments />
      <Journey />
      <Specialists />
      <PatientTrust />
      <Testimonials />
      <FAQ />
      <Support />
      <CtaBanner />
    </div>
  );
}
