import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DibuatUntukSection from "@/components/DibuatUntukSection";
import FiturSection from "@/components/FiturSection";
import CaraKerjaSection from "@/components/CaraKerjaSection";
import HasilNyataSection from "@/components/HasilNyataSection";
import HargaSection from "@/components/HargaSection";
import ApiCostSection from "@/components/ApiCostSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedBackground />
      <Navbar />
      <HeroSection />
      <DibuatUntukSection />
      <FiturSection />
      <CaraKerjaSection />
      <HasilNyataSection />
      <HargaSection />
      <ApiCostSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  );
};

export default Index;
