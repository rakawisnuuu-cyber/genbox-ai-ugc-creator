import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FiturSection from "@/components/FiturSection";
import CaraKerjaSection from "@/components/CaraKerjaSection";
import HargaSection from "@/components/HargaSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import AnimatedBackground from "@/components/AnimatedBackground";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <AnimatedBackground />
      <Navbar />
      <HeroSection />
      <FiturSection />
      <CaraKerjaSection />
      <HargaSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  );
};

export default Index;
