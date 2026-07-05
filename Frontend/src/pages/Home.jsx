import Hero from "../Sections/Home/Hero.jsx";
import Reviews from "../Sections/Home/Testimonials.jsx";
import FAQs from "../Sections/Home/FAQs.jsx";
import HomeContent from "@/Sections/Home/HomeContent.jsx";

export default function Home() {
  return (
    <div className="font-sans antialiased bg-white">
      {/* <Hero /> */}
      <HomeContent />
    </div>
  );
}
